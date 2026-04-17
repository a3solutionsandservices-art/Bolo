import asyncio
import json
import logging
import random
from datetime import datetime, timezone
from typing import Any

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.db.base import AsyncSessionLocal
from app.models.missed_call import CallIntent, MissedCallLog, MissedCallStatus

logger = logging.getLogger(__name__)

# ── Language data ─────────────────────────────────────────────────────────────

_GREETINGS: dict[str, str] = {
    "hi": "Namaste! Main Pallavi hoon. Aapka call miss ho gaya tha. Main aapki madad karna chahti hoon. Appointment book karne ke liye 1 dabayein, jaankari ke liye 2 dabayein, ya evening clinic ke liye 3 dabayein.",
    "ta": "Vanakkam! Ungal call miss aiyirundathu. Nangal ungalukku udav virumbugirom. Enna vishayathil pesanum endru sollunga?",
    "te": "Namaskaram! Meeru chesina call miss aindi. Meeru entha vishayamlo matladali anukuntunnaru?",
    "bn": "Namaskar! Apnar call miss hoyeche. Amra apnake sahajya korte chai. Apni ki bishaye kotha bolte cheyechen?",
    "kn": "Namaskara! Nimma call miss aayitu. Nimage sahaya maadalu navu siddharaagiddeve. Yaava vishayado heluttira?",
    "mr": "Namaskar! Tumcha call miss zala hota. Aamhi tumchi madad karayala tayyar aahot. Tumhi konasaathi call kela hote?",
    "gu": "Namaskar! Tamaaro call miss thayo hato. Ame tamaari madad karva maangie chhe. Shu vishayama vaat karavi hati?",
    "en": "Hello! We missed your call and want to help. Could you please tell us why you were calling?",
}

