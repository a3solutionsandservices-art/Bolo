from __future__ import annotations
import base64
import io
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
    "auto": None,
}


@dataclass
class TranscriptionResult:
    text: str
    language: str
    language_probability: float
    duration_seconds: float
    confidence: float
    segments: list[dict]
    processing_time_ms: float
    provider: str = "sarvam"


class SarvamSTT:
    """
    Sarvam Saaras speech-to-text.
    Primary provider in the AI Processing Layer.

    API: POST /speech-to-text
    Supports all 7 target Indian languages natively with low-latency streaming.
    Also supports speech-to-text-translate for direct cross-lingual transcription.
    """

    _instance: Optional["SarvamSTT"] = None

    def __init__(self) -> None:
        self._client = httpx.AsyncClient(
            base_url=settings.SARVAM_API_BASE,
            headers={"api-subscription-key": settings.SARVAM_API_KEY},
            timeout=60.0,
        )

    @classmethod
    def get_instance(cls) -> "SarvamSTT":
        if cls._instance is None:
            cls._instance = cls()
        return cls._instance

    async def transcribe(
        self,
        audio_bytes: bytes,
        language: Optional[str] = None,
        translate_to: Optional[str] = None,
    ) -> TranscriptionResult:
        start = time.perf_counter()

        sarvam_lang = SARVAM_LANGUAGE_CODES.get(language or "auto")

        audio_b64 = base64.b64encode(audio_bytes).decode()

        if translate_to and translate_to != language:
            result = await self._call_stt_translate(audio_b64, sarvam_lang, translate_to)
        else:
            result = await self._call_stt(audio_b64, sarvam_lang)

        result.processing_time_ms = (time.perf_counter() - start) * 1000
        return result

    async def _call_stt(self, audio_b64: str, language_code: Optional[str]) -> TranscriptionResult:
        payload: dict = {
            "model": settings.SARVAM_STT_MODEL,
            "audio": audio_b64,
            "with_timestamps": True,
            "with_diarization": settings.SARVAM_STT_WITH_DIARIZATION,
        }
        if language_code:
            payload["language_code"] = language_code

        resp = await self._client.post("/speech-to-text", json=payload)
        resp.raise_for_status()
        data = resp.json()

        transcript = data.get("transcript", "")
        detected_lang = self._parse_language(data.get("language_code", language_code or "en-IN"))
        chunks = data.get("chunks", [])

        segments = [
            {
                "start": c.get("start", 0.0),
                "end": c.get("end", 0.0),
                "text": c.get("text", ""),
                "speaker": c.get("speaker"),
            }
            for c in chunks
        ]

        duration = max((c.get("end", 0) for c in chunks), default=0.0)

        return TranscriptionResult(
            text=transcript,
            language=detected_lang,
            language_probability=0.95,
            duration_seconds=float(duration),
            confidence=0.92,
            segments=segments,
            processing_time_ms=0.0,
            provider="sarvam-saaras",
        )

    async def _call_stt_translate(
        self,
        audio_b64: str,
        source_language: Optional[str],
        target_language: str,
    ) -> TranscriptionResult:
        target_sarvam = SARVAM_LANGUAGE_CODES.get(target_language, "en-IN")

        payload: dict = {
            "model": settings.SARVAM_STT_MODEL,
            "audio": audio_b64,
            "target_language_code": target_sarvam or "en-IN",
        }
        if source_language:
            payload["source_language_code"] = source_language

        resp = await self._client.post("/speech-to-text-translate", json=payload)
        resp.raise_for_status()
        data = resp.json()

        transcript = data.get("transcript", "")
        detected_lang = self._parse_language(
            data.get("source_language_code", source_language or "en-IN")
        )

        return TranscriptionResult(
            text=transcript,
            language=detected_lang,
            language_probability=0.95,
            duration_seconds=0.0,
            confidence=0.90,
            segments=[],
            processing_time_ms=0.0,
            provider="sarvam-saaras-translate",
        )

    def _parse_language(self, code: Optional[str]) -> str:
        if not code:
            return "en"
        return code.split("-")[0].lower() if "-" in code else code.lower()

    async def close(self) -> None:
        await self._client.aclose()


