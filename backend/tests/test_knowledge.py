from __future__ import annotations
import pytest
from unittest.mock import AsyncMock, patch, MagicMock
from httpx import AsyncClient

pytestmark = pytest.mark.asyncio


async def test_create_knowledge_base(client: AsyncClient, auth_headers):
    resp = await client.post("/api/v1/knowledge-bases", json={
        "name": "Product FAQ",
        "description": "Frequently asked questions",
        "languages": ["hi", "en"],
    }, headers=auth_headers)
    assert resp.status_code == 201
    data = resp.json()
    assert data["name"] == "Product FAQ"
    assert "id" in data
    assert data["document_count"] == 0
    return data["id"]


async def test_list_knowledge_bases(client: AsyncClient, auth_headers):
    resp = await client.get("/api/v1/knowledge-bases", headers=auth_headers)
    assert resp.status_code == 200
    assert isinstance(resp.json(), list)


async def test_get_knowledge_base(client: AsyncClient, auth_headers):
    create_resp = await client.post("/api/v1/knowledge-bases", json={
        "name": "Support Docs",
    }, headers=auth_headers)
    kb_id = create_resp.json()["id"]

    resp = await client.get(f"/api/v1/knowledge-bases/{kb_id}", headers=auth_headers)
    assert resp.status_code == 200
    assert resp.json()["id"] == kb_id


async def test_get_knowledge_base_not_found(client: AsyncClient, auth_headers):
    resp = await client.get(
        "/api/v1/knowledge-bases/00000000-0000-0000-0000-000000000000",
        headers=auth_headers,
    )
    assert resp.status_code == 404


async def test_upload_document(client: AsyncClient, auth_headers):
    create_resp = await client.post("/api/v1/knowledge-bases", json={
        "name": "Upload Test KB",
    }, headers=auth_headers)
    kb_id = create_resp.json()["id"]

    content = b"This is a sample document about BoloAI features."

    with patch("app.api.knowledge.upload_document", new_callable=AsyncMock) as mock_upload, \
         patch("app.api.knowledge.process_document") as mock_task:
        mock_upload.return_value = "s3://bucket/key.txt"
        mock_task.delay = MagicMock()

        resp = await client.post(
            f"/api/v1/knowledge-bases/{kb_id}/documents",
            files={"file": ("sample.txt", content, "text/plain")},
            data={"title": "Sample Doc", "language": "en"},
            headers={"Authorization": auth_headers["Authorization"]},
        )

    assert resp.status_code == 201
    data = resp.json()
    assert data["title"] == "Sample Doc"
    assert data["status"] in ("pending", "processing")


async def test_list_documents(client: AsyncClient, auth_headers):
    create_resp = await client.post("/api/v1/knowledge-bases", json={
        "name": "List Docs KB",
    }, headers=auth_headers)
    kb_id = create_resp.json()["id"]

    resp = await client.get(
        f"/api/v1/knowledge-bases/{kb_id}/documents", headers=auth_headers
    )
    assert resp.status_code == 200
    assert isinstance(resp.json(), list)


async def test_query_knowledge_base(client: AsyncClient, auth_headers):
    create_resp = await client.post("/api/v1/knowledge-bases", json={
        "name": "Query Test KB",
    }, headers=auth_headers)
    kb_id = create_resp.json()["id"]

    mock_results = [
        {"content": "BoloAI supports Hindi, Tamil, Telugu.", "metadata": {}, "score": 0.92},
        {"content": "The platform uses Sarvam AI for TTS.", "metadata": {}, "score": 0.85},
    ]

    with patch("app.api.knowledge.get_rag_agent") as mock_get_rag:
        mock_rag = MagicMock()
        mock_rag.query = AsyncMock(return_value=mock_results)
        mock_get_rag.return_value = mock_rag

        resp = await client.post(
            f"/api/v1/knowledge-bases/{kb_id}/query?question=What+languages+are+supported",
            headers=auth_headers,
        )

    assert resp.status_code == 200
    data = resp.json()
    assert "results" in data
    assert len(data["results"]) == 2
    assert data["results"][0]["score"] == pytest.approx(0.92)


async def test_delete_document(client: AsyncClient, auth_headers):
    create_resp = await client.post("/api/v1/knowledge-bases", json={
        "name": "Delete Test KB",
    }, headers=auth_headers)
    kb_id = create_resp.json()["id"]

    with patch("app.api.knowledge.upload_document", new_callable=AsyncMock) as mock_upload, \
         patch("app.api.knowledge.process_document") as mock_task:
        mock_upload.return_value = "s3://bucket/key.txt"
        mock_task.delay = MagicMock()

        upload_resp = await client.post(
            f"/api/v1/knowledge-bases/{kb_id}/documents",
            files={"file": ("test.txt", b"content", "text/plain")},
            data={"title": "Delete Me"},
            headers={"Authorization": auth_headers["Authorization"]},
        )

    doc_id = upload_resp.json()["id"]

    with patch("app.api.knowledge.get_rag_agent") as mock_get_rag:
        mock_rag = MagicMock()
        mock_rag.delete_document = AsyncMock()
        mock_get_rag.return_value = mock_rag

        del_resp = await client.delete(
            f"/api/v1/knowledge-bases/{kb_id}/documents/{doc_id}",
            headers=auth_headers,
        )

    assert del_resp.status_code == 204


async def test_knowledge_base_requires_auth(client: AsyncClient):
    resp = await client.get("/api/v1/knowledge-bases")
    assert resp.status_code == 401
