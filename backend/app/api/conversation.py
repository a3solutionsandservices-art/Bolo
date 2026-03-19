import base64
import time
import uuid
from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.rag import get_rag_agent
from app.core.sentiment import get_sentiment_analyzer
from app.db.base import get_db
from app.middleware.auth import get_current_user
from app.models.conversation import Conversation, ConversationMode, ConversationStatus
from app.models.knowledge_base import KnowledgeBase
from app.models.message import Message, MessageRole
from app.models.user import User
from app.services import ai_ops
from app.services.storage import upload_audio
from app.services.usage import UsageService

router = APIRouter(prefix="/conversations", tags=["conversations"])


class StartConversationRequest(BaseModel):
    mode: ConversationMode = ConversationMode.CONVERSATION
    source_language: str = "en"
    target_language: str = "hi"
    knowledge_base_id: Optional[str] = None
    caller_id: Optional[str] = None
    caller_metadata: dict = {}
    system_prompt: Optional[str] = Field(None, max_length=4000)


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


def _serialize_message(m: Message) -> dict:
    return {
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


def _serialize_transcript_message(m: Message) -> dict:
    return {
        "timestamp": m.created_at.isoformat(),
        "role": m.role,
        "original": m.content_original,
        "translated": m.content_translated,
        "language": m.detected_language,
        "sentiment": m.sentiment,
        "intent": m.intent,
    }


async def _get_conv_or_404(
    conversation_id: uuid.UUID,
    tenant_id: uuid.UUID,
    db: AsyncSession,
    require_active: bool = False,
) -> Conversation:
    filters = [
        Conversation.id == conversation_id,
        Conversation.tenant_id == tenant_id,
    ]
    if require_active:
        filters.append(Conversation.status == ConversationStatus.ACTIVE)

    result = await db.execute(select(Conversation).where(*filters))
    conv = result.scalar_one_or_none()
    if not conv:
        detail = "Active conversation not found" if require_active else "Conversation not found"
        raise HTTPException(status_code=404, detail=detail)
    return conv


async def _get_messages(
    conversation_id: uuid.UUID,
    db: AsyncSession,
    skip: int = 0,
    limit: int = 50,
    max_limit: int = 100,
    ascending: bool = True,
) -> list[Message]:
    order = Message.created_at.asc() if ascending else Message.created_at.desc()
    result = await db.execute(
        select(Message)
        .where(Message.conversation_id == conversation_id)
        .order_by(order)
        .offset(skip)
        .limit(min(limit, max_limit))
    )
    return result.scalars().all()


@router.post("", response_model=ConversationResponse, status_code=status.HTTP_201_CREATED)
async def start_conversation(
    body: StartConversationRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    metadata = dict(body.caller_metadata)
    if body.system_prompt:
        metadata["_system_prompt"] = body.system_prompt

    conv = Conversation(
        tenant_id=current_user.tenant_id,
        knowledge_base_id=uuid.UUID(body.knowledge_base_id) if body.knowledge_base_id else None,
        mode=body.mode,
        source_language=body.source_language,
        target_language=body.target_language,
        caller_id=body.caller_id,
        caller_metadata=metadata,
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
        .limit(min(limit, 100))
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
    conv = await _get_conv_or_404(conversation_id, current_user.tenant_id, db)
    messages = await _get_messages(conv.id, db, skip=messages_skip, limit=messages_limit)

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
        "messages": [_serialize_message(m) for m in messages],
    }


@router.post("/{conversation_id}/message")
async def send_message(
    conversation_id: uuid.UUID,
    body: MessageRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    conv = await _get_conv_or_404(conversation_id, current_user.tenant_id, db, require_active=True)
    start_time = time.perf_counter()

    content, detected_lang = await _resolve_input(body, conv, current_user.tenant_id, db)

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

    response_text, rag_sources = await _generate_response(conv, content, detected_lang, current_user.tenant_id, db, system_prompt_override=(conv.caller_metadata or {}).get("_system_prompt"))

    synth = await ai_ops.synthesize(
        text=response_text,
        language=conv.target_language if conv.mode == ConversationMode.TRANSLATION else conv.source_language,
        db=db,
        tenant_id=current_user.tenant_id,
        conversation_id=conv.id,
    )

    audio_url = None
    try:
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
        target_language=synth.language,
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


async def _resolve_input(
    body: MessageRequest,
    conv: Conversation,
    tenant_id: uuid.UUID,
    db: AsyncSession,
) -> tuple[str, str]:
    """Decode audio or use text; detect language. Returns (content, detected_language)."""
    content = body.content
    detected_lang = conv.source_language

    if body.is_audio and body.audio_base64:
        audio_bytes = base64.b64decode(body.audio_base64)
        transcript = await ai_ops.transcribe(audio_bytes, db, tenant_id, conv.id)
        content = transcript.text
        detected_lang = transcript.language

    detected_lang = ai_ops.detect_language(content, fallback=detected_lang)
    return content, detected_lang


async def _generate_response(
    conv: Conversation,
    content: str,
    detected_lang: str,
    tenant_id: uuid.UUID,
    db: AsyncSession,
    system_prompt_override: Optional[str] = None,
) -> tuple[str, list[dict]]:
    """Generate a response based on conversation mode. Returns (response_text, rag_sources)."""
    if conv.mode in (ConversationMode.CONVERSATION, ConversationMode.AGENT):
        prev = await _get_messages(conv.id, db, limit=10, ascending=False)
        history = [{"role": m.role, "content": m.content_original} for m in reversed(prev)]

        question = content
        if detected_lang != "en" and not system_prompt_override:
            trans = await ai_ops.translate(content, detected_lang, "en", db, tenant_id, conv.id)
            question = trans.translated_text

        namespace = await _resolve_namespace(conv, db)
        rag = get_rag_agent()
        return await rag.generate_response(
            question=question,
            namespace=namespace,
            conversation_history=history,
            tenant_name=str(conv.tenant_id),
            response_language=conv.source_language,
            system_prompt_override=system_prompt_override,
        )

    elif conv.mode == ConversationMode.TRANSLATION:
        trans = await ai_ops.translate(content, detected_lang, conv.target_language, db, tenant_id, conv.id)
        return trans.translated_text, []

    raise HTTPException(status_code=400, detail="No response generated for this conversation mode")


async def _resolve_namespace(conv: Conversation, db: AsyncSession) -> str:
    if not conv.knowledge_base_id:
        return str(conv.tenant_id)
    result = await db.execute(select(KnowledgeBase).where(KnowledgeBase.id == conv.knowledge_base_id))
    kb = result.scalar_one_or_none()
    return kb.pinecone_namespace if kb else str(conv.tenant_id)


@router.get("/{conversation_id}/transcript")
async def get_transcript(
    conversation_id: uuid.UUID,
    format: str = "json",
    skip: int = 0,
    limit: int = 200,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    conv = await _get_conv_or_404(conversation_id, current_user.tenant_id, db)
    messages = await _get_messages(conv.id, db, skip=skip, limit=limit, max_limit=200)

    if format == "text":
        lines = [
            f"[{m.created_at.strftime('%H:%M:%S')}] {'User' if m.role == MessageRole.USER else 'Assistant'}: {m.content_original}"
            for m in messages
        ]
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
        "messages": [_serialize_transcript_message(m) for m in messages],
    }


@router.patch("/{conversation_id}/end", status_code=status.HTTP_200_OK)
async def end_conversation(
    conversation_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    conv = await _get_conv_or_404(conversation_id, current_user.tenant_id, db)
    conv.status = ConversationStatus.COMPLETED
    conv.ended_at = datetime.now(timezone.utc)
    await db.commit()
    return {"status": "completed"}
