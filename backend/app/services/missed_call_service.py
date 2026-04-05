import asyncio
import logging
from datetime import datetime, timezone
from typing import Any

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.models.missed_call import CallIntent, MissedCallLog, MissedCallStatus

logger = logging.getLogger(__name__)

_INTENT_KEYWORDS: dict[CallIntent, list[str]] = {
    CallIntent.BOOKING: ["book", "appointment", "schedule", "reserve", "slot", "date", "time", "बुक", "अपॉइंटमेंट"],
    CallIntent.COMPLAINT: ["complaint", "problem", "issue", "wrong", "broken", "refund", "शिकायत", "समस्या"],
    CallIntent.SUPPORT: ["help", "support", "assist", "not working", "मदद", "सहायता"],
    CallIntent.INQUIRY: ["price", "cost", "info", "detail", "how much", "available", "कीमत", "जानकारी"],
}


def _classify_intent(text: str) -> tuple[CallIntent, float]:
    text_lower = text.lower()
    scores: dict[CallIntent, int] = {intent: 0 for intent in CallIntent}
    for intent, keywords in _INTENT_KEYWORDS.items():
        scores[intent] = sum(1 for kw in keywords if kw in text_lower)
    best = max(scores, key=lambda k: scores[k])
    total = sum(scores.values())
    confidence = scores[best] / total if total > 0 else 0.0
    if scores[best] == 0:
        return CallIntent.OTHER, 0.0
    return best, round(confidence, 2)


async def _extract_intent_via_llm(transcript: str) -> tuple[CallIntent, float, dict]:
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
                        "You are a call intent classifier. Given a conversation transcript, "
                        "extract: intent (one of: booking, inquiry, complaint, support, other), "
                        "confidence (0.0-1.0), and any key entities (name, date, product, etc.). "
                        "Respond as JSON only: {\"intent\": \"...\", \"confidence\": 0.9, \"entities\": {...}}"
                    ),
                },
                {"role": "user", "content": f"Transcript:\n{transcript}"},
            ],
            max_tokens=200,
            response_format={"type": "json_object"},
        )
        import json
        data = json.loads(response.choices[0].message.content or "{}")
        intent_str = data.get("intent", "other")
        try:
            intent = CallIntent(intent_str)
        except ValueError:
            intent = CallIntent.OTHER
        return intent, float(data.get("confidence", 0.5)), data.get("entities", {})
    except Exception as exc:
        logger.warning("LLM intent extraction failed, falling back to keyword: %s", exc)
        intent, conf = _classify_intent(transcript)
        return intent, conf, {}


async def trigger_outbound_call(log: MissedCallLog, db: AsyncSession) -> bool:
    if not settings.TWILIO_ACCOUNT_SID or not settings.TWILIO_AUTH_TOKEN:
        logger.warning("Twilio not configured — skipping outbound call for %s", log.id)
        log.status = MissedCallStatus.CALLBACK_FAILED
        log.callback_error = "Twilio credentials not configured"
        await db.commit()
        return False

    try:
        from twilio.rest import Client as TwilioClient
        client = await asyncio.to_thread(
            TwilioClient, settings.TWILIO_ACCOUNT_SID, settings.TWILIO_AUTH_TOKEN
        )
        callback_url = f"{settings.API_BASE_URL}/api/v1/missed-call/callback-gather/{log.id}"
        status_url = f"{settings.API_BASE_URL}/api/v1/missed-call/callback-status/{log.id}"

        call = await asyncio.to_thread(
            client.calls.create,
            to=log.caller_number,
            from_=log.called_number or settings.TWILIO_PHONE_NUMBER,
            url=callback_url,
            status_callback=status_url,
            status_callback_method="POST",
        )
        log.callback_call_sid = call.sid
        log.status = MissedCallStatus.CALLBACK_INITIATED
        log.callback_initiated_at = datetime.now(timezone.utc)
        await db.commit()
        logger.info("Outbound callback initiated: %s → %s (SID: %s)", log.called_number, log.caller_number, call.sid)
        return True
    except Exception as exc:
        logger.error("Outbound call failed for missed call %s: %s", log.id, exc)
        log.status = MissedCallStatus.CALLBACK_FAILED
        log.callback_error = str(exc)[:500]
        await db.commit()
        return False


async def finalize_call(log: MissedCallLog, transcript_turns: list[dict[str, str]], db: AsyncSession) -> None:
    full_text = " ".join(t.get("content", "") for t in transcript_turns)
    intent, confidence, entities = await _extract_intent_via_llm(full_text)

    log.intent = intent
    log.intent_confidence = confidence
    log.extracted_entities = entities
    log.conversation_transcript = transcript_turns
    log.status = MissedCallStatus.CALLBACK_COMPLETED
    log.callback_completed_at = datetime.now(timezone.utc)
    await db.commit()
    logger.info("Missed call %s finalized — intent: %s (%.0f%%)", log.id, intent, confidence * 100)


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
