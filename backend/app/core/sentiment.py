from __future__ import annotations
from dataclasses import dataclass
from typing import Optional
import httpx

from app.core.config import settings


INTENT_LIST = [
    "question",
    "complaint",
    "request",
    "feedback",
    "greeting",
    "farewell",
    "confirmation",
    "negation",
    "booking",
    "cancellation",
    "escalation",
    "information",
    "other",
]


@dataclass
class SentimentResult:
    sentiment: str
    sentiment_score: float
    intent: str
    intent_confidence: float
    raw_response: dict


_NEUTRAL = SentimentResult(
    sentiment="neutral",
    sentiment_score=0.0,
    intent="other",
    intent_confidence=0.0,
    raw_response={},
)


class SentimentIntentAnalyzer:
    """LLM-based sentiment and intent detection."""

    _instance: Optional["SentimentIntentAnalyzer"] = None

    def __init__(self) -> None:
        if not settings.OPENAI_API_KEY:
            self._client = None
            return
        from openai import AsyncOpenAI

        self._client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)

    @classmethod
    def get_instance(cls) -> "SentimentIntentAnalyzer":
        if cls._instance is None:
            cls._instance = cls()
        return cls._instance

    async def analyze(self, text: str, language: str = "en") -> SentimentResult:
        if self._client is None:
            return _NEUTRAL
        prompt = f"""Analyze the following text and respond ONLY with a JSON object.

Text: "{text}"
Language: {language}

Respond with:
{{
  "sentiment": "positive|negative|neutral|mixed",
  "sentiment_score": <float -1.0 to 1.0>,
  "intent": <one of: {', '.join(INTENT_LIST)}>,
  "intent_confidence": <float 0.0 to 1.0>
}}"""

        try:
            response = await self._client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[{"role": "user", "content": prompt}],
                response_format={"type": "json_object"},
                temperature=0.0,
                max_tokens=150,
            )
            import json

            raw = json.loads(response.choices[0].message.content)
            return SentimentResult(
                sentiment=raw.get("sentiment", "neutral"),
                sentiment_score=float(raw.get("sentiment_score", 0.0)),
                intent=raw.get("intent", "other"),
                intent_confidence=float(raw.get("intent_confidence", 0.5)),
                raw_response=raw,
            )
        except Exception:
            return SentimentResult(
                sentiment="neutral",
                sentiment_score=0.0,
                intent="other",
                intent_confidence=0.0,
                raw_response={},
            )


def get_sentiment_analyzer() -> SentimentIntentAnalyzer:
    return SentimentIntentAnalyzer.get_instance()
