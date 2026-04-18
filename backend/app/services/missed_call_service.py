import asyncio
import json
import logging
import random
import uuid
from datetime import datetime, timezone
from typing import Any

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.db.base import AsyncSessionLocal
from app.models.missed_call import CallIntent, MissedCallLog, MissedCallStatus

logger = logging.getLogger(__name__)

# ── Language data ─────────────────────────────────────────────────────────────

_LANG_SELECT_GREETING: str = (
    "Namaskaram! Nenu Pallavi ni, mee clinic nundi matladutunnanu. "
    "Telugu lo matladi anukunte 1 nokandi. "
    "Hindi ke liye 2 dabayein. "
    "For English press 3."
)

_LANG_MAP_DTMF: dict[str, str] = {"1": "te", "2": "hi", "3": "en"}

_SERVICE_MENU: dict[str, str] = {
    "te": "అపాయింట్‌మెంట్ బుక్ చేయడానికి 1 నొక్కండి, క్లినిక్ సమాచారం కోసం 2 నొక్కండి, ఈవెనింగ్ క్లినిక్ కోసం 3 నొక్కండి.",
    "hi": "Appointment book karne ke liye 1 dabayein, jaankari ke liye 2 dabayein, evening clinic ke liye 3 dabayein.",
    "en": "Press 1 to book an appointment, press 2 for clinic information, press 3 for the evening clinic.",
    "ta": "Appointment book pannuvatharku 1 acchunga, thakavalukku 2 acchunga, evening clinic ku 3 acchunga.",
    "bn": "Appointment booke 1 chapa, tathyar janya 2 chapa, evening clinic ke 3 chapa.",
    "kn": "Appointment book maadabekaagidare 1 odayi, mahitikke 2 odayi, evening clinic ge 3 odayi.",
    "mr": "Appointment book karayala 1 daba, mahitisathi 2 daba, evening clinic sathi 3 daba.",
}

_GREETINGS: dict[str, str] = {
    "hi": "Namaste! Main Pallavi hoon. Aapka call miss ho gaya tha. Appointment book karne ke liye 1 dabayein, jaankari ke liye 2 dabayein, ya evening clinic ke liye 3 dabayein.",
    "te": "నమస్కారం! నేను పల్లవిని. మీరు చేసిన కాల్ మిస్ అయింది. అపాయింట్‌మెంట్ బుక్ చేయడానికి 1 నొక్కండి, క్లినిక్ సమాచారం కోసం 2 నొక్కండి.",
    "ta": "Vanakkam! Naan Pallavi. Ungal call miss aiyirundathu. Appointment book pannuvatharku 1 acchunga, thakavalukku 2 acchunga, evening clinic ku 3 acchunga.",
    "bn": "Namaskar! Ami Pallavi. Apnar call miss hoyeche. Appointment booke 1 chapa, tathyar janya 2 chapa, evening clinic ke 3 chapa.",
    "kn": "Namaskara! Nanu Pallavi. Nimma call miss aayitu. Appointment book maadabekaagidare 1 odayi, mahitikke 2 odayi, evening clinic ge 3 odayi.",
    "mr": "Namaskar! Mi Pallavi ahe. Tumcha call miss zala. Appointment book karayala 1 daba, mahitisathi 2 daba, evening clinic sathi 3 daba.",
    "gu": "Namaskar! Hoon Pallavi chhu. Tamaaro call miss thayo. Appointment book karva 1 dabavo, mahiti maate 2 dabavo, evening clinic maate 3 dabavo.",
    "en": "Hello! I am Pallavi from your clinic. We missed your call. Press 1 to book an appointment, press 2 for information, or press 3 for the evening clinic.",
}