_INTENT_RESPONSES: dict[CallIntent, dict[str, str]] = {
    CallIntent.BOOKING: {
        "hi": "Samajh gayi. Aap appointment book karna chahte hain. Main abhi aapki request note kar leti hoon. Hamari team aapko jald confirm karegi.",
        "ta": "Purindukitten. Neenga oru appointment book pannanum nu ninaikireengala. Ungal request note pannugirom. Virupu patta naal athava neram irukka?",
        "te": "Ardhamayindi. Meeru oka appointment book chesukovalani anukuntunnaru. Meeru request note chesukuntam. Istamaina tarikh edo undi?",
        "bn": "Bujhechi. Apni ekta appointment ba booking korte chaan. Ami apnar request note korchi. Kono preferred date ba somoy ache ki?",
        "kn": "Artha aayitu. Neevu appointment book maadabekaagide. Nimma request note maadutteve. Yaavudaadaru preferred date iddeyaa?",
        "mr": "Samajlo. Tumhala appointment book karayachi ahe. Mi tumchi request note karto. Koi preferred date ahe ka?",
        "en": "Understood. You'd like to make an appointment or booking. I've noted your request. Do you have a preferred date or time?",
    },
    CallIntent.INQUIRY: {
        "hi": "Bilkul. Main aapki query note kar leti hoon aur aapko jald jawaab milega. Koi specific sawaal hai?",
        "ta": "Sari. Ungalukkku sila thakaval thevaipadum. Ungal query forward pannugirom. Enna kurippitta kelvigal ketka virumpugireenga?",
        "te": "Sare. Meeru kొన్ని samacharam kavalistunnaru. Meeru query forward chestam. Meeru adagalanukunna specific question undo?",
        "bn": "Thik ache. Apnar kichhu tathya dorkar chilo. Ami apnar query forward korchi. Kono specific proshno jignasa korte chan?",
        "kn": "Sari. Nimage kೆಲವು mahiti bEkaagitta. Nimma query forward maadutteve. Yaavudaadaru specific prashne kELabekaagide?",
        "mr": "Theek ahe. Tumhala kahi mahiti havī hoti. Mi tumchi query forward karto. Kahi specific prashna vicharayacha aahe ka?",
        "en": "Of course. You had an inquiry. I've noted your question and will get back to you. Is there anything specific you'd like to know?",
    },
    CallIntent.COMPLAINT: {
        "hi": "Mujhe khed hai ki aapko takleef hui. Main aapki shikayat darj kar leti hoon aur ek expert aapko jald hi contact karega.",
        "ta": "Ungalukkku sirimai aachu nu kettu varudham. Ungal pukarai pathivu seikirom, oru expert ungalai vilaivil thodarbu kolluvaar.",
        "te": "Meeru oka samasya face chesaaru ani vinadam chala kastangaa undi. Meeru complaint register chestam, expert meeru tho tvaralo contact aavutaaru.",
        "bn": "Apnar kosto hoyeche shune dukhit holam. Ami apnar অভিযোগ nথibaddho korchi, ekjon expert shīghroi apnar sathe joগাযোগ korbe.",
        "en": "I'm sorry to hear you had an issue. I've registered your complaint and an expert will contact you shortly.",
    },
    CallIntent.SUPPORT: {
        "hi": "Hum aapki madad karne ke liye yahan hain. Aapki request support team ko bhej di gayi hai. Koi specific samasya hai jo aap batana chahte hain?",
        "ta": "Ungalukkku help pannuvaom. Ungal request support team-kku anuppappattu. Enna kuritta parisalai solveenga?",
        "te": "Meeru help cheyyadaniki ikkade unnamu. Meeru request support team ki pampadam ayyindi. Oka specific problem cheppalani anukuntunnara?",
        "bn": "Ami apnake sahajya korte ekhane achi. Apnar request support team-e pathano hoyeche. Kono specific samasya bolte chan?",
        "en": "We're here to help. Your request has been sent to our support team. Is there a specific issue you'd like to describe?",
    },
    CallIntent.OTHER: {
        "hi": "Theek hai. Main aapki baat note kar leti hoon. Hamari team aapko jald hi callback karegi.",
        "ta": "Sari. Ungal vishayathai note pannugirom. Engal team ungalai vilaivil callback pannum.",
        "te": "Sare. Meeru vishayam note chesukuntam. Maa team meeru ni tvaralo callback chestundi.",
        "bn": "Thik ache. Ami apnar bishoy note korchi. Amar team shīghroi apnake callback korbe.",
        "en": "Understood. I've noted your message. Our team will call you back shortly.",
    },
}

_CLOSING: dict[str, str] = {
    "hi": "Bahut dhanyavaad aapka. Hamari team 24 ghante ke andar aapse sampark karegi. Apna khayal rakhein. Namaste!",
    "ta": "Romba nandri. Engal team 24 manikku ullae ungalai thodarbu kollum. Kaapaattukolungal. Vanakkam!",
    "te": "Chala dhanyavaadalu. Maa team 24 gantallo meeru ni contact chestundi. Jagratta ga undandi. Namaskaram!",
    "bn": "Onek dhonnobad. Amar team 24 ghontar modhye apnar sathe joগাযোগ korbe. Bhalo thakben. Namaskar!",
    "kn": "Tumba dhanyavaadagalu. Namma team 24 ganteyalli nimmannu sampark maaduttade. Jagrute vaagiri. Namaskara!",
    "mr": "Khup dhanyavaad. Amchi team 24 tasaanmadhe tumhashi sampark kareel. Kaaļji ghya. Namaskar!",
    "en": "Thank you so much. Our team will contact you within 24 hours. Take care. Goodbye!",
}

# Phone prefix → likely language (India mobile number heuristics)
_PREFIX_LANG: dict[str, str] = {
    "6": "hi", "7": "hi", "8": "hi", "9": "hi",
}
_STATE_PREFIX_LANG: dict[str, str] = {
    "044": "ta", "080": "kn", "040": "te", "033": "bn",
    "022": "mr", "079": "gu", "011": "hi",
}

