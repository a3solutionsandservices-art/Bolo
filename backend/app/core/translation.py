from __future__ import annotations
import time
from dataclasses import dataclass
from typing import Optional
import httpx

from app.core.config import settings

SARVAM_LANGUAGE_CODES = {
    "hi": "hi-IN",
    "ta": "ta-IN",
    "te": "te-IN",
    "bn": "bn-IN",
    "gu": "gu-IN",
    "mr": "mr-IN",
    "en": "en-IN",
}

FLORES_CODES = {
    "hi": "hin_Deva",
    "ta": "tam_Taml",
    "te": "tel_Telu",
    "bn": "ben_Beng",
    "gu": "guj_Gujr",
    "mr": "mar_Deva",
    "en": "eng_Latn",
}

ACCENT_NORMALIZATION_RULES: dict[str, list[tuple[str, str]]] = {
    "hi": [("\u0928\u093c", "\u0928"), ("\u0930\u093c", "\u0930")],
    "bn": [("\u09df", "\u09af")],
}


@dataclass
class TranslationResult:
    translated_text: str
    source_language: str
    target_language: str
    model_used: str
    processing_time_ms: float
    character_count: int


class SarvamTranslate:
    """
    Sarvam AI translate API — primary translation engine.
    Endpoint: POST /translate
    Supports all 7 MVP Indian languages natively.
    """

    _instance: Optional["SarvamTranslate"] = None

    def __init__(self) -> None:
        self._client = httpx.AsyncClient(
            base_url=settings.SARVAM_API_BASE,
            headers={
                "api-subscription-key": settings.SARVAM_API_KEY,
                "Content-Type": "application/json",
            },
            timeout=30.0,
        )

    @classmethod
    def get_instance(cls) -> "SarvamTranslate":
        if cls._instance is None:
            cls._instance = cls()
        return cls._instance

    async def translate(
        self,
        text: str,
        source_language: str,
        target_language: str,
    ) -> TranslationResult:
        start = time.perf_counter()

        src_code = SARVAM_LANGUAGE_CODES.get(source_language, "en-IN")
        tgt_code = SARVAM_LANGUAGE_CODES.get(target_language, "en-IN")

        chunks = self._split_text(text, max_chars=1000)
        translated_parts: list[str] = []

        for chunk in chunks:
            payload = {
                "input": chunk,
                "source_language_code": src_code,
                "target_language_code": tgt_code,
                "speaker_gender": "Female",
                "mode": "formal",
                "model": "mayura:v1",
                "enable_preprocessing": True,
            }
            resp = await self._client.post("/translate", json=payload)
            resp.raise_for_status()
            data = resp.json()
            translated_parts.append(data.get("translated_text", chunk))

        translated = " ".join(translated_parts)
        return TranslationResult(
            translated_text=translated,
            source_language=source_language,
            target_language=target_language,
            model_used="sarvam-mayura:v1",
            processing_time_ms=(time.perf_counter() - start) * 1000,
            character_count=len(text),
        )

    def _split_text(self, text: str, max_chars: int) -> list[str]:
        import re
        sentences = re.split(r"(?<=[।.!?])\s+", text)
        chunks: list[str] = []
        current = ""
        for s in sentences:
            if len(current) + len(s) + 1 <= max_chars:
                current = f"{current} {s}".strip() if current else s
            else:
                if current:
                    chunks.append(current)
                current = s
        if current:
            chunks.append(current)
        return chunks or [text]

    async def close(self) -> None:
        await self._client.aclose()


