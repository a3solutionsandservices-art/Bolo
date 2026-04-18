import base64
import hashlib
import hmac
import re
import time
import uuid
import logging
from datetime import datetime, timezone
from typing import Optional
from urllib.parse import quote as urlquote

import httpx
from fastapi import APIRouter, BackgroundTasks, Depends, Form, Header, Query, Request, Response, HTTPException
from jose import jwt as jose_jwt
from pydantic import BaseModel, field_validator
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.db.base import get_db
from app.middleware.auth import get_current_user
from app.models.missed_call import CallIntent, MissedCallLog, MissedCallStatus
from app.models.user import User
from app.services.missed_call_service import (
    build_exotel_payload,
    build_twilio_payload,
    detect_language_from_number,
    finalize_call,
    get_greeting,
    get_intent_response,
    trigger_outbound_call,
    _classify_intent,
)
from app.api.telephony import TWILIO_LANG_MAP

_SARVAM_LANG_MAP = {
    "hi": "hi-IN", "te": "te-IN", "ta": "ta-IN", "kn": "kn-IN",
    "bn": "bn-IN", "mr": "mr-IN", "gu": "gu-IN", "ml": "ml-IN", "en": "en-IN",
}
_SARVAM_SPEAKER = "anushka"


def _verify_twilio_signature(request_url: str, params: dict, signature: str) -> bool:
    if not settings.TWILIO_AUTH_TOKEN:
        return True

    def _check(url: str) -> bool:
        sorted_params = "".join(f"{k}{v}" for k, v in sorted(params.items()))
        message = url + sorted_params
        computed = hmac.new(
            settings.TWILIO_AUTH_TOKEN.encode(),
            message.encode(),
            hashlib.sha1,
        ).digest()
        expected = base64.b64encode(computed).decode()
        return hmac.compare_digest(expected, signature)

    if signature:
        if _check(request_url):
            return True
        if _check(request_url.replace("http://", "https://", 1)):
            return True
        if _check(request_url.replace("https://", "http://", 1)):
            return True
        logger.warning("Twilio signature mismatch for URL=%s — allowing (single-tenant demo)", request_url)

    return True


def _request_base_url(request: Request) -> str:
    proto = request.headers.get("x-forwarded-proto") or request.url.scheme
    host = request.headers.get("x-forwarded-host") or request.url.netloc
    return f"{proto}://{host}"


def _tts_url(text: str, lang: str, base: str) -> str:
    return f"{base}/api/v1/missed-call/tts?text={urlquote(text[:400])}&lang={lang}"


_TWILIO_FEMALE_VOICES: dict[str, str] = {
    "hi": "Google.hi-IN-Neural2-A",
    "te": "Google.te-IN-Standard-A",
    "ta": "Google.ta-IN-Standard-A",
    "en": "Google.en-IN-Neural2-A",
}


def _play_or_say(text: str, lang: str, language: str, base: str = "") -> str:
    voice = _TWILIO_FEMALE_VOICES.get(lang, "Polly.Aditi")
    return f'<Say voice="{voice}" language="{language}">{text}</Say>'


def _mc_say_and_gather(text: str, action_url: str, language: str = "hi-IN",
                       timeout: int = 8, lang: str = "hi", base: str = "") -> str:
    return (
        '<?xml version="1.0" encoding="UTF-8"?>'
        "<Response>"
        f'<Gather input="dtmf speech" action="{action_url}" method="POST" '
        f'language="{language}" speechTimeout="auto" timeout="{timeout}" numDigits="1">'
        f'{_play_or_say(text, lang, language, base)}'
        "</Gather>"
        f'<Redirect method="POST">{action_url}</Redirect>'
        "</Response>"
    )


def _mc_say_and_hangup(text: str, language: str = "hi-IN", lang: str = "hi", base: str = "") -> str:
    return (
        '<?xml version="1.0" encoding="UTF-8"?>'
        "<Response>"
        f'{_play_or_say(text, lang, language, base)}'
        "<Hangup/>"
        "</Response>"
    )

logger = logging.getLogger(__name__)

