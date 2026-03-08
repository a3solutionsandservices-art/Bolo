from __future__ import annotations
import hashlib
import hmac
import time
import uuid

from fastapi import APIRouter, Form, Header, HTTPException, Request, Depends
from fastapi.responses import Response
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.stt import get_stt
from app.core.tts import get_tts
from app.core.translation import get_translation_service
from app.core.rag import get_rag_agent
from app.db.base import get_db
from app.models.conversation import Conversation, ConversationMode, ConversationStatus
from app.models.message import Message, MessageRole

router = APIRouter(prefix="/telephony", tags=["telephony"])


def _verify_twilio_signature(request_url: str, params: dict, signature: str) -> bool:
    """Validate Twilio webhook signature."""
    if not settings.TWILIO_AUTH_TOKEN:
        return True
    sorted_params = "".join(f"{k}{v}" for k, v in sorted(params.items()))
    message = request_url + sorted_params
    import base64
    computed = hmac.new(
        settings.TWILIO_AUTH_TOKEN.encode(),
        message.encode(),
        hashlib.sha1,
    ).digest()
    expected = base64.b64encode(computed).decode()
    return hmac.compare_digest(expected, signature)


def _twiml_gather(action_url: str, language: str = "hi-IN", timeout: int = 5) -> str:
    return f"""<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Gather input="speech" action="{action_url}" method="POST"
          language="{language}" speechTimeout="auto" timeout="{timeout}">
    <Say language="{language}">Namaste! Aap apna sawaal poochh sakte hain.</Say>
  </Gather>
  <Redirect>{action_url}</Redirect>
</Response>"""


def _twiml_say_and_gather(text: str, action_url: str, language: str = "hi-IN") -> str:
    return f"""<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say language="{language}">{text}</Say>
  <Gather input="speech" action="{action_url}" method="POST"
          language="{language}" speechTimeout="auto" timeout="5">
  </Gather>
  <Redirect>{action_url}</Redirect>
</Response>"""


def _twiml_say_and_hangup(text: str, language: str = "hi-IN") -> str:
    return f"""<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say language="{language}">{text}</Say>
  <Hangup/>
</Response>"""


TWILIO_LANG_MAP = {
    "hi": "hi-IN",
    "ta": "ta-IN",
    "te": "te-IN",
    "bn": "bn-IN",
    "gu": "gu-IN",
    "mr": "mr-IN",
    "en": "en-IN",
}


@router.post("/inbound")
async def twilio_inbound(
    request: Request,
    CallSid: str = Form(...),
    From: str = Form(...),
    To: str = Form(default=""),
    x_twilio_signature: str = Header(default=""),
    db: AsyncSession = Depends(get_db),
):
    form = await request.form()
    params = dict(form)

    if settings.TWILIO_AUTH_TOKEN and not _verify_twilio_signature(
        str(request.url), params, x_twilio_signature
    ):
        raise HTTPException(status_code=403, detail="Invalid Twilio signature")

    conv = Conversation(
        tenant_id=None,
        session_id=f"twilio-{CallSid}",
        mode=ConversationMode.AGENT,
        status=ConversationStatus.ACTIVE,
        source_language="hi",
        target_language="en",
        caller_id=From,
        caller_metadata={"call_sid": CallSid, "to": To},
    )
    db.add(conv)
    await db.commit()
    await db.refresh(conv)

    action_url = f"{settings.SARVAM_API_BASE.replace('api.sarvam.ai', 'api.vaaniai.com')}/api/v1/telephony/gather/{conv.id}"
    twiml = _twiml_gather(action_url, language="hi-IN")
    return Response(content=twiml, media_type="application/xml")


@router.post("/gather/{conversation_id}")
async def twilio_gather(
    conversation_id: uuid.UUID,
    request: Request,
    CallSid: str = Form(default=""),
    SpeechResult: str = Form(default=""),
    Confidence: str = Form(default="0.0"),
    x_twilio_signature: str = Header(default=""),
    db: AsyncSession = Depends(get_db),
):
    from sqlalchemy import select
    result = await db.execute(
        select(Conversation).where(Conversation.id == conversation_id)
    )
    conv = result.scalar_one_or_none()
    if not conv:
        twiml = _twiml_say_and_hangup("Sorry, conversation not found.")
        return Response(content=twiml, media_type="application/xml")

    speech_text = SpeechResult.strip()
    if not speech_text:
        action_url = f"/api/v1/telephony/gather/{conversation_id}"
        twiml = _twiml_gather(action_url, language=TWILIO_LANG_MAP.get(conv.source_language, "hi-IN"))
        return Response(content=twiml, media_type="application/xml")

    user_msg = Message(
        conversation_id=conv.id,
        role=MessageRole.USER,
        content_original=speech_text,
        detected_language=conv.source_language,
        source_language=conv.source_language,
        target_language=conv.target_language,
        stt_confidence=float(Confidence) if Confidence else 0.0,
    )
    db.add(user_msg)
    await db.flush()

    translator = get_translation_service()
    rag = get_rag_agent()

    question_en = speech_text
    if conv.source_language != "en":
        trans_result = await translator.translate(speech_text, conv.source_language, "en")
        question_en = trans_result.translated_text

    namespace = str(conv.tenant_id) if conv.tenant_id else "default"
    rag_result = await rag.answer(question_en, namespace=namespace, conversation_history=[])

    response_en = rag_result.answer
    response_native = response_en
    if conv.target_language != "en":
        trans_back = await translator.translate(response_en, "en", conv.target_language)
        response_native = trans_back.translated_text

    assistant_msg = Message(
        conversation_id=conv.id,
        role=MessageRole.ASSISTANT,
        content_original=response_en,
        content_translated=response_native,
        source_language="en",
        target_language=conv.target_language,
        rag_sources=rag_result.sources,
    )
    db.add(assistant_msg)
    await db.commit()

    action_url = f"/api/v1/telephony/gather/{conversation_id}"
    twiml_lang = TWILIO_LANG_MAP.get(conv.target_language, "hi-IN")
    twiml = _twiml_say_and_gather(response_native, action_url, language=twiml_lang)
    return Response(content=twiml, media_type="application/xml")


@router.post("/status")
async def twilio_status(
    CallSid: str = Form(...),
    CallStatus: str = Form(...),
    db: AsyncSession = Depends(get_db),
):
    from sqlalchemy import select, update

    session_id = f"twilio-{CallSid}"
    await db.execute(
        update(Conversation)
        .where(Conversation.session_id == session_id)
        .values(
            status=ConversationStatus.ENDED,
            ended_at=__import__("datetime").datetime.utcnow(),
        )
    )
    await db.commit()
    return Response(content="", status_code=204)
