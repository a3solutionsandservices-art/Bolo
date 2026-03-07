from __future__ import annotations
import time
from dataclasses import dataclass
from typing import Optional
import httpx

from app.core.config import settings


INDIC_LANGUAGE_PAIRS = {
    frozenset(["hi", "en"]),
    frozenset(["ta", "en"]),
    frozenset(["te", "en"]),
    frozenset(["bn", "en"]),
    frozenset(["gu", "en"]),
    frozenset(["mr", "en"]),
    frozenset(["hi", "ta"]),
    frozenset(["hi", "te"]),
    frozenset(["hi", "bn"]),
    frozenset(["hi", "gu"]),
    frozenset(["hi", "mr"]),
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
    "hi": [
        ("\u0928\u093c", "\u0928"),
        ("\u0930\u093c", "\u0930"),
    ],
    "bn": [
        ("\u09df", "\u09af"),
    ],
}


@dataclass
class TranslationResult:
    translated_text: str
    source_language: str
    target_language: str
    model_used: str
    processing_time_ms: float
    character_count: int


class TranslationService:
    """IndicTrans2 (primary) with Google Translate fallback."""

    _instance: Optional["TranslationService"] = None
    _indictrans_model = None
    _indictrans_tokenizer = None

    def __init__(self) -> None:
        self._google_client = httpx.AsyncClient(timeout=30.0)

    @classmethod
    def get_instance(cls) -> "TranslationService":
        if cls._instance is None:
            cls._instance = cls()
        return cls._instance

    def _load_indictrans(self) -> None:
        if self._indictrans_model is not None:
            return
        try:
            from transformers import AutoModelForSeq2SeqLM, AutoTokenizer
            import torch

            model_name = "ai4bharat/indictrans2-indic-en-1B"
            self._indictrans_tokenizer = AutoTokenizer.from_pretrained(
                model_name, trust_remote_code=True
            )
            self._indictrans_model = AutoModelForSeq2SeqLM.from_pretrained(
                model_name,
                trust_remote_code=True,
                torch_dtype=torch.float16 if settings.INDICTRANS_DEVICE == "cuda" else torch.float32,
            ).to(settings.INDICTRANS_DEVICE)
            self._indictrans_model.eval()
        except Exception:
            self._indictrans_model = None

    def normalize_accent(self, text: str, language: str) -> str:
        rules = ACCENT_NORMALIZATION_RULES.get(language, [])
        for pattern, replacement in rules:
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

        pair = frozenset([source_language, target_language])
        if pair in INDIC_LANGUAGE_PAIRS and self._try_load_indictrans():
            return await self._translate_indictrans(text, source_language, target_language)

        return await self._translate_google(text, source_language, target_language)

    def _try_load_indictrans(self) -> bool:
        try:
            self._load_indictrans()
            return self._indictrans_model is not None
        except Exception:
            return False

    async def _translate_indictrans(
        self, text: str, src: str, tgt: str
    ) -> TranslationResult:
        import torch

        start = time.perf_counter()
        src_flores = FLORES_CODES.get(src, "eng_Latn")
        tgt_flores = FLORES_CODES.get(tgt, "eng_Latn")

        inputs = self._indictrans_tokenizer(
            text,
            src_lang=src_flores,
            tgt_lang=tgt_flores,
            return_tensors="pt",
            padding=True,
        ).to(settings.INDICTRANS_DEVICE)

        with torch.no_grad():
            outputs = self._indictrans_model.generate(
                **inputs,
                num_beams=5,
                max_length=512,
                early_stopping=True,
            )

        translated = self._indictrans_tokenizer.batch_decode(
            outputs, skip_special_tokens=True, clean_up_tokenization_spaces=True
        )[0]

        return TranslationResult(
            translated_text=translated,
            source_language=src,
            target_language=tgt,
            model_used="indictrans2",
            processing_time_ms=(time.perf_counter() - start) * 1000,
            character_count=len(text),
        )

    async def _translate_google(
        self, text: str, src: str, tgt: str
    ) -> TranslationResult:
        start = time.perf_counter()

        response = await self._google_client.post(
            "https://translation.googleapis.com/language/translate/v2",
            params={"key": settings.GOOGLE_TRANSLATE_API_KEY},
            json={
                "q": text,
                "source": src,
                "target": tgt,
                "format": "text",
            },
        )
        response.raise_for_status()
        data = response.json()
        translated = data["data"]["translations"][0]["translatedText"]

        return TranslationResult(
            translated_text=translated,
            source_language=src,
            target_language=tgt,
            model_used="google_translate",
            processing_time_ms=(time.perf_counter() - start) * 1000,
            character_count=len(text),
        )

    async def close(self) -> None:
        await self._google_client.aclose()


def get_translation_service() -> TranslationService:
    return TranslationService.get_instance()
