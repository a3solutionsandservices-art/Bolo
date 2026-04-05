import uuid
import logging
from typing import Optional

from fastapi import APIRouter, BackgroundTasks, Depends, Form, Query, Request, Response
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.rag import get_rag_agent
from app.core.translation import get_translation_service
from app.db.base import get_db
from app.models.missed_call import CallIntent, MissedCallLog, MissedCallStatus
from app.models.conversation import Conversation, ConversationMode, ConversationStatus
from app.models.message import Message, MessageRole
from app.services.missed_call_service import (
    build_exotel_payload,
    build_twilio_payload,
    finalize_call,
    trigger_outbound_call,
)
from app.api.telephony import TWILIO_LANG_MAP, _twiml_gather, _twiml_say_and_gather, _twiml_say_and_hangup

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/missed-call", tags=["missed-call-callback"])

_MISSED_STATUSES = {"no-answer", "busy", "failed", "canceled", "missed", "no_answer"}


async def _handle_missed_call(payload: dict, db: AsyncSession, background_tasks: BackgroundTasks) -> None:
    if payload["status"] not in _MISSED_STATUSES:
        return

    default_tenant_id: uuid.UUID | None = None
    if settings.TWILIO_DEFAULT_TENANT_ID:
        try:
            default_tenant_id = uuid.UUID(settings.TWILIO_DEFAULT_TENANT_ID)
        except ValueError:
            pass

    log = MissedCallLog(
        tenant_id=default_tenant_id,
        caller_number=payload["caller_number"],
        called_number=payload["called_number"],
        provider=payload["provider"],
        call_sid=payload["call_sid"],
        raw_webhook_payload=payload["raw"],
        status=MissedCallStatus.RECEIVED,
    )
    db.add(log)
    await db.commit()
    await db.refresh(log)

    background_tasks.add_task(trigger_outbound_call, log, db)
    logger.info("Missed call logged (id=%s) from %s — callback queued", log.id, log.caller_number)


@router.post("/webhook/twilio")
async def twilio_missed_call_webhook(
    request: Request,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
):
    form = await request.form()
    payload = build_twilio_payload(dict(form))
    await _handle_missed_call(payload, db, background_tasks)
    return Response(status_code=204)


@router.post("/webhook/exotel")
async def exotel_missed_call_webhook(
    request: Request,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
):
    form = await request.form()
    payload = build_exotel_payload(dict(form))
    await _handle_missed_call(payload, db, background_tasks)
    return Response(status_code=204)


@router.post("/callback-gather/{log_id}")
async def callback_gather(
    log_id: uuid.UUID,
    request: Request,
    SpeechResult: str = Form(default=""),
    Confidence: str = Form(default="0.0"),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(MissedCallLog).where(MissedCallLog.id == log_id))
    log = result.scalar_one_or_none()
    if not log:
        return Response(content=_twiml_say_and_hangup("Sorry, could not find your record.", "en-IN"), media_type="application/xml")

    action_url = f"{settings.API_BASE_URL}/api/v1/missed-call/callback-gather/{log_id}"
    lang_code = TWILIO_LANG_MAP.get(log.language_detected, "hi-IN")

    if not SpeechResult.strip():
        greeting = "Namaste! Aapka missed call mila. Apna sawaal batayein."
        return Response(content=_twiml_say_and_gather(greeting, action_url, lang_code), media_type="application/xml")

    conv_result = await db.execute(
        select(Conversation).where(Conversation.session_id == f"missed-call-{log_id}")
    )
    conv = conv_result.scalar_one_or_none()
    if not conv:
        conv = Conversation(
            tenant_id=log.tenant_id,
            session_id=f"missed-call-{log_id}",
            mode=ConversationMode.AGENT,
            status=ConversationStatus.ACTIVE,
            source_language=log.language_detected,
            target_language="hi",
            caller_id=log.caller_number,
            caller_metadata={"missed_call_log_id": str(log_id)},
        )
        db.add(conv)
        await db.flush()

    user_msg = Message(
        conversation_id=conv.id,
        role=MessageRole.USER,
        content_original=SpeechResult,
        detected_language=log.language_detected,
        source_language=log.language_detected,
        target_language="en",
        stt_confidence=float(Confidence) if Confidence else 0.0,
    )
    db.add(user_msg)
    await db.flush()

    translator = get_translation_service()
    rag = get_rag_agent()

    question_en = SpeechResult
    if log.language_detected != "en":
        trans = await translator.translate(SpeechResult, log.language_detected, "en")
        question_en = trans.translated_text

    namespace = str(log.tenant_id) if log.tenant_id else "default"
    response_en, _ = await rag.generate_response(
        question=question_en,
        namespace=namespace,
        conversation_history=[],
        tenant_name=namespace,
        response_language="en",
    )

    response_native = response_en
    if log.language_detected != "en":
        trans_back = await translator.translate(response_en, "en", log.language_detected)
        response_native = trans_back.translated_text

    assistant_msg = Message(
        conversation_id=conv.id,
        role=MessageRole.ASSISTANT,
        content_original=response_en,
        content_translated=response_native,
        source_language="en",
        target_language=log.language_detected,
    )
    db.add(assistant_msg)
    await db.commit()

    existing = log.conversation_transcript or []
    existing.append({"role": "user", "content": SpeechResult})
    existing.append({"role": "assistant", "content": response_native})
    log.conversation_transcript = existing
    await db.commit()

    return Response(
        content=_twiml_say_and_gather(response_native, action_url, lang_code),
        media_type="application/xml",
    )