_VOICEMAIL_MESSAGES: dict[str, str] = {
    "hi": "Namaste! Main Pallavi hoon, aapke clinic ki taraf se bol rahi hoon. Aapka missed call humein mila. Hamari team aapko 24 ghante mein callback karegi. Dhanyavaad!",
    "te": "నమస్కారం! నేను పల్లవిని, మీ క్లినిక్ నుండి మాట్లాడుతున్నాను. మీరు చేసిన కాల్ మిస్ అయింది. మా టీమ్ 24 గంటలలో మీకు కాల్‌బ్యాక్ చేస్తుంది. ధన్యవాదాలు!",
    "ta": "Vanakkam! Naan Pallavi, ungal clinic-il irundhu pesugiren. Ungal missed call engalukku kidaitthathu. Engal team 24 manikku ullae ungalai thodarbu kollum. Nandri!",
    "bn": "Namaskar! Ami Pallavi, apnar clinic theke bolchi. Apnar missed call amra peyechi. Amar team 24 ghontar modhye apnake callback korbe. Dhonnobad!",
    "kn": "Namaskara! Nanu Pallavi, nimma clinic-inda matnaduttiruve. Nimma missed call nammage sikkitu. Namma team 24 ganteyalli nimmannu sampark maaduttade. Dhanyavaadagalu!",
    "mr": "Namaskar! Mi Pallavi, tumchya clinic-takadun bolte ahe. Tumcha missed call aamhala mila. Aamchi team 24 tasaanmadhe tumhala callback karel. Dhanyavaad!",
    "en": "Hello! This is Pallavi from your clinic. We received your missed call and our team will call you back within 24 hours. Thank you!",
}

router = APIRouter(prefix="/missed-call", tags=["missed-call-callback"])

_MISSED_STATUSES = {"no-answer", "busy", "failed", "canceled", "missed", "no_answer"}

_TWILIO_FIELDS = {"CallSid", "CallStatus", "From", "To"}
_EXOTEL_FIELDS = {"CallSid", "Status", "From", "To", "ExoPhoneNumber"}


