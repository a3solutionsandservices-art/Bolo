from __future__ import annotations
import base64
import json
import time
import uuid
from typing import Optional

from fastapi import APIRouter, Depends, File, Form, HTTPException, Request, UploadFile, WebSocket, WebSocketDisconnect, status
from fastapi.responses import Response
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.limiter import limiter
from app.core.stt import get_stt
from app.core.tts import get_tts
from app.core.translation import get_translation_service
from app.core.language_detection import get_language_detector
from app.core.sentiment import get_sentiment_analyzer
from app.core.security import decode_token, hash_api_key
from app.db.base import get_db
from app.middleware.auth import get_current_user
from app.models.user import User
from app.models.api_key import APIKey
from app.services.usage import UsageService

router = APIRouter(prefix="/voice", tags=["voice"])

MAX_AUDIO_BYTES = settings.MAX_AUDIO_SIZE_MB * 1024 * 1024


class TranscribeResponse(BaseModel):
    text: str
    language: str
    language_probability: float
    duration_seconds: float
    confidence: float
    processing_time_ms: float


class SynthesizeRequest(BaseModel):
    text: str
    language: str = "hi"
    voice_id: Optional[str] = None
    speaking_rate: float = 1.0
    pitch: float = 0.0
    loudness: float = 1.0
    return_base64: bool = False


class SynthesizeResponse(BaseModel):
    audio_base64: Optional[str] = None
    audio_format: str
    language: str
    voice_id: str
    character_count: int
    processing_time_ms: float


class TranslateRequest(BaseModel):
    text: str
    source_language: str
    target_language: str


class TranslateResponse(BaseModel):
    translated_text: str
    source_language: str
    target_language: str
    model_used: str
    processing_time_ms: float
    character_count: int


class DetectLanguageRequest(BaseModel):
    text: str


class DetectLanguageResponse(BaseModel):
    language: str
    confidence: float
    language_name: str
    all_predictions: list[dict]


