from __future__ import annotations
import pytest
from unittest.mock import patch, MagicMock
from httpx import AsyncClient

pytestmark = pytest.mark.asyncio


async def test_list_plans(client: AsyncClient):
    resp = await client.get("/api/v1/billing/plans")
    assert resp.status_code == 200
    plans = resp.json()
    assert isinstance(plans, list)
    assert len(plans) >= 3

    tiers = [p["tier"] for p in plans]
    assert "starter" in tiers
    assert "growth" in tiers
    assert "enterprise" in tiers

    for plan in plans:
        assert "tier" in plan
        assert "name" in plan
        assert "limits" in plan
        assert "stt_minutes" in plan["limits"]
        assert "tts_characters" in plan["limits"]
        assert "conversations" in plan["limits"]


async def test_list_plans_no_auth_required(client: AsyncClient):
    resp = await client.get("/api/v1/billing/plans")
    assert resp.status_code == 200


async def test_subscribe_invalid_plan(client: AsyncClient, auth_headers):
    with patch("stripe.checkout.Session.create") as mock_stripe:
        resp = await client.post("/api/v1/billing/subscribe", json={
            "plan_tier": "nonexistent",
            "success_url": "https://app.vaaniai.com/billing?success=true",
            "cancel_url": "https://app.vaaniai.com/billing",
        }, headers=auth_headers)

    assert resp.status_code == 400


async def test_subscribe_enterprise_plan(client: AsyncClient, auth_headers):
    resp = await client.post("/api/v1/billing/subscribe", json={
        "plan_tier": "enterprise",
        "success_url": "https://app.vaaniai.com/billing?success=true",
        "cancel_url": "https://app.vaaniai.com/billing",
    }, headers=auth_headers)
    assert resp.status_code == 400


async def test_subscribe_starter_plan(client: AsyncClient, auth_headers):
    mock_session = MagicMock()
    mock_session.url = "https://checkout.stripe.com/test/session123"

    with patch("stripe.checkout.Session.create", return_value=mock_session):
        resp = await client.post("/api/v1/billing/subscribe", json={
            "plan_tier": "starter",
            "success_url": "https://app.vaaniai.com/billing?success=true",
            "cancel_url": "https://app.vaaniai.com/billing",
        }, headers=auth_headers)

    assert resp.status_code == 200
    data = resp.json()
    assert "checkout_url" in data
    assert data["checkout_url"] == "https://checkout.stripe.com/test/session123"


async def test_get_usage(client: AsyncClient, auth_headers):
    resp = await client.get("/api/v1/billing/usage", headers=auth_headers)
    assert resp.status_code == 200
    data = resp.json()
    assert "plan_tier" in data
    assert "usage" in data
    assert "limits" in data


async def test_get_subscription_no_sub(client: AsyncClient, auth_headers):
    resp = await client.get("/api/v1/billing/subscription", headers=auth_headers)
    assert resp.status_code in (200, 404)


async def test_billing_requires_auth(client: AsyncClient):
    resp = await client.get("/api/v1/billing/usage")
    assert resp.status_code == 401


async def test_billing_portal_requires_auth(client: AsyncClient):
    resp = await client.post("/api/v1/billing/portal")
    assert resp.status_code == 401
