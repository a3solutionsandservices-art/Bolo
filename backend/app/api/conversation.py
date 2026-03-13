import base64
import json
import time
import uuid
from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.stt import get_stt
from app.core.tts import get_tts
from app.core.translation import get_translation_service
from app.core.language_detection import get_language_detector
from app.core.sentiment import get_sentiment_analyzer
from app.core.rag import get_rag_agent
from app.db.base import get_db
from app.middleware.auth import get_current_user
from app.models.conversation import Conversation, ConversationMode, ConversationStatus
from app.models.message import Message, MessageRole
from app.models.user import User
from app.services.usage import UsageService

router = APIRouter(prefix="/conversations", tags=["conversations"])


class StartConversationRequest(BaseModel):
    mode: ConversationMode = ConversationMode.CONVERSATION
    source_language: str = "en"
    target_language: str = "hi"
    knowledge_base_id: Optional[str] = None
    caller_id: Optional[str] = None
    caller_metadata: dict = {}


class MessageRequest(BaseModel):
    content: str
    is_audio: bool = False
    audio_base64: Optional[str] = None


class ConversationResponse(BaseModel):
    id: str
    session_id: str
    mode: str
    status: str
    source_language: str
    target_language: str
    message_count: int
    created_at: str


@router.post("", response_model=ConversationResponse, status_code=status.HTTP_201_CREATED)
async def start_conversation(
    body: StartConversationRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    conv = Conversation(
        tenant_id=current_user.tenant_id,
        knowledge_base_id=uuid.UUID(body.knowledge_base_id) if body.knowledge_base_id else None,
        mode=body.mode,
        source_language=body.source_language,
        target_language=body.target_language,
        caller_id=body.caller_id,
        caller_metadata=body.caller_metadata,
    )
    db.add(conv)
    await db.flush()

    await UsageService.record(
        db=db,
        tenant_id=current_user.tenant_id,
        conversation_id=conv.id,
        event_type="conversation",
        quantity=1,
        unit="session",
        source_language=body.source_language,
        target_language=body.target_language,
    )

    await db.commit()
    await db.refresh(conv)

    return ConversationResponse(
        id=str(conv.id),
        session_id=conv.session_id,
        mode=conv.mode,
        status=conv.status,
        source_language=conv.source_language,
        target_language=conv.target_language,
        message_count=0,
        created_at=conv.created_at.isoformat(),
    )


@router.get("")
async def list_conversations(
    skip: int = 0,
    limit: int = 20,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Conversation)
        .where(Conversation.tenant_id == current_user.tenant_id)
        .order_by(Conversation.created_at.desc())
        .offset(skip)
        .limit(limit)
    )
    convs = result.scalars().all()
    return [
        {
            "id": str(c.id),
            "session_id": c.session_id,
            "mode": c.mode,
            "status": c.status,
            "source_language": c.source_language,
            "target_language": c.target_language,
            "total_duration_seconds": c.total_duration_seconds,
            "overall_sentiment": c.overall_sentiment,
            "created_at": c.created_at.isoformat(),
        }
        for c in convs
    ]


@router.get("/{conversation_id}")
async def get_conversation(
    conversation_id: uuid.UUID,
    messages_skip: int = 0,
    messages_limit: int = 50,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Conversation).where(
            Conversation.id == conversation_id,
            Conversation.tenant_id == current_user.tenant_id,
        )
    )
    conv = result.scalar_one_or_none()
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")

    messages_result = await db.execute(
        select(Message)
        .where(Message.conversation_id == conv.id)
        .order_by(Message.created_at.asc())
        .offset(messages_skip)
        .limit(min(messages_limit, 100))
    )
    messages = messages_result.scalars().all()

    return {
        "id": str(conv.id),
        "session_id": conv.session_id,
        "mode": conv.mode,
        "status": conv.status,
        "source_language": conv.source_language,
        "target_language": conv.target_language,
        "overall_sentiment": conv.overall_sentiment,
        "overall_intent": conv.overall_intent,
        "total_duration_seconds": conv.total_duration_seconds,
        "created_at": conv.created_at.isoformat(),
        "ended_at": conv.ended_at.isoformat() if conv.ended_at else None,
        "messages_skip": messages_skip,
        "messages_limit": messages_limit,
        "messages": [
            {
                "id": str(m.id),
                "role": m.role,
                "content_original": m.content_original,
                "content_translated": m.content_translated,
                "detected_language": m.detected_language,
                "sentiment": m.sentiment,
                "intent": m.intent,
                "audio_url": m.audio_url,
                "rag_sources": m.rag_sources,
                "created_at": m.created_at.isoformat(),
            }
            for m in messages
        ],
    }