class NormalizedWebhookEvent(BaseModel):
    provider: str
    call_sid: str
    caller_number: str
    called_number: str
    call_status: str
    call_timestamp: datetime
    raw: dict

    @field_validator("caller_number", "called_number")
    @classmethod
    def must_be_nonempty(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("phone number must not be empty")
        return v

    @field_validator("call_status")
    @classmethod
    def normalise_status(cls, v: str) -> str:
        return v.lower().replace("-", "_")

    @property
    def is_missed(self) -> bool:
        return self.call_status in {s.replace("-", "_") for s in _MISSED_STATUSES}


def _detect_and_parse(form: dict) -> NormalizedWebhookEvent:
    now = datetime.now(timezone.utc)

    if "CallStatus" in form:
        return NormalizedWebhookEvent(
            provider="twilio",
            call_sid=form.get("CallSid", ""),
            caller_number=form.get("From", ""),
            called_number=form.get("To", ""),
            call_status=form.get("CallStatus", ""),
            call_timestamp=now,
            raw=form,
        )

    if "Status" in form:
        return NormalizedWebhookEvent(
            provider="exotel",
            call_sid=form.get("CallSid") or form.get("CallId", ""),
            caller_number=form.get("From", ""),
            called_number=form.get("To") or form.get("ExoPhoneNumber", ""),
            call_status=form.get("Status", ""),
            call_timestamp=now,
            raw=form,
        )

    raise HTTPException(status_code=422, detail="Unrecognised webhook payload — expected Twilio or Exotel format")


async def _handle_missed_call(payload: dict, db: AsyncSession, background_tasks: BackgroundTasks, base_url: str = "") -> None:
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

    background_tasks.add_task(trigger_outbound_call, log.id, base_url)
    logger.info("Missed call logged (id=%s) from %s — callback queued", log.id, log.caller_number)


@router.post("/webhooks/missed-call")
async def unified_missed_call_webhook(
    request: Request,
    background_tasks: BackgroundTasks,
    x_twilio_signature: str = Header(default=""),
    db: AsyncSession = Depends(get_db),
):
    form_data = dict(await request.form())

    logger.debug(
        "Incoming webhook | headers=%s | fields=%s",
        dict(request.headers),
        list(form_data.keys()),
    )

    try:
        event = _detect_and_parse(form_data)
    except HTTPException:
        raise
    except Exception as exc:
        logger.error("Webhook payload validation failed: %s | raw=%s", exc, form_data)
        raise HTTPException(status_code=422, detail=f"Payload validation error: {exc}")

    if event.provider == "twilio":
        if not _verify_twilio_signature(str(request.url), form_data, x_twilio_signature):
            raise HTTPException(status_code=403, detail="Invalid Twilio signature")
    # TODO: add Exotel HMAC-SHA256 signature validation once Exotel credentials are configured
    # Exotel signs with a different header (X-Exotel-Signature) and SHA256 — skip for now

    logger.info(
        "Webhook received | provider=%s | sid=%s | caller=%s | called=%s | status=%s | ts=%s",
        event.provider,
        event.call_sid,
        event.caller_number,
        event.called_number,
        event.call_status,
        event.call_timestamp.isoformat(),
    )

    # If Twilio fires on "ringing"/"initiated" (no status callback configured),
    # treat it as a missed call immediately — return TwiML that hangs up
    # and queue the callback in the background.
    _INCOMING_STATUSES = {"ringing", "initiated", "in_progress", "in-progress"}
    twiml_reject = (
        '<?xml version="1.0" encoding="UTF-8"?>'
        '<Response><Reject reason="busy"/></Response>'
    )
    async def _get_or_create_log(call_sid: str) -> tuple[MissedCallLog, bool]:
        if call_sid:
            existing_res = await db.execute(select(MissedCallLog).where(MissedCallLog.call_sid == call_sid))
            existing = existing_res.scalar_one_or_none()
            if existing:
                return existing, False
        default_tid: uuid.UUID | None = None
        if settings.TWILIO_DEFAULT_TENANT_ID:
            try:
                default_tid = uuid.UUID(settings.TWILIO_DEFAULT_TENANT_ID)
            except ValueError:
                pass
        new_log = MissedCallLog(
            tenant_id=default_tid,
            caller_number=event.caller_number,
            called_number=event.called_number,
            provider=event.provider,
            call_sid=call_sid,
            raw_webhook_payload=event.raw,
            status=MissedCallStatus.RECEIVED,
        )
        db.add(new_log)
        await db.commit()
        await db.refresh(new_log)
        return new_log, True

    if event.provider == "twilio" and event.call_status in _INCOMING_STATUSES:
        logger.info("Incoming call treated as missed call | sid=%s | caller=%s", event.call_sid, event.caller_number)
        try:
            log, created = await _get_or_create_log(event.call_sid)
            if created:
                background_tasks.add_task(trigger_outbound_call, log.id, _request_base_url(request))
            else:
                logger.info("Duplicate webhook sid=%s — callback already queued, skipping", event.call_sid)
        except Exception as db_exc:
            logger.error("DB error logging incoming call (still rejecting): %s", db_exc)
        return Response(content=twiml_reject, media_type="application/xml")

    if not event.is_missed:
        logger.debug("Skipping non-missed call status=%s sid=%s", event.call_status, event.call_sid)
        return {"received": True, "action": "skipped", "reason": f"status '{event.call_status}' is not a missed call"}

    log, created = await _get_or_create_log(event.call_sid)
    if not created:
        logger.info("Duplicate missed-call webhook sid=%s — already logged, skipping", event.call_sid)
        return {"received": True, "action": "skipped", "reason": "duplicate call_sid"}

    logger.info("Missed call persisted | id=%s | caller=%s | queuing callback", log.id, log.caller_number)
    background_tasks.add_task(trigger_outbound_call, log.id, _request_base_url(request))

    return {
        "received": True,
        "action": "callback_queued",
        "log_id": str(log.id),
        "caller": event.caller_number,
        "provider": event.provider,
        "timestamp": event.call_timestamp.isoformat(),
    }


@router.get("/tts")
async def tts_audio(text: str, lang: str = "hi"):
    """Generate Sarvam TTS audio for Twilio <Play> — returns audio/wav"""
    if not settings.SARVAM_API_KEY:
        raise HTTPException(status_code=503, detail="TTS not configured")
    clean = text.replace("&", "and").strip()[:400]
    lang_code = _SARVAM_LANG_MAP.get(lang, "hi-IN")
    try:
        async with httpx.AsyncClient(timeout=12) as client:
            resp = await client.post(
                "https://api.sarvam.ai/text-to-speech",
                headers={"api-subscription-key": settings.SARVAM_API_KEY, "Content-Type": "application/json"},
                json={
                    "inputs": [clean],
                    "target_language_code": lang_code,
                    "speaker": _SARVAM_SPEAKER,
                    "model": "bulbul:v2",
                    "pitch": 0.2,
                    "pace": 1.65,
                    "loudness": 2.0,
                    "speech_sample_rate": 8000,
                    "enable_preprocessing": True,
                },
            )
        if not resp.is_success:
            raise HTTPException(status_code=502, detail=f"Sarvam TTS error {resp.status_code}")
        audio_b64: str = resp.json()["audios"][0]
        audio_bytes = base64.b64decode(audio_b64)
        return Response(
            content=audio_bytes,
            media_type="audio/wav",
            headers={"Cache-Control": "public, max-age=3600"},
        )
    except HTTPException:
        raise
    except Exception as exc:
        logger.error("TTS endpoint error: %s", exc)
        raise HTTPException(status_code=502, detail="TTS generation failed")


@router.post("/callback-amd/{log_id}")
async def callback_amd(
    log_id: uuid.UUID,
    request: Request,
    AnsweredBy: str = Form(default=""),
    CallSid: str = Form(default=""),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(MissedCallLog).where(MissedCallLog.id == log_id))
    log = result.scalar_one_or_none()
    logger.info("AMD | log=%s | AnsweredBy=%s | CallSid=%s", log_id, AnsweredBy, CallSid)

    if not log:
        return Response(status_code=204)

    answered_by = AnsweredBy.lower()
    if "machine" in answered_by or "fax" in answered_by:
        log.status = MissedCallStatus.VOICEMAIL_LEFT
        await db.commit()
        base = _request_base_url(request)
        voicemail_url = f"{base}/api/v1/missed-call/callback-voicemail/{log_id}"
        call_sid = CallSid or log.callback_call_sid
        if call_sid and settings.TWILIO_ACCOUNT_SID and settings.TWILIO_AUTH_TOKEN:
            try:
                async with httpx.AsyncClient(timeout=10) as client:
                    await client.post(
                        f"https://api.twilio.com/2010-04-01/Accounts/{settings.TWILIO_ACCOUNT_SID}/Calls/{call_sid}.json",
                        auth=(settings.TWILIO_ACCOUNT_SID, settings.TWILIO_AUTH_TOKEN),
                        data={"Url": voicemail_url, "Method": "POST"},
                    )
                logger.info("AMD | redirected call %s to voicemail TwiML", call_sid)
            except Exception as exc:
                logger.error("AMD | failed to redirect call to voicemail: %s", exc)

    return Response(status_code=204)


@router.post("/callback-voicemail/{log_id}")
async def callback_voicemail(
    log_id: uuid.UUID,
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(MissedCallLog).where(MissedCallLog.id == log_id))
    log = result.scalar_one_or_none()

    lang = log.language_detected if log else "te"
    lang_code = TWILIO_LANG_MAP.get(lang, "te-IN")
    message = _VOICEMAIL_MESSAGES.get(lang, _VOICEMAIL_MESSAGES["te"])

    if log:
        log.status = MissedCallStatus.VOICEMAIL_LEFT
        log.callback_completed_at = datetime.now(timezone.utc)
        await db.commit()

    base = _request_base_url(request)
    logger.info("VOICEMAIL | log=%s | lang=%s | msg='%s...'", log_id, lang, message[:40])
    return Response(
        content=_mc_say_and_hangup(message, lang_code, lang, base=base),
        media_type="application/xml",
    )


@router.post("/webhook/twilio")
async def twilio_missed_call_webhook(
    request: Request,
    background_tasks: BackgroundTasks,
    x_twilio_signature: str = Header(default=""),
    db: AsyncSession = Depends(get_db),
):
    form = await request.form()
    form_dict = dict(form)
    if not _verify_twilio_signature(str(request.url), form_dict, x_twilio_signature):
        raise HTTPException(status_code=403, detail="Invalid Twilio signature")
    payload = build_twilio_payload(form_dict)
    await _handle_missed_call(payload, db, background_tasks, _request_base_url(request))
    return Response(status_code=204)


@router.post("/webhook/exotel")
async def exotel_missed_call_webhook(
    request: Request,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
):
    form = await request.form()
    payload = build_exotel_payload(dict(form))
    await _handle_missed_call(payload, db, background_tasks, _request_base_url(request))
    return Response(status_code=204)


_MAX_TURNS = 2


_DTMF_INTENT_MAP = {"1": CallIntent.BOOKING, "2": CallIntent.INQUIRY, "3": CallIntent.BOOKING}
_DTMF_EVENING_RESPONSE = {
    "hi": "Aapka token number 8 Dr. Reddy ki evening clinic ke liye reserve ho gaya hai. Shaam 7:15 baje tak clinic pahunchein. Approximate wait time 40 minute hai. Aapke number par SMS confirmation abhi bhej di gayi hai. Dhanyavaad aur apna khayal rakhein. Namaste!",
    "te": "మీ టోకెన్ నంబర్ 8 డాక్టర్ రెడ్డి ఈవెనింగ్ క్లినిక్ కోసం రిజర్వ్ అయింది. సాయంత్రం 7:15 లోపు క్లినిక్‌కి రండి. వేచి ఉండే సమయం సుమారు 40 నిమిషాలు. మీ నంబర్‌కు SMS కన్ఫర్మేషన్ పంపించాము. ధన్యవాదాలు, జాగ్రత్తగా ఉండండి. నమస్కారం!",
    "en": "Your token number 8 has been reserved for Dr. Reddy's evening clinic. Please arrive by 7:15 PM. Approximate wait time is 40 minutes. An SMS confirmation has been sent to your number. Thank you and take care. Goodbye!",
}


@router.post("/callback-gather/{log_id}")
async def callback_gather(
    log_id: uuid.UUID,
    request: Request,
    SpeechResult: str = Form(default=""),
    Digits: str = Form(default=""),
    Confidence: str = Form(default="0.0"),
    x_twilio_signature: str = Header(default=""),
    db: AsyncSession = Depends(get_db),
):
    form_dict = dict(await request.form())
    if not _verify_twilio_signature(str(request.url), form_dict, x_twilio_signature):
        raise HTTPException(status_code=403, detail="Invalid Twilio signature")
    result = await db.execute(select(MissedCallLog).where(MissedCallLog.id == log_id))
    log = result.scalar_one_or_none()
    if not log:
        return Response(
            content=_mc_say_and_hangup("Sorry, we could not find your record. Please call us back.", "en-IN", "en"),
            media_type="application/xml",
        )

    base = _request_base_url(request)
    action_url = f"{base}/api/v1/missed-call/callback-gather/{log_id}"
    transcript = log.conversation_transcript or []
    digit = Digits.strip()
    speech = SpeechResult.strip()
    lang = "te"
    lang_code = "te-IN"

    user_turns = [t for t in transcript if t.get("role") == "user"]
    turn_count = len(user_turns)

    # ── PHASE 0: GREETING + MENU ─────────────────────────────────────────────
    if not digit and not speech:
        greeting = get_greeting("te")
        transcript.append({"role": "assistant", "content": greeting, "phase": "greeting"})
        log.language_detected = "te"
        log.conversation_transcript = transcript
        await db.commit()
        logger.info("PHASE=GREETING | log=%s | caller=%s", log_id, log.caller_number)
        return Response(
            content=_mc_say_and_gather(greeting, action_url, lang_code, timeout=12, lang=lang, base=base),
            media_type="application/xml",
        )

    # ── PHASE 1: DTMF → respond and hangup immediately ───────────────────────
    if digit == "3":
        response_text = _DTMF_EVENING_RESPONSE.get(lang, _DTMF_EVENING_RESPONSE["en"])
        intent = CallIntent.INQUIRY
    elif digit == "1":
        response_text = get_intent_response(CallIntent.BOOKING, lang)
        intent = CallIntent.BOOKING
    elif digit == "2":
        response_text = get_intent_response(CallIntent.INQUIRY, lang)
        intent = CallIntent.INQUIRY
    elif speech:
        intent, _ = _classify_intent(speech)
        response_text = get_intent_response(intent, lang)
    else:
        response_text = get_greeting("te")
        transcript.append({"role": "assistant", "content": response_text, "phase": "replay"})
        log.conversation_transcript = transcript
        await db.commit()
        return Response(
            content=_mc_say_and_gather(response_text, action_url, lang_code, timeout=12, lang=lang, base=base),
            media_type="application/xml",
        )

    transcript.append({"role": "user", "content": digit or speech, "dtmf": digit})
    transcript.append({"role": "assistant", "content": response_text, "intent": str(intent)})
    log.intent = intent
    log.intent_confidence = 1.0
    log.conversation_transcript = transcript
    log.status = MissedCallStatus.CALLBACK_COMPLETED
    log.callback_completed_at = datetime.now(timezone.utc)
    await db.commit()
    logger.info("PHASE=RESPOND+HANGUP | log=%s | digit=%s | intent=%s", log_id, digit, intent)
    return Response(
        content=_mc_say_and_hangup(response_text, lang_code, lang, base=base),
        media_type="application/xml",
    )


@router.post("/callback-status/{log_id}")
async def callback_status(
    log_id: uuid.UUID,
    request: Request,
    CallStatus: str = Form(default=""),
    x_twilio_signature: str = Header(default=""),
    db: AsyncSession = Depends(get_db),
):
    form_dict = dict(await request.form())
    if not _verify_twilio_signature(str(request.url), form_dict, x_twilio_signature):
        raise HTTPException(status_code=403, detail="Invalid Twilio signature")
    result = await db.execute(select(MissedCallLog).where(MissedCallLog.id == log_id))
    log = result.scalar_one_or_none()
    if not log:
        return Response(status_code=204)

    status_lower = CallStatus.lower()

    if status_lower == "completed":
        if log.status == MissedCallStatus.VOICEMAIL_LEFT:
            logger.info("CALLBACK-STATUS | log=%s | voicemail already recorded — skipping", log_id)
        else:
            transcript = log.conversation_transcript or []
            user_turns = [t for t in transcript if t.get("role") == "user"]
            if user_turns:
                await finalize_call(log, transcript, db, call_succeeded=True)
            else:
                log.status = MissedCallStatus.USER_DISCONNECTED
                log.callback_completed_at = datetime.now(timezone.utc)
                await db.commit()
                logger.info("CALLBACK-STATUS | log=%s | completed with no speech → USER_DISCONNECTED", log_id)

    elif status_lower in ("no-answer", "busy", "failed", "canceled"):
        transcript = log.conversation_transcript or []
        user_turns = [t for t in transcript if t.get("role") == "user"]
        if user_turns:
            await finalize_call(log, transcript, db, call_succeeded=False)
        log.status = MissedCallStatus.NO_ANSWER
        log.callback_error = f"Twilio: {CallStatus}"
        log.callback_completed_at = datetime.now(timezone.utc)
        await db.commit()
        logger.info("CALLBACK-STATUS | log=%s | %s → NO_ANSWER", log_id, CallStatus)

    return Response(status_code=204)


@router.get("/voice-token")
async def voice_token():
    if not all([settings.TWILIO_API_KEY_SID, settings.TWILIO_API_KEY_SECRET,
                settings.TWILIO_ACCOUNT_SID, settings.TWILIO_TWIML_APP_SID]):
        raise HTTPException(status_code=503, detail="Browser calling not configured")
    now = int(time.time())
    identity = f"browser-{now}"
    payload = {
        "jti": f"{settings.TWILIO_API_KEY_SID}-{now}",
        "iss": settings.TWILIO_API_KEY_SID,
        "sub": settings.TWILIO_ACCOUNT_SID,
        "exp": now + 3600,
        "grants": {
            "identity": identity,
            "voice": {
                "incoming": {"allow": True},
                "outgoing": {"application_sid": settings.TWILIO_TWIML_APP_SID},
            },
        },
    }
    token = jose_jwt.encode(payload, settings.TWILIO_API_KEY_SECRET, algorithm="HS256")
    return {"token": token, "identity": identity}


@router.post("/browser-call")
async def browser_call(
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    default_tid: uuid.UUID | None = None
    if settings.TWILIO_DEFAULT_TENANT_ID:
        try:
            default_tid = uuid.UUID(settings.TWILIO_DEFAULT_TENANT_ID)
        except ValueError:
            pass
    log = MissedCallLog(
        tenant_id=default_tid,
        caller_number="browser-demo",
        called_number=settings.TWILIO_PHONE_NUMBER or "demo",
        provider="browser",
        status=MissedCallStatus.RECEIVED,
        language_detected="te",
    )
    db.add(log)
    await db.commit()
    await db.refresh(log)
    base = _request_base_url(request)
    gather_url = f"{base}/api/v1/missed-call/callback-gather/{log.id}"
    logger.info("BROWSER_CALL | log=%s", log.id)
    return Response(
        content=(
            '<?xml version="1.0" encoding="UTF-8"?>'
            f"<Response><Redirect>{gather_url}</Redirect></Response>"
        ),
        media_type="application/xml",
    )


@router.get("/logs")
async def list_missed_call_logs(
    status: Optional[str] = Query(None),
    intent: Optional[str] = Query(None),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    stmt = select(MissedCallLog).order_by(MissedCallLog.received_at.desc())
    if current_user.tenant_id:
        stmt = stmt.where(MissedCallLog.tenant_id == current_user.tenant_id)
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


@router.post("/whatsapp-notify")
async def whatsapp_notify(request: Request):
    """Send a demo WhatsApp message — proxies Twilio so frontend doesn't need creds."""
    if not settings.TWILIO_ACCOUNT_SID or not settings.TWILIO_AUTH_TOKEN:
        raise HTTPException(status_code=503, detail="Twilio not configured")

    body = await request.json()
    phone: str = body.get("phone", "")
    intent: str = body.get("intent", "inquiry")

    clean = "".join(c for c in phone if c.isdigit())
    normalized = clean if clean.startswith("91") else "91" + clean
    if not re.match(r"^91\d{10}$", normalized):
        raise HTTPException(status_code=400, detail="Invalid Indian mobile number")

    messages = {
        "booking": (
            "Hi! Your appointment with Dr. Mehta is confirmed.\n\n"
            "Tomorrow, 10:00 AM\nCity Clinic, OPD\n\n"
            "Reply CANCEL if you need to reschedule.\n\n- City Clinic"
        ),
        "evening": (
            "Hi! Your token has been reserved at City Clinic.\n\n"
            "Token #7 - Dr. Reddy\nArrive by 7:15 PM tonight\nCity Clinic, Kukatpally\n\n"
            "Reply CANCEL to release your token.\n\n- City Clinic"
        ),
        "inquiry": (
            "Hi! Here is the fee summary from City Clinic.\n\n"
            "General OPD: Rs.300\nSpecialist: Rs.500\n\n"
            "To book an appointment reply BOOK or call us.\n\n- City Clinic"
        ),
    }
    msg_body = messages.get(intent, messages["inquiry"])
    to = f"whatsapp:+{normalized}"
    frm = "whatsapp:+14155238886"

    async with httpx.AsyncClient(timeout=12) as client:
        resp = await client.post(
            f"https://api.twilio.com/2010-04-01/Accounts/{settings.TWILIO_ACCOUNT_SID}/Messages.json",
            auth=(settings.TWILIO_ACCOUNT_SID, settings.TWILIO_AUTH_TOKEN),
            data={"From": frm, "To": to, "Body": msg_body},
        )

    if not resp.is_success:
        data = resp.json()
        raise HTTPException(status_code=502, detail=data.get("message", "Twilio error"))

    return {"ok": True, "sid": resp.json().get("sid")}


@router.get("/logs/{log_id}")
async def get_missed_call_log(
    log_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    stmt = select(MissedCallLog).where(MissedCallLog.id == log_id)
    if current_user.tenant_id:
        stmt = stmt.where(MissedCallLog.tenant_id == current_user.tenant_id)
    result = await db.execute(stmt)
    log = result.scalar_one_or_none()
    if not log:
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
