from __future__ import annotations
import io
import pytest
from unittest.mock import AsyncMock, patch, MagicMock
from httpx import AsyncClient

pytestmark = pytest.mark.asyncio


def _wav_bytes(duration_secs: float = 0.1) -> bytes:
    """Generate a minimal valid WAV file for testing."""
    import struct
    sample_rate = 16000
    num_samples = int(sample_rate * duration_secs)
    num_channels = 1
    bits_per_sample = 16
    byte_rate = sample_rate * num_channels * bits_per_sample // 8
    block_align = num_channels * bits_per_sample // 8
    data_size = num_samples * block_align

    header = struct.pack(
        "<4sI4s4sIHHIIHH4sI",
        b"RIFF", 36 + data_size, b"WAVE",
        b"fmt ", 16, 1, num_channels, sample_rate,
        byte_rate, block_align, bits_per_sample,
        b"data", data_size,
    )
    audio_data = b"\x00" * data_size
    return header + audio_data


async def test_transcribe_audio(client: AsyncClient, auth_headers):
    mock_result = MagicMock()
    mock_result.text = "Hello world"
    mock_result.language = "en"
    mock_result.language_probability = 0.98
    mock_result.duration_seconds = 1.5
    mock_result.confidence = 0.95
    mock_result.processing_time_ms = 120.0

    with patch("app.api.voice.get_stt") as mock_get_stt, \
         patch("app.services.usage.UsageService.record", new_callable=AsyncMock):
        mock_stt = MagicMock()
        mock_stt.transcribe = AsyncMock(return_value=mock_result)
        mock_get_stt.return_value = mock_stt

        resp = await client.post(
            "/api/v1/voice/transcribe",
            files={"audio": ("test.wav", _wav_bytes(), "audio/wav")},
            headers={"Authorization": auth_headers["Authorization"]},
        )

    assert resp.status_code == 200
    data = resp.json()
    assert data["text"] == "Hello world"
    assert data["language"] == "en"
    assert "processing_time_ms" in data


async def test_transcribe_audio_too_large(client: AsyncClient, auth_headers):
    large_bytes = b"\x00" * (26 * 1024 * 1024)
    resp = await client.post(
        "/api/v1/voice/transcribe",
        files={"audio": ("large.wav", large_bytes, "audio/wav")},
        headers={"Authorization": auth_headers["Authorization"]},
    )
    assert resp.status_code == 413


async def test_transcribe_requires_auth(client: AsyncClient):
    resp = await client.post(
        "/api/v1/voice/transcribe",
        files={"audio": ("test.wav", _wav_bytes(), "audio/wav")},
    )
    assert resp.status_code == 401


async def test_synthesize_speech(client: AsyncClient, auth_headers):
    mock_result = MagicMock()
    mock_result.audio_bytes = b"\x00" * 1000
    mock_result.audio_format = "wav"
    mock_result.voice_id = "default"
    mock_result.character_count = 11
    mock_result.processing_time_ms = 200.0

    with patch("app.api.voice.get_tts") as mock_get_tts, \
         patch("app.services.usage.UsageService.record", new_callable=AsyncMock):
        mock_tts = MagicMock()
        mock_tts.synthesize = AsyncMock(return_value=mock_result)
        mock_get_tts.return_value = mock_tts

        resp = await client.post("/api/v1/voice/synthesize", json={
            "text": "Hello world",
            "language": "en",
            "return_base64": True,
        }, headers=auth_headers)

    assert resp.status_code == 200
    data = resp.json()
    assert data["audio_format"] == "wav"
    assert data["character_count"] == 11
    assert "audio_base64" in data


async def test_synthesize_speech_binary(client: AsyncClient, auth_headers):
    mock_result = MagicMock()
    mock_result.audio_bytes = b"\x52\x49\x46\x46" + b"\x00" * 100
    mock_result.audio_format = "wav"
    mock_result.voice_id = "default"
    mock_result.character_count = 5
    mock_result.processing_time_ms = 150.0

    with patch("app.api.voice.get_tts") as mock_get_tts, \
         patch("app.services.usage.UsageService.record", new_callable=AsyncMock):
        mock_tts = MagicMock()
        mock_tts.synthesize = AsyncMock(return_value=mock_result)
        mock_get_tts.return_value = mock_tts

        resp = await client.post("/api/v1/voice/synthesize", json={
            "text": "नमस्ते",
            "language": "hi",
            "return_base64": False,
        }, headers=auth_headers)

    assert resp.status_code == 200
    assert resp.headers["content-type"] == "audio/wav"


async def test_translate_text(client: AsyncClient, auth_headers):
    mock_result = MagicMock()
    mock_result.translated_text = "नमस्ते दुनिया"
    mock_result.source_language = "en"
    mock_result.target_language = "hi"
    mock_result.model_used = "sarvam-mayura:v1"
    mock_result.processing_time_ms = 80.0
    mock_result.character_count = 11

    with patch("app.api.voice.get_translation_service") as mock_get_trans, \
         patch("app.services.usage.UsageService.record", new_callable=AsyncMock):
        mock_trans = MagicMock()
        mock_trans.translate = AsyncMock(return_value=mock_result)
        mock_get_trans.return_value = mock_trans

        resp = await client.post("/api/v1/voice/translate", json={
            "text": "Hello world",
            "source_language": "en",
            "target_language": "hi",
        }, headers=auth_headers)

    assert resp.status_code == 200
    data = resp.json()
    assert data["translated_text"] == "नमस्ते दुनिया"
    assert data["source_language"] == "en"
    assert data["target_language"] == "hi"


async def test_detect_language(client: AsyncClient, auth_headers):
    mock_result = MagicMock()
    mock_result.language = "hi"
    mock_result.confidence = 0.97
    mock_result.all_predictions = [("hi", 0.97), ("mr", 0.02)]

    with patch("app.api.voice.get_language_detector") as mock_get_det:
        mock_det = MagicMock()
        mock_det.detect = MagicMock(return_value=mock_result)
        mock_get_det.return_value = mock_det

        resp = await client.post("/api/v1/voice/detect-language", json={
            "text": "नमस्ते दुनिया"
        }, headers=auth_headers)

    assert resp.status_code == 200
    data = resp.json()
    assert data["language"] == "hi"
    assert data["confidence"] == pytest.approx(0.97)
    assert "language_name" in data
    assert isinstance(data["all_predictions"], list)


async def test_detect_language_english(client: AsyncClient, auth_headers):
    mock_result = MagicMock()
    mock_result.language = "en"
    mock_result.confidence = 0.99
    mock_result.all_predictions = [("en", 0.99)]

    with patch("app.api.voice.get_language_detector") as mock_get_det:
        mock_det = MagicMock()
        mock_det.detect = MagicMock(return_value=mock_result)
        mock_get_det.return_value = mock_det

        resp = await client.post("/api/v1/voice/detect-language", json={
            "text": "Hello, how are you today?"
        }, headers=auth_headers)

    assert resp.status_code == 200
    assert resp.json()["language"] == "en"
