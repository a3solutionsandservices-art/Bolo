import re as _re

_SENTENCE_SPLIT_RE = _re.compile(r"(?<=[।.!?])\s+")


def split_text_into_chunks(text: str, max_chars: int) -> list[str]:
    """Split text at sentence boundaries for chunked STT/TTS/Translation calls."""
    sentences = _SENTENCE_SPLIT_RE.split(text)
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


SARVAM_LANGUAGE_CODES: dict[str, str] = {
    "hi": "hi-IN",
    "ta": "ta-IN",
    "te": "te-IN",
    "bn": "bn-IN",
    "gu": "gu-IN",
    "mr": "mr-IN",
    "kn": "kn-IN",
    "ml": "ml-IN",
    "pa": "pa-IN",
    "or": "or-IN",
    "en": "en-IN",
}

SARVAM_LANGUAGE_CODES_WITH_AUTO: dict[str, str | None] = {
    **SARVAM_LANGUAGE_CODES,
    "auto": None,
}
