from __future__ import annotations
import pytest
from unittest.mock import AsyncMock, patch, MagicMock
from httpx import AsyncClient

pytestmark = pytest.mark.asyncio


async def test_start_conversation(client: AsyncClient, auth_headers):
    resp = await client.post("/api/v1/conversations", json={
        "mode": "translation",
        "source_language": "en",
        "target_language": "hi",
    }, headers=auth_headers)
    assert resp.status_code == 201
    data = resp.json()
    assert data["mode"] == "translation"
    assert data["source_language"] == "en"
    assert data["target_language"] == "hi"
    assert "id" in data
    assert "session_id" in data
    return data["id"]


async def test_start_conversation_agent_mode(client: AsyncClient, auth_headers):
    resp = await client.post("/api/v1/conversations", json={
        "mode": "agent",
        "source_language": "hi",
        "target_language": "en",
    }, headers=auth_headers)
    assert resp.status_code == 201
    assert resp.json()["mode"] == "agent"


async def test_list_conversations(client: AsyncClient, auth_headers):
    resp = await client.get("/api/v1/conversations", headers=auth_headers)
    assert resp.status_code == 200
    assert isinstance(resp.json(), list)


async def test_list_conversations_pagination(client: AsyncClient, auth_headers):
    resp = await client.get("/api/v1/conversations?skip=0&limit=5", headers=auth_headers)
    assert resp.status_code == 200
    assert len(resp.json()) <= 5


async def test_get_conversation(client: AsyncClient, auth_headers):
    start_resp = await client.post("/api/v1/conversations", json={
        "mode": "conversation",
        "source_language": "en",
        "target_language": "hi",
    }, headers=auth_headers)
    conv_id = start_resp.json()["id"]

    resp = await client.get(f"/api/v1/conversations/{conv_id}", headers=auth_headers)
    assert resp.status_code == 200
    data = resp.json()
    assert data["id"] == conv_id
    assert "messages" in data


async def test_get_conversation_not_found(client: AsyncClient, auth_headers):
    resp = await client.get(
        "/api/v1/conversations/00000000-0000-0000-0000-000000000000",
        headers=auth_headers,
    )
    assert resp.status_code == 404


async def test_get_conversation_message_pagination(client: AsyncClient, auth_headers):
    start_resp = await client.post("/api/v1/conversations", json={
        "mode": "translation",
        "source_language": "en",
        "target_language": "hi",
    }, headers=auth_headers)
    conv_id = start_resp.json()["id"]

    resp = await client.get(
        f"/api/v1/conversations/{conv_id}?messages_skip=0&messages_limit=10",
        headers=auth_headers,
    )
    assert resp.status_code == 200
    data = resp.json()
    assert "messages_skip" in data
    assert "messages_limit" in data


async def test_send_message_translation_mode(client: AsyncClient, auth_headers):
    start_resp = await client.post("/api/v1/conversations", json={
        "mode": "translation",
        "source_language": "en",
        "target_language": "hi",
    }, headers=auth_headers)
    conv_id = start_resp.json()["id"]

    mock_translation = MagicMock()
    mock_translation.translated_text = "नमस्ते दुनिया"

    mock_tts = MagicMock()
    mock_tts.audio_bytes = b"\x00" * 100

    mock_sentiment = MagicMock()
    mock_sentiment.sentiment = "neutral"
    mock_sentiment.intent = "statement"
    mock_sentiment.intent_confidence = 0.9

    mock_lang = MagicMock()
    mock_lang.language = "en"
    mock_lang.confidence = 0.95

    with patch("app.api.conversation.get_translation_service") as mock_get_trans, \
         patch("app.api.conversation.get_tts") as mock_get_tts, \
         patch("app.api.conversation.get_sentiment_analyzer") as mock_get_sent, \
         patch("app.api.conversation.get_language_detector") as mock_get_lang, \
         patch("app.api.conversation.UsageService.record", new_callable=AsyncMock), \
         patch("app.services.storage.upload_audio", new_callable=AsyncMock) as mock_upload:

        mock_translator = MagicMock()
        mock_translator.translate = AsyncMock(return_value=mock_translation)
        mock_get_trans.return_value = mock_translator

        mock_tts_svc = MagicMock()
        mock_tts_svc.synthesize = AsyncMock(return_value=mock_tts)
        mock_get_tts.return_value = mock_tts_svc

        mock_sent_svc = MagicMock()
        mock_sent_svc.analyze = AsyncMock(return_value=mock_sentiment)
        mock_get_sent.return_value = mock_sent_svc

        mock_lang_svc = MagicMock()
        mock_lang_svc.detect = MagicMock(return_value=mock_lang)
        mock_get_lang.return_value = mock_lang_svc

        mock_upload.return_value = "https://s3.example.com/audio.wav"

        resp = await client.post(
            f"/api/v1/conversations/{conv_id}/message",
            json={"content": "Hello world"},
            headers=auth_headers,
        )

    assert resp.status_code == 200
    data = resp.json()
    assert "text" in data
    assert "message_id" in data
    assert data["text"] == "नमस्ते दुनिया"