# ── Intent detection ──────────────────────────────────────────────────────────

_INTENT_KEYWORDS: dict[CallIntent, list[str]] = {
    CallIntent.BOOKING: [
        "book", "appointment", "schedule", "reserve", "slot", "date", "time",
        "बुक", "अपॉइंटमेंट", "बुकिंग", "समय", "तारीख",
        "புக்", "appointment", "முன்பதிவு",
    ],
    CallIntent.COMPLAINT: [
        "complaint", "problem", "issue", "wrong", "broken", "refund", "not working",
        "शिकायत", "समस्या", "गलत", "खराब",
        "புகார்", "பிரச்சனை",
    ],
    CallIntent.SUPPORT: [
        "help", "support", "assist", "how to", "unable", "can't",
        "मदद", "सहायता", "कैसे",
        "உதவி", "எப்படி",
    ],
    CallIntent.INQUIRY: [
        "price", "cost", "info", "detail", "how much", "available", "when", "what",
        "कीमत", "जानकारी", "कब", "क्या", "कितना",
        "விலை", "தகவல்",
    ],
}


def _classify_intent(text: str) -> tuple[CallIntent, float]:
    text_lower = text.lower()
    scores: dict[CallIntent, int] = {intent: 0 for intent in CallIntent}
    for intent, keywords in _INTENT_KEYWORDS.items():
        scores[intent] = sum(1 for kw in keywords if kw in text_lower)
    best = max(scores, key=lambda k: scores[k])
    total = sum(scores.values())
    if scores[best] == 0:
        return CallIntent.OTHER, 0.0
    return best, round(scores[best] / total, 2)


async def _extract_intent_via_llm(transcript: str, language: str = "hi") -> tuple[CallIntent, float, dict]:
    if not settings.OPENAI_API_KEY:
        intent, conf = _classify_intent(transcript)
        return intent, conf, {}
    try:
        import openai
        client = openai.AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
        response = await client.chat.completions.create(
            model=settings.SENTIMENT_MODEL,
            messages=[
                {
                    "role": "system",
                    "content": (
                        "You are a call intent classifier for Indian language voice calls. "
                        f"The transcript may be in {language}. "
                        "Extract: intent (one of: booking, inquiry, complaint, support, other), "
                        "confidence (0.0-1.0), and key entities (name, date, product, location). "
                        'Respond as JSON only: {"intent": "...", "confidence": 0.9, "entities": {...}}'
                    ),
                },
                {"role": "user", "content": f"Transcript:\n{transcript}"},
            ],
            max_tokens=200,
            response_format={"type": "json_object"},
        )
        data = json.loads(response.choices[0].message.content or "{}")
        try:
            intent = CallIntent(data.get("intent", "other"))
        except ValueError:
            intent = CallIntent.OTHER
        return intent, float(data.get("confidence", 0.5)), data.get("entities", {})
    except Exception as exc:
        logger.warning("LLM intent extraction failed, using keyword fallback: %s", exc)
        intent, conf = _classify_intent(transcript)
        return intent, conf, {}


# ── Language helpers ───────────────────────────────────────────────────────────

def detect_language_from_number(phone: str) -> str:
    digits = "".join(c for c in phone if c.isdigit())
    if digits.startswith("91"):
        digits = digits[2:]
    for prefix, lang in _STATE_PREFIX_LANG.items():
        if digits.startswith(prefix.lstrip("0")):
            return lang
    return "hi"


def get_greeting(lang: str) -> str:
    return _GREETINGS.get(lang, _GREETINGS["hi"])


def get_intent_response(intent: CallIntent, lang: str) -> str:
    lang_map = _INTENT_RESPONSES.get(intent, _INTENT_RESPONSES[CallIntent.OTHER])
    return lang_map.get(lang, lang_map.get("en", ""))