class WhisperSTT:
    """
    Fallback STT using faster-whisper (local).
    Used when Sarvam API is unavailable or for non-Indian language audio.
    """

    _instance: Optional["WhisperSTT"] = None

    def __init__(self) -> None:
        from faster_whisper import WhisperModel

        self.model = WhisperModel(
            settings.WHISPER_MODEL_SIZE,
            device=settings.WHISPER_DEVICE,
            compute_type=settings.WHISPER_COMPUTE_TYPE,
        )

    @classmethod
    def get_instance(cls) -> "WhisperSTT":
        if cls._instance is None:
            cls._instance = cls()
        return cls._instance

    def transcribe(
        self,
        audio_bytes: bytes,
        language: Optional[str] = None,
    ) -> TranscriptionResult:
        import numpy as np

        start = time.perf_counter()
        audio_array = self._to_numpy(audio_bytes)

        kwargs: dict = {
            "beam_size": 5,
            "vad_filter": True,
            "vad_parameters": {"min_silence_duration_ms": 500},
        }
        if language and language != "auto":
            kwargs["language"] = language

        segments_iter, info = self.model.transcribe(audio_array, **kwargs)

        segments, text_parts = [], []
        for seg in segments_iter:
            segments.append({"start": seg.start, "end": seg.end, "text": seg.text.strip()})
            text_parts.append(seg.text)

        text = " ".join(text_parts).strip()
        avg_logprob = float(np.mean([s.get("avg_logprob", -0.5) for s in segments])) if segments else -0.5
        confidence = float(np.clip((avg_logprob + 1), 0, 1))

        return TranscriptionResult(
            text=text,
            language=info.language,
            language_probability=info.language_probability,
            duration_seconds=info.duration,
            confidence=confidence,
            segments=segments,
            processing_time_ms=(time.perf_counter() - start) * 1000,
            provider="whisper",
        )

    def _to_numpy(self, audio_bytes: bytes):
        import numpy as np
        import soundfile as sf

        buf = io.BytesIO(audio_bytes)
        try:
            data, sr = sf.read(buf, dtype="float32")
        except Exception:
            import librosa
            buf.seek(0)
            data, sr = librosa.load(buf, sr=16000, mono=True)
            return data.astype(np.float32)

        if data.ndim > 1:
            data = data.mean(axis=1)
        if sr != 16000:
            import librosa
            data = librosa.resample(data, orig_sr=sr, target_sr=16000)
        return data.astype(np.float32)


class STTPipeline:
    """
    Unified STT entry-point.
    Routes to Sarvam Saaras (primary) → Whisper (fallback) per the architecture diagram.
    """

    _sarvam: Optional[SarvamSTT] = None
    _whisper: Optional[WhisperSTT] = None

    @classmethod
    def _get_sarvam(cls) -> SarvamSTT:
        if cls._sarvam is None:
            cls._sarvam = SarvamSTT.get_instance()
        return cls._sarvam

    @classmethod
    def _get_whisper(cls) -> Optional[WhisperSTT]:
        if settings.STT_FALLBACK_PROVIDER != "whisper":
            return None
        if cls._whisper is None:
            try:
                cls._whisper = WhisperSTT.get_instance()
            except Exception:
                return None
        return cls._whisper

    async def transcribe(
        self,
        audio_bytes: bytes,
        language: Optional[str] = None,
        translate_to: Optional[str] = None,
    ) -> TranscriptionResult:
        if settings.STT_PROVIDER == "sarvam" and settings.SARVAM_API_KEY:
            try:
                return await self._get_sarvam().transcribe(audio_bytes, language, translate_to)
            except Exception as exc:
                if settings.STT_FALLBACK_PROVIDER != "whisper":
                    raise
                import logging
                logging.getLogger(__name__).warning(
                    "Sarvam STT failed (%s), falling back to Whisper", exc
                )

        whisper = self._get_whisper()
        if whisper:
            return whisper.transcribe(audio_bytes, language)

        raise RuntimeError("No STT provider available. Set SARVAM_API_KEY or ensure Whisper model is loaded.")


_pipeline: Optional[STTPipeline] = None


def get_stt() -> STTPipeline:
    global _pipeline
    if _pipeline is None:
        _pipeline = STTPipeline()
    return _pipeline