_INTENT_RESPONSES: dict[CallIntent, dict[str, str]] = {
    CallIntent.BOOKING: {
        "hi": "Aapka appointment kal subah 10 baje ke liye confirm ho gaya hai. Appointment number A-7 hai. Aapke number par SMS confirmation abhi bhej di gayi hai. Clinic mein samay par aane ki kripa karein. Dhanyavaad aur apna khayal rakhein. Namaste!",
        "te": "మీ అపాయింట్‌మెంట్ రేపు పొద్దున 10 గంటలకు కన్ఫర్మ్ అయింది. అపాయింట్‌మెంట్ నంబర్ A-7. మీ నంబర్‌కు SMS కన్ఫర్మేషన్ పంపించాము. సమయానికి క్లినిక్‌కి రండి. ధన్యవాదాలు, జాగ్రత్తగా ఉండండి. నమస్కారం!",
        "en": "Your appointment is confirmed for tomorrow at 10 AM. Appointment number A-7. An SMS confirmation has been sent to your number. Please arrive on time. Thank you and take care. Goodbye!",
    },
    CallIntent.INQUIRY: {
        "hi": "Hamari consultation fee 300 rupay hai. Clinic ka samay hai — subah 9 baje se dopahar 1 baje tak, aur shaam 6 baje se raat 9 baje tak. Somwar se Shanivar tak khula rehta hai.",
        "te": "మా కన్సల్టేషన్ ఫీ 300 రూపాయలు. క్లినిక్ సమయాలు — పొద్దున 9 నుండి మధ్యాహ్నం 1 వరకు, సాయంత్రం 6 నుండి రాత్రి 9 వరకు. సోమవారం నుండి శనివారం వరకు తెరుచుకుంటుంది.",
        "en": "Our consultation fee is 300 rupees. Clinic hours are 9 AM to 1 PM and 6 PM to 9 PM, Monday to Saturday.",
    },
    CallIntent.COMPLAINT: {
        "hi": "Mujhe khed hai ki aapko takleef hui. Main aapki baat note kar leti hoon. Hamara team manager aapko 2 ghante ke andar sampark karega. Aapka complaint number C-42 hai.",
        "ta": "Ungalukkku sirimai aachu nu kettu varudham. Ungal vishayathai note pannugirom. Engal team manager 2 manikku ullae ungalai thodarbu kolluvaar. Ungal complaint number C-42.",
        "te": "మీకు ఇబ్బంది కలిగినందుకు చింతిస్తున్నాము. మీ విషయం నోట్ చేసుకున్నాము. మా టీమ్ మేనేజర్ 2 గంటలలో మీకు సంప్రదిస్తారు. మీ కంప్లైంట్ నంబర్ C-42.",
        "bn": "Apnar kosto hoyeche shune dukhit holam. Ami apnar bishoy note korchi. Amar team manager 2 ghontar modhye apnar sathe joগাযোগ korbe. Apnar complaint number C-42.",
        "en": "I'm sorry to hear that. I've noted your complaint and our team manager will contact you within 2 hours. Your complaint number is C-42.",
    },
    CallIntent.SUPPORT: {
        "hi": "Hum aapki madad ke liye yahan hain. Aapki request support team ko bhej di gayi hai. Aapka support ticket number S-15 hai. Ek technician 30 minute mein aapko call karega.",
        "ta": "Ungalukkku help pannuvaom. Ungal request support team-kku anuppappattu. Ungal support ticket number S-15. Oru technician 30 nimidam ullae ungalai call panniduvan.",
        "te": "మీకు సహాయం చేయడానికి మేము ఇక్కడ ఉన్నాము. మీ రిక్వెస్ట్ సపోర్ట్ టీమ్‌కు పంపించాము. మీ సపోర్ట్ టికెట్ నంబర్ S-15. ఒక టెక్నీషియన్ 30 నిమిషాలలో కాల్ చేస్తారు.",
        "bn": "Ami apnake sahajya korte ekhane achi. Apnar request support team-e pathano hoyeche. Apnar support ticket number S-15. Ekjon technician 30 minute-er modhye apnake call korbe.",
        "en": "We're here to help. Your request has been sent to our support team. Your support ticket number is S-15. A technician will call you within 30 minutes.",
    },
    CallIntent.OTHER: {
        "hi": "Theek hai. Main aapki baat note kar leti hoon. Hamari team aapko 2 ghante ke andar callback karegi.",
        "ta": "Sari. Ungal vishayathai note pannugirom. Engal team 2 manikku ullae ungalai callback pannum.",
        "te": "సరే. మీ విషయం నోట్ చేసుకున్నాము. మా టీమ్ 2 గంటలలో మీకు కాల్‌బ్యాక్ చేస్తుంది.",
        "bn": "Thik ache. Ami apnar bishoy note korchi. Amar team 2 ghontar modhye apnake callback korbe.",
        "en": "Understood. I've noted your message. Our team will call you back within 2 hours.",
    },
}