@router.post("/{conversation_id}/message")
async def send_message(
    conversation_id: uuid.UUID,
    body: MessageRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Conversation).where(
            Conversation.id == conversation_id,
            Conversation.tenant_id == current_user.tenant_id,
            Conversation.status == ConversationStatus.ACTIVE,
        )
    )
    conv = result.scalar_one_or_none()
    if not conv:
        raise HTTPException(status_code=404, detail="Active conversation not found")

    start_time = time.perf_counter()

    content = body.content
    detected_lang = conv.source_language

    if body.is_audio and body.audio_base64:
        audio_bytes = base64.b64decode(body.audio_base64)
        stt = get_stt()
        transcript = await stt.transcribe(audio_bytes)
        content = transcript.text
        detected_lang = transcript.language
        await UsageService.record(
            db=db,
            tenant_id=current_user.tenant_id,
            conversation_id=conv.id,
            event_type="stt",
            quantity=transcript.duration_seconds / 60,
            unit="minutes",
            source_language=detected_lang,
            model_used=transcript.provider,
        )

    detector = get_language_detector()
    lang_result = detector.detect(content)
    if lang_result.confidence > 0.8:
        detected_lang = lang_result.language

    sentiment_analyzer = get_sentiment_analyzer()
    sentiment = await sentiment_analyzer.analyze(content, detected_lang)

    user_msg = Message(
        conversation_id=conv.id,
        role=MessageRole.USER,
        content_original=content,
        detected_language=detected_lang,
        source_language=detected_lang,
        target_language=conv.target_language,
        sentiment=sentiment.sentiment,
        intent=sentiment.intent,
        intent_confidence=sentiment.intent_confidence,
    )
    db.add(user_msg)
    await db.flush()

    response_text = ""
    rag_sources: list[dict] = []

    if conv.mode in (ConversationMode.CONVERSATION, ConversationMode.AGENT):
        prev_messages_result = await db.execute(
            select(Message)
            .where(Message.conversation_id == conv.id)
            .order_by(Message.created_at.desc())
            .limit(10)
        )
        prev = list(reversed(prev_messages_result.scalars().all()))
        history = [
            {"role": m.role, "content": m.content_original}
            for m in prev
        ]

        rag = get_rag_agent()

        if conv.knowledge_base_id:
            from app.models.knowledge_base import KnowledgeBase

            kb_result = await db.execute(
                select(KnowledgeBase).where(KnowledgeBase.id == conv.knowledge_base_id)
            )
            kb = kb_result.scalar_one_or_none()
            namespace = kb.pinecone_namespace if kb else str(conv.tenant_id)
        else:
            namespace = str(conv.tenant_id)

        question_in_english = content
        if detected_lang != "en":
            translator = get_translation_service()
            trans = await translator.translate(content, detected_lang, "en")
            question_in_english = trans.translated_text
            await UsageService.record(
                db=db,
                tenant_id=current_user.tenant_id,
                conversation_id=conv.id,
                event_type="translation",
                quantity=len(content),
                unit="characters",
                source_language=detected_lang,
                target_language="en",
                model_used=trans.model_used,
            )

        response_text, rag_sources = await rag.generate_response(
            question=question_in_english,
            namespace=namespace,
            conversation_history=history,
            tenant_name=str(conv.tenant_id),
            response_language=conv.source_language,
        )

    elif conv.mode == ConversationMode.TRANSLATION:
        translator = get_translation_service()
        trans = await translator.translate(content, detected_lang, conv.target_language)
        response_text = trans.translated_text
        await UsageService.record(
            db=db,
            tenant_id=current_user.tenant_id,
            conversation_id=conv.id,
            event_type="translation",
            quantity=len(content),
            unit="characters",
            source_language=detected_lang,
            target_language=conv.target_language,
            model_used=trans.model_used,
        )

    tts_language = conv.target_language if conv.mode == ConversationMode.TRANSLATION else conv.source_language
    tts = get_tts()
    synth = await tts.synthesize(response_text, tts_language)
    await UsageService.record(
        db=db,
        tenant_id=current_user.tenant_id,
        conversation_id=conv.id,
        event_type="tts",
        quantity=len(response_text),
        unit="characters",
        source_language=tts_language,
        model_used=settings.SARVAM_TTS_MODEL,
    )

    audio_url = None
    try:
        from app.services.storage import upload_audio

        audio_url = await upload_audio(
            synth.audio_bytes,
            f"conversations/{conv.id}/messages/{uuid.uuid4()}.wav",
            conv.tenant_id,
        )
    except Exception:
        pass

    elapsed_ms = (time.perf_counter() - start_time) * 1000

    assistant_msg = Message(
        conversation_id=conv.id,
        role=MessageRole.ASSISTANT,
        content_original=response_text,
        source_language=conv.source_language,
        target_language=tts_language,
        audio_url=audio_url,
        rag_sources=rag_sources,
        processing_latency_ms=elapsed_ms,
    )
    db.add(assistant_msg)
    await db.commit()

    return {
        "message_id": str(assistant_msg.id),
        "text": response_text,
        "audio_base64": base64.b64encode(synth.audio_bytes).decode(),
        "audio_format": "wav",
        "rag_sources": rag_sources,
        "processing_time_ms": elapsed_ms,
        "sentiment": sentiment.sentiment,
        "intent": sentiment.intent,
    }


