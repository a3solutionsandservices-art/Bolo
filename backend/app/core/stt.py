from __future__ import annotations
import io
import time
from dataclasses import dataclass
from pathlib import Path
from typing import Optional
import numpy as np

from app.core.config import settings


@dataclass
class TranscriptionResult:
    text: str
    language: str
    language_probability: float
    duration_seconds: float
    confidence: float
    segments: list[dict]
    processing_time_ms: float


class WhisperSTT:
    """Wrapper around faster-whisper for low-latency speech-to-text."""

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
        initial_prompt: Optional[str] = None,
    ) -> TranscriptionResult:
        start = time.perf_counter()

        audio_array = self._bytes_to_numpy(audio_bytes)

        kwargs: dict = {
            "beam_size": 5,
            "word_timestamps": False,
            "vad_filter": True,
            "vad_parameters": {"min_silence_duration_ms": 500},
        }
        if language:
            kwargs["language"] = language
        if initial_prompt:
            kwargs["initial_prompt"] = initial_prompt

        segments_iter, info = self.model.transcribe(audio_array, **kwargs)

        segments = []
        full_text_parts = []
        for seg in segments_iter:
            segments.append({
                "start": seg.start,
                "end": seg.end,
                "text": seg.text.strip(),
                "avg_logprob": seg.avg_logprob,
                "no_speech_prob": seg.no_speech_prob,
            })
            full_text_parts.append(seg.text)

        full_text = " ".join(full_text_parts).strip()

        avg_confidence = (
            float(np.mean([s["avg_logprob"] for s in segments]))
            if segments
            else 0.0
        )
        confidence_normalized = float(np.clip((avg_confidence + 1) / 1, 0, 1))

        elapsed_ms = (time.perf_counter() - start) * 1000

        return TranscriptionResult(
            text=full_text,
            language=info.language,
            language_probability=info.language_probability,
            duration_seconds=info.duration,
            confidence=confidence_normalized,
            segments=segments,
            processing_time_ms=elapsed_ms,
        )

    def _bytes_to_numpy(self, audio_bytes: bytes) -> np.ndarray:
        import soundfile as sf

        buf = io.BytesIO(audio_bytes)
        try:
            data, sample_rate = sf.read(buf, dtype="float32")
        except Exception:
            import librosa

            buf.seek(0)
            data, sample_rate = librosa.load(buf, sr=16000, mono=True)
            return data.astype(np.float32)

        if data.ndim > 1:
            data = data.mean(axis=1)

        if sample_rate != 16000:
            import librosa

            data = librosa.resample(data, orig_sr=sample_rate, target_sr=16000)

        return data.astype(np.float32)


def get_stt() -> WhisperSTT:
    return WhisperSTT.get_instance()