@router.post("/transcribe", response_model=TranscribeResponse)
@limiter.limit(settings.RATE_LIMIT_VOICE)
async def transcribe_audio(
    request: Request,
    audio: UploadFile = File(...),
    language: Optional[str] = Form(None),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    audio_bytes = await audio.read()
    if len(audio_bytes) > MAX_AUDIO_BYTES:
        raise HTTPException(status_code=413, detail=f"Audio exceeds {settings.MAX_AUDIO_SIZE_MB}MB limit")

    stt = get_stt()
    result = await stt.transcribe(audio_bytes, language=language)

    await UsageService.record(
        db=db,
        tenant_id=current_user.tenant_id,
        event_type="stt",
        quantity=result.duration_seconds / 60,
        unit="minutes",
        model_used=result.provider,
    )

    return TranscribeResponse(
        text=result.text,
        language=result.language,
        language_probability=result.language_probability,
        duration_seconds=result.duration_seconds,
        confidence=result.confidence,
        processing_time_ms=result.processing_time_ms,
    )


@router.post("/synthesize")
@limiter.limit(settings.RATE_LIMIT_VOICE)
async def synthesize_speech(
    request: Request,
    body: SynthesizeRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if body.language not in settings.SUPPORTED_LANGUAGES:
        raise HTTPException(status_code=400, detail=f"Unsupported language: {body.language}")

    tts = get_tts()
    result = await tts.synthesize(
        text=body.text,
        language=body.language,
        voice_id=body.voice_id,
        speaking_rate=body.speaking_rate,
        pitch=body.pitch,
        loudness=body.loudness,
    )

    await UsageService.record(
        db=db,
        tenant_id=current_user.tenant_id,
        event_type="tts",
        quantity=result.character_count,
        unit="characters",
        model_used="sarvam-bulbul:v1",
        target_language=body.language,
    )

    if body.return_base64:
        return SynthesizeResponse(
            audio_base64=base64.b64encode(result.audio_bytes).decode(),
            audio_format=result.audio_format,
            language=result.language,
            voice_id=result.voice_id,
            character_count=result.character_count,
            processing_time_ms=result.processing_time_ms,
        )

    return Response(
        content=result.audio_bytes,
        media_type="audio/wav",
        headers={
            "X-Processing-Time-Ms": str(result.processing_time_ms),
            "X-Voice-Id": result.voice_id,
        },
    )


@router.post("/translate", response_model=TranslateResponse)
async def translate_text(
    body: TranslateRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    translator = get_translation_service()
    result = await translator.translate(
        text=body.text,
        source_language=body.source_language,
        target_language=body.target_language,
    )

    await UsageService.record(
        db=db,
        tenant_id=current_user.tenant_id,
        event_type="translation",
        quantity=result.character_count,
        unit="characters",
        model_used=result.model_used,
        source_language=body.source_language,
        target_language=body.target_language,
    )

    return TranslateResponse(
        translated_text=result.translated_text,
        source_language=result.source_language,
        target_language=result.target_language,
        model_used=result.model_used,
        processing_time_ms=result.processing_time_ms,
        character_count=result.character_count,
    )


@router.post("/detect-language", response_model=DetectLanguageResponse)
async def detect_language(
    body: DetectLanguageRequest,
    current_user: User = Depends(get_current_user),
):
    detector = get_language_detector()
    result = detector.detect(body.text)
    return DetectLanguageResponse(
        language=result.language,
        confidence=result.confidence,
        language_name=settings.LANGUAGE_NAMES.get(result.language, result.language),
        all_predictions=[
            {
                "language": lang,
                "confidence": conf,
                "name": settings.LANGUAGE_NAMES.get(lang, lang),
            }
            for lang, conf in result.all_predictions
        ],
    )


async def _ws_authenticate(token: str, db: AsyncSession) -> Optional[User]:
    """Authenticate a WebSocket connection via JWT or API key."""
    from sqlalchemy import select
    from app.models.user import User as UserModel
    try:
        if token.startswith("vai_"):
            key_hash = hash_api_key(token)
            result = await db.execute(
                select(APIKey).where(APIKey.key_hash == key_hash, APIKey.is_active == True)
            )
            api_key = result.scalar_one_or_none()
            if not api_key:
                return None
            from app.models.user import UserRole
            user_result = await db.execute(
                select(UserModel).where(
                    UserModel.tenant_id == api_key.tenant_id,
                    UserModel.role == UserRole.TENANT_ADMIN,
                    UserModel.is_active == True,
                )
            )
            return user_result.scalar_one_or_none()
        else:
            payload = decode_token(token)
            if payload.get("type") != "access":
                return None
            user_id = payload.get("sub")
            result = await db.execute(
                select(UserModel).where(UserModel.id == uuid.UUID(user_id), UserModel.is_active == True)
            )
            return result.scalar_one_or_none()
    except Exception:
        return None


@router.websocket("/stream")
async def voice_stream(
    websocket: WebSocket,
    token: str,
    session_id: Optional[str] = None,
    source_language: str = "auto",
    target_language: str = "en",
    mode: str = "translation",
    db: AsyncSession = Depends(get_db),
):
    """
    WebSocket endpoint for real-time voice streaming.

    Requires ?token=<jwt_or_api_key> query parameter.
    Client sends binary audio chunks, server responds with JSON events:
    - {"type": "transcript", "text": "...", "language": "hi", "is_final": true}
    - {"type": "translation", "text": "...", "language": "en"}
    - {"type": "audio", "data": "<base64>", "format": "wav"}
    - {"type": "error", "message": "..."}
    """
    user = await _ws_authenticate(token, db)
    if not user:
        await websocket.close(code=4001)
        return

    await websocket.accept()
    stt = get_stt()
    translator = get_translation_service()
    tts = get_tts()
    detector = get_language_detector()

    audio_buffer = bytearray()

    try:
        while True:
            data = await websocket.receive()

            if "bytes" in data:
                audio_buffer.extend(data["bytes"])
                if len(audio_buffer) < 32000:
                    continue

                chunk = bytes(audio_buffer)
                audio_buffer.clear()

                try:
                    transcript = await stt.transcribe(chunk, language=None if source_language == "auto" else source_language)

                    detected_lang = transcript.language
                    await websocket.send_json({
                        "type": "transcript",
                        "text": transcript.text,
                        "language": detected_lang,
                        "confidence": transcript.confidence,
                        "is_final": True,
                    })

                    if mode == "translation" and detected_lang != target_language:
                        trans = await translator.translate(
                            transcript.text, detected_lang, target_language
                        )
                        await websocket.send_json({
                            "type": "translation",
                            "text": trans.translated_text,
                            "source_language": detected_lang,
                            "target_language": target_language,
                        })

                        synth = await tts.synthesize(trans.translated_text, target_language)
                        await websocket.send_json({
                            "type": "audio",
                            "data": base64.b64encode(synth.audio_bytes).decode(),
                            "format": "wav",
                            "language": target_language,
                        })

                except Exception as e:
                    await websocket.send_json({"type": "error", "message": str(e)})

            elif "text" in data:
                try:
                    msg = json.loads(data["text"])
                    if msg.get("type") == "end":
                        break
                    elif msg.get("type") == "config":
                        source_language = msg.get("source_language", source_language)
                        target_language = msg.get("target_language", target_language)
                        mode = msg.get("mode", mode)
                except Exception:
                    pass

    except WebSocketDisconnect:
        pass
    finally:
        await websocket.close()