_CLOSING: dict[str, dict[str, str]] = {
    "booking": {
        "hi": "Aapka appointment confirm ho gaya! Kal subah 10 baje clinic mein aane ki kripa karein. Appointment number A-7 yaad rakhein. Dhanyavaad aur apna khayal rakhein. Namaste!",
        "te": "మీ అపాయింట్‌మెంట్ కన్ఫర్మ్ అయింది! రేపు పొద్దున 10 గంటలకు క్లినిక్‌కి రండి. అపాయింట్‌మెంట్ నంబర్ A-7 గుర్తుంచుకోండి. ధన్యవాదాలు, జాగ్రత్తగా ఉండండి. నమస్కారం!",
        "ta": "Ungal appointment confirm aagividdu! Naalai kaalai 10 manikku clinic-ukku varungal. Appointment number A-7 ninaivil vaiththukollungal. Nandri, kaapaattukolungal. Vanakkam!",
        "en": "Your appointment is confirmed! Please visit the clinic tomorrow at 10 AM. Remember your appointment number A-7. Thank you and take care. Goodbye!",
    },
    "inquiry": {
        "hi": "Umeed hai aapko jaankari helpful lagi. Agar appointment book karni ho to kisi bhi samay call karein. Dhanyavaad aur apna khayal rakhein. Namaste!",
        "te": "సమాచారం ఉపయోగకరంగా ఉందని ఆశిస్తున్నాము. అపాయింట్‌మెంట్ బుక్ చేయడానికి ఎప్పుడైనా కాల్ చేయండి. ధన్యవాదాలు, జాగ్రత్తగా ఉండండి. నమస్కారం!",
        "ta": "Ungalukkku thakaval payanulle erundathu enru nerukirom. Appointment book pannuvatharku evvellumm call pannungal. Nandri, kaapaattukolungal. Vanakkam!",
        "en": "Hope the information was helpful. Call us anytime to book an appointment. Thank you and take care. Goodbye!",
    },
    "token": {
        "hi": "Aapka token number 8 reserve ho gaya. Approximate wait time 40 minute hai. Shaam 6:30 baje clinic mein aane ki kripa karein. Dhanyavaad! Namaste!",
        "te": "మీ టోకెన్ నంబర్ 8 రిజర్వ్ అయింది. వేచి ఉండే సమయం సుమారు 40 నిమిషాలు. ఈరోజు సాయంత్రం 6:30కి క్లినిక్‌కి రండి. ధన్యవాదాలు! నమస్కారం!",
        "ta": "Ungal token number 8 reserve aagividdu. Approximate wait time 40 nimisham. Maaalai 6:30 manikku clinic-ukku varungal. Nandri! Vanakkam!",
        "en": "Your token number 8 is reserved. Approximate wait time is 40 minutes. Please visit the clinic at 6:30 PM today. Thank you! Goodbye!",
    },
    "default": {
        "hi": "Bahut dhanyavaad aapka. Hamari team 2 ghante ke andar aapse sampark karegi. Apna khayal rakhein. Namaste!",
        "ta": "Romba nandri. Engal team 2 manikku ullae ungalai thodarbu kollum. Kaapaattukolungal. Vanakkam!",
        "te": "చాలా ధన్యవాదాలు. మా టీమ్ 2 గంటలలో మీకు సంప్రదిస్తుంది. జాగ్రత్తగా ఉండండి. నమస్కారం!",
        "bn": "Onek dhonnobad. Amar team 2 ghontar modhye apnar sathe joগাযোগ korbe. Bhalo thakben. Namaskar!",
        "kn": "Tumba dhanyavaadagalu. Namma team 2 ganteyalli nimmannu sampark maaduttade. Jagrute vaagiri. Namaskara!",
        "mr": "Khup dhanyavaad. Amchi team 2 tasaanmadhe tumhashi sampark kareel. Kaaļji ghya. Namaskar!",
        "en": "Thank you so much. Our team will contact you within 2 hours. Take care. Goodbye!",
    },
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


def get_lang_select_greeting() -> str:
    return _LANG_SELECT_GREETING


def get_service_menu(lang: str) -> str:
    return _SERVICE_MENU.get(lang, _SERVICE_MENU["en"])


def get_lang_from_dtmf(digit: str) -> str | None:
    return _LANG_MAP_DTMF.get(digit)


def get_greeting(lang: str) -> str:
    return _GREETINGS.get(lang, _GREETINGS["hi"])


def get_intent_response(intent: CallIntent, lang: str) -> str:
    lang_map = _INTENT_RESPONSES.get(intent, _INTENT_RESPONSES[CallIntent.OTHER])
    return lang_map.get(lang, lang_map.get("en", ""))


def get_closing(lang: str, intent: "CallIntent | None" = None, evening: bool = False) -> str:
    if evening:
        bucket = _CLOSING["token"]
    elif intent == CallIntent.BOOKING:
        bucket = _CLOSING["booking"]
    elif intent == CallIntent.INQUIRY:
        bucket = _CLOSING["inquiry"]
    else:
        bucket = _CLOSING["default"]
    return bucket.get(lang, bucket.get("hi", _CLOSING["default"]["hi"]))


# ── Outbound call trigger ──────────────────────────────────────────────────────

_CALLBACK_DELAY_SECONDS_MIN = 3
_CALLBACK_DELAY_SECONDS_MAX = 5


async def trigger_outbound_call(log_id: uuid.UUID, base_url: str = "") -> bool:
    import httpx
    from sqlalchemy import select as _sa_select

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
