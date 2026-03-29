"""
Convenience wrappers that combine an AI operation with UsageService.record in one call.

Using these eliminates the repetitive 4-6 line usage-recording boilerplate at every call
site in voice.py and conversation.py and ensures usage is always recorded consistently.
"""

import uuid
from typing import Optional

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.language_detection import get_language_detector
from app.core.stt import TranscriptionResult, get_stt
from app.core.translation import TranslationResult, get_translation_service
from app.core.tts import SynthesisResult, VoxtralTTS, get_tts
from app.services.usage import UsageService


async def transcribe(
    audio_bytes: bytes,
    db: AsyncSession,
    tenant_id: uuid.UUID,
    conversation_id: Optional[uuid.UUID] = None,
    language: Optional[str] = None,
) -> TranscriptionResult:
    result = await get_stt().transcribe(audio_bytes, language=language)
    await UsageService.record(
        db=db,
        tenant_id=tenant_id,
        conversation_id=conversation_id,
        event_type="stt",
        quantity=result.duration_seconds / 60,
        unit="minutes",
        source_language=result.language,
        model_used=result.provider,
    )
    return result


async def translate(
    text: str,
    source_language: str,
    target_language: str,
    db: AsyncSession,
    tenant_id: uuid.UUID,
    conversation_id: Optional[uuid.UUID] = None,
) -> TranslationResult:
    result = await get_translation_service().translate(text, source_language, target_language)
    await UsageService.record(
        db=db,
        tenant_id=tenant_id,
        conversation_id=conversation_id,
        event_type="translation",
        quantity=len(text),
        unit="characters",
        source_language=source_language,
        target_language=target_language,
        model_used=result.model_used,
    )
    return result


async def synthesize(
    text: str,
    language: str,
    db: AsyncSession,
    tenant_id: uuid.UUID,
    conversation_id: Optional[uuid.UUID] = None,
) -> SynthesisResult:
    tts = get_tts(language)
    result = await tts.synthesize(text, language)
    model_used = (
        settings.VOXTRAL_TTS_MODEL
        if isinstance(tts, VoxtralTTS)
        else settings.SARVAM_TTS_MODEL
    )
    await UsageService.record(
        db=db,
        tenant_id=tenant_id,
        conversation_id=conversation_id,
        event_type="tts",
        quantity=len(text),
        unit="characters",
        target_language=language,
        model_used=model_used,
    )
    return result


def detect_language(text: str, fallback: str = "en") -> str:
    result = get_language_detector().detect(text)
    return result.language if result.confidence > 0.8 else fallback