class IndicTransTranslate:
    """
    IndicTrans2 local model — fallback when Sarvam Translate is unavailable.
    Only loaded on demand; requires ~4GB RAM.
    """

    _instance: Optional["IndicTransTranslate"] = None
    _model = None
    _tokenizer = None

    @classmethod
    def get_instance(cls) -> "IndicTransTranslate":
        if cls._instance is None:
            cls._instance = cls()
        return cls._instance

    def _load(self) -> bool:
        if self._model is not None:
            return True
        try:
            from transformers import AutoModelForSeq2SeqLM, AutoTokenizer
            import torch

            model_name = "ai4bharat/indictrans2-indic-en-1B"
            self._tokenizer = AutoTokenizer.from_pretrained(model_name, trust_remote_code=True)
            self._model = AutoModelForSeq2SeqLM.from_pretrained(
                model_name,
                trust_remote_code=True,
                torch_dtype=torch.float32,
            ).to(settings.INDICTRANS_DEVICE)
            self._model.eval()
            return True
        except Exception:
            return False

    async def translate(self, text: str, source_language: str, target_language: str) -> TranslationResult:
        import asyncio

        start = time.perf_counter()
        if not self._load():
            raise RuntimeError("IndicTrans2 model unavailable")

        src = FLORES_CODES.get(source_language, "eng_Latn")
        tgt = FLORES_CODES.get(target_language, "eng_Latn")

        def _run() -> str:
            import torch
            inputs = self._tokenizer(text, src_lang=src, tgt_lang=tgt, return_tensors="pt", padding=True).to(settings.INDICTRANS_DEVICE)
            with torch.no_grad():
                outputs = self._model.generate(**inputs, num_beams=5, max_length=512)
            return self._tokenizer.batch_decode(outputs, skip_special_tokens=True)[0]

        translated = await asyncio.get_event_loop().run_in_executor(None, _run)
        return TranslationResult(
            translated_text=translated,
            source_language=source_language,
            target_language=target_language,
            model_used="indictrans2",
            processing_time_ms=(time.perf_counter() - start) * 1000,
            character_count=len(text),
        )


class GoogleTranslate:
    """Google Translate — secondary fallback for unsupported pairs."""

    _instance: Optional["GoogleTranslate"] = None

    def __init__(self) -> None:
        self._client = httpx.AsyncClient(timeout=30.0)

    @classmethod
    def get_instance(cls) -> "GoogleTranslate":
        if cls._instance is None:
            cls._instance = cls()
        return cls._instance

    async def translate(self, text: str, source_language: str, target_language: str) -> TranslationResult:
        start = time.perf_counter()
        resp = await self._client.post(
            "https://translation.googleapis.com/language/translate/v2",
            params={"key": settings.GOOGLE_TRANSLATE_API_KEY},
            json={"q": text, "source": source_language, "target": target_language, "format": "text"},
        )
        resp.raise_for_status()
        translated = resp.json()["data"]["translations"][0]["translatedText"]
        return TranslationResult(
            translated_text=translated,
            source_language=source_language,
            target_language=target_language,
            model_used="google_translate",
            processing_time_ms=(time.perf_counter() - start) * 1000,
            character_count=len(text),
        )


class TranslationService:
    """
    Unified translation pipeline per architecture:
    Sarvam Translate (primary) → IndicTrans2 (fallback) → Google Translate (last resort).
    """

    def normalize_accent(self, text: str, language: str) -> str:
        for pattern, replacement in ACCENT_NORMALIZATION_RULES.get(language, []):
            text = text.replace(pattern, replacement)
        return text

    async def translate(
        self,
        text: str,
        source_language: str,
        target_language: str,
    ) -> TranslationResult:
        if source_language == target_language:
            return TranslationResult(
                translated_text=text,
                source_language=source_language,
                target_language=target_language,
                model_used="passthrough",
                processing_time_ms=0.0,
                character_count=len(text),
            )

        text = self.normalize_accent(text, source_language)

        if settings.SARVAM_API_KEY:
            try:
                return await SarvamTranslate.get_instance().translate(text, source_language, target_language)
            except Exception as exc:
                import logging
                logging.getLogger(__name__).warning("Sarvam Translate failed (%s), trying IndicTrans2", exc)

        try:
            return await IndicTransTranslate.get_instance().translate(text, source_language, target_language)
        except Exception as exc:
            import logging
            logging.getLogger(__name__).warning("IndicTrans2 failed (%s), falling back to Google", exc)

        if settings.GOOGLE_TRANSLATE_API_KEY:
            return await GoogleTranslate.get_instance().translate(text, source_language, target_language)

        raise RuntimeError("All translation providers failed. Configure SARVAM_API_KEY or GOOGLE_TRANSLATE_API_KEY.")


_service: Optional[TranslationService] = None


def get_translation_service() -> TranslationService:
    global _service
    if _service is None:
        _service = TranslationService()
    return _service