@router.post("/callback-status/{log_id}")
async def callback_status(
    log_id: uuid.UUID,
    request: Request,
    CallStatus: str = Form(default=""),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(MissedCallLog).where(MissedCallLog.id == log_id))
    log = result.scalar_one_or_none()
    if not log:
        return Response(status_code=204)

    if CallStatus in ("completed",):
        transcript = log.conversation_transcript or []
        if transcript:
            await finalize_call(log, transcript, db)
        else:
            log.status = MissedCallStatus.CALLBACK_COMPLETED
            await db.commit()
    elif CallStatus in ("no-answer", "busy", "failed", "canceled"):
        log.status = MissedCallStatus.NO_ANSWER
        await db.commit()

    return Response(status_code=204)


@router.get("/logs")
async def list_missed_call_logs(
    status: Optional[str] = Query(None),
    intent: Optional[str] = Query(None),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    db: AsyncSession = Depends(get_db),
):
    stmt = select(MissedCallLog).order_by(MissedCallLog.received_at.desc())
    if status:
        try:
            stmt = stmt.where(MissedCallLog.status == MissedCallStatus(status))
        except ValueError:
            pass
    if intent:
        try:
            stmt = stmt.where(MissedCallLog.intent == CallIntent(intent))
        except ValueError:
            pass
    stmt = stmt.offset(offset).limit(limit)
    rows = (await db.execute(stmt)).scalars().all()
    return {
        "total": len(rows),
        "offset": offset,
        "limit": limit,
        "results": [
            {
                "id": str(r.id),
                "caller_number": r.caller_number,
                "called_number": r.called_number,
                "provider": r.provider,
                "status": r.status,
                "intent": r.intent,
                "intent_confidence": r.intent_confidence,
                "extracted_entities": r.extracted_entities,
                "language_detected": r.language_detected,
                "received_at": r.received_at.isoformat() if r.received_at else None,
                "callback_initiated_at": r.callback_initiated_at.isoformat() if r.callback_initiated_at else None,
                "callback_completed_at": r.callback_completed_at.isoformat() if r.callback_completed_at else None,
            }
            for r in rows
        ],
    }


@router.get("/logs/{log_id}")
async def get_missed_call_log(log_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(MissedCallLog).where(MissedCallLog.id == log_id))
    log = result.scalar_one_or_none()
    if not log:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Missed call log not found")
    return {
        "id": str(log.id),
        "caller_number": log.caller_number,
        "called_number": log.called_number,
        "provider": log.provider,
        "status": log.status,
        "intent": log.intent,
        "intent_confidence": log.intent_confidence,
        "extracted_entities": log.extracted_entities,
        "language_detected": log.language_detected,
        "conversation_transcript": log.conversation_transcript,
        "raw_webhook_payload": log.raw_webhook_payload,
        "callback_error": log.callback_error,
        "received_at": log.received_at.isoformat() if log.received_at else None,
        "callback_initiated_at": log.callback_initiated_at.isoformat() if log.callback_initiated_at else None,
        "callback_completed_at": log.callback_completed_at.isoformat() if log.callback_completed_at else None,
    }
