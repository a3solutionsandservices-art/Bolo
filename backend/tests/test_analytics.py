from __future__ import annotations
import pytest
from httpx import AsyncClient

pytestmark = pytest.mark.asyncio


async def test_analytics_overview(client: AsyncClient, auth_headers):
    resp = await client.get("/api/v1/analytics/overview", headers=auth_headers)
    assert resp.status_code == 200
    data = resp.json()
    assert "total_conversations" in data
    assert "total_messages" in data
    assert "avg_response_latency_ms" in data
    assert "usage" in data
    assert isinstance(data["total_conversations"], int)


async def test_analytics_overview_custom_days(client: AsyncClient, auth_headers):
    resp = await client.get("/api/v1/analytics/overview?days=7", headers=auth_headers)
    assert resp.status_code == 200
    assert resp.json()["period_days"] == 7


async def test_analytics_overview_invalid_days(client: AsyncClient, auth_headers):
    resp = await client.get("/api/v1/analytics/overview?days=0", headers=auth_headers)
    assert resp.status_code == 422


async def test_analytics_conversations(client: AsyncClient, auth_headers):
    resp = await client.get("/api/v1/analytics/conversations?days=30", headers=auth_headers)
    assert resp.status_code == 200
    data = resp.json()
    assert "daily" in data
    assert isinstance(data["daily"], list)
    assert "sentiment_distribution" in data


async def test_analytics_languages(client: AsyncClient, auth_headers):
    resp = await client.get("/api/v1/analytics/languages?days=30", headers=auth_headers)
    assert resp.status_code == 200
    data = resp.json()
    assert "language_pairs" in data
    assert isinstance(data["language_pairs"], list)


async def test_analytics_latency(client: AsyncClient, auth_headers):
    resp = await client.get("/api/v1/analytics/latency?days=7", headers=auth_headers)
    assert resp.status_code == 200
    data = resp.json()
    assert "hourly" in data
    assert isinstance(data["hourly"], list)


async def test_analytics_requires_auth(client: AsyncClient):
    resp = await client.get("/api/v1/analytics/overview")
    assert resp.status_code == 401