async def test_send_message_to_inactive_conversation(client: AsyncClient, auth_headers):
    start_resp = await client.post("/api/v1/conversations", json={
        "mode": "translation",
        "source_language": "en",
        "target_language": "hi",
    }, headers=auth_headers)
    conv_id = start_resp.json()["id"]

    await client.patch(f"/api/v1/conversations/{conv_id}/end", headers=auth_headers)

    resp = await client.post(
        f"/api/v1/conversations/{conv_id}/message",
        json={"content": "Hello"},
        headers=auth_headers,
    )
    assert resp.status_code == 404


async def test_get_transcript(client: AsyncClient, auth_headers):
    start_resp = await client.post("/api/v1/conversations", json={
        "mode": "conversation",
        "source_language": "en",
        "target_language": "hi",
    }, headers=auth_headers)
    conv_id = start_resp.json()["id"]

    resp = await client.get(
        f"/api/v1/conversations/{conv_id}/transcript",
        headers=auth_headers,
    )
    assert resp.status_code == 200
    data = resp.json()
    assert "conversation_id" in data
    assert "messages" in data
    assert isinstance(data["messages"], list)


async def test_get_transcript_text_format(client: AsyncClient, auth_headers):
    start_resp = await client.post("/api/v1/conversations", json={
        "mode": "translation",
        "source_language": "en",
        "target_language": "hi",
    }, headers=auth_headers)
    conv_id = start_resp.json()["id"]

    resp = await client.get(
        f"/api/v1/conversations/{conv_id}/transcript?format=text",
        headers=auth_headers,
    )
    assert resp.status_code == 200


async def test_end_conversation(client: AsyncClient, auth_headers):
    start_resp = await client.post("/api/v1/conversations", json={
        "mode": "translation",
        "source_language": "en",
        "target_language": "hi",
    }, headers=auth_headers)
    conv_id = start_resp.json()["id"]

    resp = await client.patch(
        f"/api/v1/conversations/{conv_id}/end", headers=auth_headers
    )
    assert resp.status_code == 200
    assert resp.json()["status"] == "completed"


async def test_conversations_isolated_between_tenants(client: AsyncClient):
    tenant2_resp = await client.post("/api/v1/auth/register", json={
        "email": "tenant2@boloai.com",
        "password": "Tenant2Pass1",
        "full_name": "Tenant 2",
        "tenant_name": "Tenant Two",
        "tenant_slug": "tenant-two",
    })
    token2 = tenant2_resp.json()["access_token"]
    headers2 = {"Authorization": f"Bearer {token2}"}

    t2_start = await client.post("/api/v1/conversations", json={
        "mode": "translation",
        "source_language": "en",
        "target_language": "hi",
    }, headers=headers2)
    t2_conv_id = t2_start.json()["id"]

    t1_resp = await client.post("/api/v1/auth/register", json={
        "email": "tenant1@boloai.com",
        "password": "Tenant1Pass1",
        "full_name": "Tenant 1",
        "tenant_name": "Tenant One",
        "tenant_slug": "tenant-one",
    })
    token1 = t1_resp.json()["access_token"]
    headers1 = {"Authorization": f"Bearer {token1}"}

    resp = await client.get(f"/api/v1/conversations/{t2_conv_id}", headers=headers1)
    assert resp.status_code == 404