@router.get("/{conversation_id}/transcript")
async def get_transcript(
    conversation_id: uuid.UUID,
    format: str = "json",
    skip: int = 0,
    limit: int = 200,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Conversation).where(
            Conversation.id == conversation_id,
            Conversation.tenant_id == current_user.tenant_id,
        )
    )
    conv = result.scalar_one_or_none()
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")

    messages_result = await db.execute(
        select(Message)
        .where(Message.conversation_id == conv.id)
        .order_by(Message.created_at.asc())
        .offset(skip)
        .limit(min(limit, 500))
    )
    messages = messages_result.scalars().all()

    if format == "text":
        lines = []
        for m in messages:
            speaker = "User" if m.role == MessageRole.USER else "Assistant"
            ts = m.created_at.strftime("%H:%M:%S")
            lines.append(f"[{ts}] {speaker}: {m.content_original}")
        return "\n".join(lines)

    return {
        "conversation_id": str(conv.id),
        "session_id": conv.session_id,
        "source_language": conv.source_language,
        "target_language": conv.target_language,
        "started_at": conv.created_at.isoformat(),
        "ended_at": conv.ended_at.isoformat() if conv.ended_at else None,
        "skip": skip,
        "limit": limit,
        "messages": [
            {
                "timestamp": m.created_at.isoformat(),
                "role": m.role,
                "original": m.content_original,
                "translated": m.content_translated,
                "language": m.detected_language,
                "sentiment": m.sentiment,
                "intent": m.intent,
            }
            for m in messages
        ],
    }


@router.patch("/{conversation_id}/end", status_code=status.HTTP_200_OK)
async def end_conversation(
    conversation_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Conversation).where(
            Conversation.id == conversation_id,
            Conversation.tenant_id == current_user.tenant_id,
        )
    )
    conv = result.scalar_one_or_none()
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")

    conv.status = ConversationStatus.COMPLETED
    conv.ended_at = datetime.now(timezone.utc)
    await db.commit()
    return {"status": "completed"}
