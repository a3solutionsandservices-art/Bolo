SARVAM_LANGUAGE_CODES: dict[str, str] = {
    "hi": "hi-IN",
    "ta": "ta-IN",
    "te": "te-IN",
    "bn": "bn-IN",
    "gu": "gu-IN",
    "mr": "mr-IN",
    "en": "en-IN",
}

SARVAM_LANGUAGE_CODES_WITH_AUTO: dict[str, str | None] = {
    **SARVAM_LANGUAGE_CODES,
    "auto": None,
}
