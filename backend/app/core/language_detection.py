from __future__ import annotations
import os
import re
from dataclasses import dataclass
from typing import Optional

from app.core.config import settings

LANGUAGE_MAP = {
    "hi": "hi",
    "hindi": "hi",
    "ta": "ta",
    "tamil": "ta",
    "te": "te",
    "telugu": "te",
    "bn": "bn",
    "bengali": "bn",
    "gu": "gu",
    "gujarati": "gu",
    "mr": "mr",
    "marathi": "mr",
    "en": "en",
    "english": "en",
}

INDIC_SCRIPT_RANGES = {
    "hi": (0x0900, 0x097F),
    "mr": (0x0900, 0x097F),
    "bn": (0x0980, 0x09FF),
    "gu": (0x0A80, 0x0AFF),
    "ta": (0x0B80, 0x0BFF),
    "te": (0x0C00, 0x0C7F),
}


@dataclass
class LanguageDetectionResult:
    language: str
    confidence: float
    all_predictions: list[tuple[str, float]]


class LanguageDetector:
    """FastText-based language identifier with script-based heuristics for Indian languages."""

    _instance: Optional["LanguageDetector"] = None

    def __init__(self) -> None:
        self._ft_model = None
        if os.path.exists(settings.FASTTEXT_MODEL_PATH):
            import fasttext

            self._ft_model = fasttext.load_model(settings.FASTTEXT_MODEL_PATH)

    @classmethod
    def get_instance(cls) -> "LanguageDetector":
        if cls._instance is None:
            cls._instance = cls()
        return cls._instance

    def detect(self, text: str, top_k: int = 3) -> LanguageDetectionResult:
        text = text.strip()
        if not text:
            return LanguageDetectionResult(language="en", confidence=0.0, all_predictions=[])

        script_lang = self._detect_by_script(text)
        if script_lang and self._is_predominantly_script(text, script_lang):
            return LanguageDetectionResult(
                language=script_lang,
                confidence=0.95,
                all_predictions=[(script_lang, 0.95)],
            )

        if self._ft_model:
            return self._fasttext_detect(text, top_k)

        return LanguageDetectionResult(language="en", confidence=0.5, all_predictions=[("en", 0.5)])

    def _fasttext_detect(self, text: str, top_k: int) -> LanguageDetectionResult:
        clean_text = text.replace("\n", " ")
        labels, scores = self._ft_model.predict(clean_text, k=top_k)

        all_preds = []
        for label, score in zip(labels, scores):
            lang_code = label.replace("__label__", "").split("_")[0]
            normalized = LANGUAGE_MAP.get(lang_code, lang_code)
            all_preds.append((normalized, float(score)))

        top_lang, top_score = all_preds[0] if all_preds else ("en", 0.0)
        return LanguageDetectionResult(
            language=top_lang,
            confidence=top_score,
            all_predictions=all_preds,
        )

    def _detect_by_script(self, text: str) -> Optional[str]:
        char_counts: dict[str, int] = {}
        for char in text:
            cp = ord(char)
            for lang, (start, end) in INDIC_SCRIPT_RANGES.items():
                if start <= cp <= end:
                    char_counts[lang] = char_counts.get(lang, 0) + 1
                    break
        if not char_counts:
            return None
        return max(char_counts, key=lambda k: char_counts[k])

    def _is_predominantly_script(self, text: str, lang: str) -> bool:
        start, end = INDIC_SCRIPT_RANGES.get(lang, (0, 0))
        if start == 0:
            return False
        script_chars = sum(1 for ch in text if start <= ord(ch) <= end)
        total_alpha = sum(1 for ch in text if ch.isalpha())
        return total_alpha > 0 and (script_chars / total_alpha) > 0.5


def get_language_detector() -> LanguageDetector:
    return LanguageDetector.get_instance()
