from __future__ import annotations
import base64
import time
from dataclasses import dataclass
from typing import Optional
import httpx

from app.core.config import settings
from app.core.constants import SARVAM_LANGUAGE_CODES, split_text_into_chunks

SARVAM_DEFAULT_SPEAKERS = {
    "hi": "meera",
    "ta": "anushka",
    "te": "anushka",
    "bn": "meera",
    "gu": "meera",
    "mr": "meera",
    "en": "meera",
}


@dataclass
class SynthesisResult:
    audio_bytes: bytes
    audio_format: str
    language: str
    voice_id: str
    character_count: int
    processing_time_ms: float
    request_id: Optional[str] = None


class SarvamTTS:
    """Sarvam AI text-to-speech service for Indian languages."""

    _instance: Optional["SarvamTTS"] = None

    def __init__(self) -> None:
        self._client = httpx.AsyncClient(
            base_url=settings.SARVAM_API_BASE,
            headers={
                "api-subscription-key": settings.SARVAM_API_KEY,
                "Content-Type": "application/json",
            },
            timeout=60.0,
        )

    @classmethod
    def get_instance(cls) -> "SarvamTTS":
        if cls._instance is None:
            cls._instance = cls()
        return cls._instance

    async def synthesize(
        self,
        text: str,
        language: str,
        voice_id: Optional[str] = None,
        speaking_rate: float = 1.0,
        pitch: float = 0.0,
        loudness: float = 1.0,
        speech_sample_rate: int = 22050,
        enable_preprocessing: bool = True,
        model: str = "bulbul:v1",
    ) -> SynthesisResult:
        start = time.perf_counter()

        sarvam_lang = SARVAM_LANGUAGE_CODES.get(language, "en-IN")
        speaker = voice_id or SARVAM_DEFAULT_SPEAKERS.get(language, "meera")

        MAX_CHARS = 500
        if len(text) > MAX_CHARS:
            chunks = self._split_text(text, MAX_CHARS)
            audio_chunks = []
            for chunk in chunks:
                result = await self._synthesize_chunk(
                    chunk, sarvam_lang, speaker, speaking_rate, pitch,
                    loudness, speech_sample_rate, enable_preprocessing, model
                )
                audio_chunks.append(result)
            combined_audio = self._combine_audio_chunks(audio_chunks)
            elapsed_ms = (time.perf_counter() - start) * 1000
            return SynthesisResult(
                audio_bytes=combined_audio,
                audio_format="wav",
                language=language,
                voice_id=speaker,
                character_count=len(text),
                processing_time_ms=elapsed_ms,
            )

        response = await self._synthesize_chunk(
            text, sarvam_lang, speaker, speaking_rate, pitch,
            loudness, speech_sample_rate, enable_preprocessing, model
        )
        elapsed_ms = (time.perf_counter() - start) * 1000
        return SynthesisResult(
            audio_bytes=response,
            audio_format="wav",
            language=language,
            voice_id=speaker,
            character_count=len(text),
            processing_time_ms=elapsed_ms,
        )

    async def _synthesize_chunk(
        self,
        text: str,
        sarvam_lang: str,
        speaker: str,
        speaking_rate: float,
        pitch: float,
        loudness: float,
        speech_sample_rate: int,
        enable_preprocessing: bool,
        model: str,
    ) -> bytes:
        payload = {
            "inputs": [text],
            "target_language_code": sarvam_lang,
            "speaker": speaker,
            "pitch": pitch,
            "pace": speaking_rate,
            "loudness": loudness,
            "speech_sample_rate": speech_sample_rate,
            "enable_preprocessing": enable_preprocessing,
            "model": model,
        }
        response = await self._client.post("/text-to-speech", json=payload)
        response.raise_for_status()
        data = response.json()
        audio_b64 = data["audios"][0]
        return base64.b64decode(audio_b64)

    def _split_text(self, text: str, max_chars: int) -> list[str]:
        return split_text_into_chunks(text, max_chars) or [text[:max_chars]]

    def _combine_audio_chunks(self, chunks: list[bytes]) -> bytes:
        import io
        import soundfile as sf
        import numpy as np

        all_data = []
        sample_rate = 22050
        for chunk_bytes in chunks:
            buf = io.BytesIO(chunk_bytes)
            try:
                data, sr = sf.read(buf, dtype="float32")
                sample_rate = sr
                all_data.append(data)
            except Exception:
                pass

        if not all_data:
            return chunks[0] if chunks else b""

        combined = np.concatenate(all_data)
        out_buf = io.BytesIO()
        sf.write(out_buf, combined, sample_rate, format="WAV")
        return out_buf.getvalue()

    async def close(self) -> None:
        await self._client.aclose()


def get_tts() -> SarvamTTS:
    return SarvamTTS.get_instance()