def get_closing(lang: str) -> str:
    return _CLOSING.get(lang, _CLOSING["hi"])


# ── Outbound call trigger ──────────────────────────────────────────────────────

_CALLBACK_DELAY_SECONDS_MIN = 3
_CALLBACK_DELAY_SECONDS_MAX = 5


async def trigger_outbound_call(log_id: "uuid.UUID", base_url: str = "") -> bool:
    import uuid
    from sqlalchemy import select as _sa_select
    import httpx

    async with AsyncSessionLocal() as db:
        result = await db.execute(_sa_select(MissedCallLog).where(MissedCallLog.id == log_id))
        log = result.scalar_one_or_none()
        if not log:
            logger.error("trigger_outbound_call: log %s not found in DB", log_id)
            return False

        if not settings.TWILIO_ACCOUNT_SID or not settings.TWILIO_AUTH_TOKEN:
            logger.warning("Twilio not configured — skipping outbound callback for log %s", log.id)
            log.status = MissedCallStatus.CALLBACK_FAILED
            log.callback_error = "Twilio credentials not configured"
            await db.commit()
            return False

        delay = random.uniform(_CALLBACK_DELAY_SECONDS_MIN, _CALLBACK_DELAY_SECONDS_MAX)
        logger.info("Waiting %.1fs before outbound callback for log %s", delay, log.id)
        await asyncio.sleep(delay)

        try:
            api_base = base_url or settings.API_BASE_URL
            callback_url = f"{api_base}/api/v1/missed-call/callback-gather/{log.id}"
            status_url = f"{api_base}/api/v1/missed-call/callback-status/{log.id}"
            amd_url = f"{api_base}/api/v1/missed-call/callback-amd/{log.id}"
            from_number = log.called_number or settings.TWILIO_PHONE_NUMBER
            twilio_url = f"https://api.twilio.com/2010-04-01/Accounts/{settings.TWILIO_ACCOUNT_SID}/Calls.json"

            async with httpx.AsyncClient(timeout=15) as client:
                resp = await client.post(
                    twilio_url,
                    auth=(settings.TWILIO_ACCOUNT_SID, settings.TWILIO_AUTH_TOKEN),
                    data={
                        "To": log.caller_number,
                        "From": from_number,
                        "Url": callback_url,
                        "StatusCallback": status_url,
                        "StatusCallbackMethod": "POST",
                        "Timeout": "30",
                        "TimeLimit": "90",
                        "MachineDetection": "Enable",
                        "AsyncAmdStatusCallback": amd_url,
                        "AsyncAmdStatusCallbackMethod": "POST",
                    },
                )

            if resp.status_code not in (200, 201):
                raise RuntimeError(f"Twilio API {resp.status_code}: {resp.text[:300]}")

            call_data = resp.json()
            log.callback_call_sid = call_data.get("sid")
            log.status = MissedCallStatus.CALLBACK_INITIATED
            log.callback_initiated_at = datetime.now(timezone.utc)
            await db.commit()
            logger.info(
                "Outbound callback SID=%s | %s → %s | delay=%.1fs",
                log.callback_call_sid, from_number, log.caller_number, delay,
            )
            return True
        except Exception as exc:
            logger.error("Outbound call failed for log %s: %s", log.id, exc)
            log.status = MissedCallStatus.CALLBACK_FAILED
            log.callback_error = str(exc)[:500]
            await db.commit()
            return False


# ── Structured entity extraction ──────────────────────────────────────────────

async def _extract_structured_entities(
    transcript_turns: list[dict], language: str, intent: CallIntent
) -> dict:
    user_text = " ".join(
        t.get("content", "") for t in transcript_turns if t.get("role") == "user"
    )
    if not user_text.strip() or not settings.OPENAI_API_KEY:
        return {}

    try:
        import openai
        client = openai.AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
        response = await client.chat.completions.create(
            model=settings.SENTIMENT_MODEL,
            messages=[
                {
                    "role": "system",
                    "content": (
                        "You are an entity extractor for Indian voice calls. "
                        f"Language: {language}. Detected intent: {intent}. "
                        "Extract these fields if mentioned (use null if absent): "
                        "caller_name (person's name), "
                        "requested_service (service or product they want), "
                        "requested_time (date/time for booking if any), "
                        "location (city or area if mentioned). "
                        'Respond as JSON only: {"caller_name": null, "requested_service": null, '
                        '"requested_time": null, "location": null}'
                    ),
                },
                {"role": "user", "content": f"Transcript:\n{user_text}"},
            ],
            max_tokens=150,
            response_format={"type": "json_object"},
        )
        data = json.loads(response.choices[0].message.content or "{}")
        return {k: v for k, v in data.items() if v is not None}
    except Exception as exc:
        logger.warning("Entity extraction failed: %s", exc)
        return {}


# ── Post-call finalization ────────────────────────────────────────────────────

async def finalize_call(
    log: MissedCallLog,
    transcript_turns: list[dict[str, str]],
    db: AsyncSession,
    call_succeeded: bool = True,
) -> None:
    from app.services.missed_call_storage import MissedCallResult, persist_result

    user_text = " ".join(t.get("content", "") for t in transcript_turns if t.get("role") == "user")
    intent, confidence, _ = await _extract_intent_via_llm(user_text, log.language_detected)
    entities = await _extract_structured_entities(transcript_turns, log.language_detected, intent)

    log.intent = intent
    log.intent_confidence = confidence
    log.extracted_entities = entities
    log.conversation_transcript = transcript_turns
    log.status = MissedCallStatus.CALLBACK_COMPLETED if call_succeeded else MissedCallStatus.CALLBACK_FAILED
    log.callback_completed_at = datetime.now(timezone.utc)
    await db.commit()

    logger.info(
        "FINALIZED | log=%s | intent=%s (%.0f%%) | name=%s | service=%s | time=%s | status=%s",
        log.id,
        intent,
        confidence * 100,
        entities.get("caller_name", "-"),
        entities.get("requested_service", "-"),
        entities.get("requested_time", "-"),
        log.status,
    )

    result = MissedCallResult(
        log_id=str(log.id),
        caller_number=log.caller_number,
        called_number=log.called_number,
        provider=log.provider,
        intent=intent,
        intent_confidence=confidence,
        caller_name=entities.get("caller_name"),
        requested_service=entities.get("requested_service"),
        requested_time=entities.get("requested_time"),
        language=log.language_detected,
        status=log.status,
        received_at=log.received_at.isoformat() if log.received_at else "",
        completed_at=log.callback_completed_at.isoformat() if log.callback_completed_at else None,
        transcript_turns=len([t for t in transcript_turns if t.get("role") == "user"]),
        raw_entities=entities,
    )

    storage_results = await persist_result(result)

    logger.info(
        "CONFIRMATION | log=%s | success=%s | storage=%s",
        log.id, call_succeeded, storage_results,
    )


# ── Legacy payload builders (kept for backward compat) ────────────────────────

def build_exotel_payload(form_data: dict[str, Any]) -> dict[str, Any]:
    return {
        "provider": "exotel",
        "call_sid": form_data.get("CallSid") or form_data.get("CallId", ""),
        "caller_number": form_data.get("From") or form_data.get("Direction", ""),
        "called_number": form_data.get("To") or form_data.get("ExoPhoneNumber", ""),
        "status": form_data.get("Status", "").lower(),
        "raw": form_data,
    }


def build_twilio_payload(form_data: dict[str, Any]) -> dict[str, Any]:
    return {
        "provider": "twilio",
        "call_sid": form_data.get("CallSid", ""),
        "caller_number": form_data.get("From", ""),
        "called_number": form_data.get("To", ""),
        "status": form_data.get("CallStatus", "").lower(),
        "raw": form_data,
    }
