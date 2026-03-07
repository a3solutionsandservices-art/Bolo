from __future__ import annotations
import uuid
from datetime import datetime, timezone, timedelta
from typing import Optional

import stripe
from fastapi import APIRouter, Depends, HTTPException, Request, status
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.db.base import get_db
from app.middleware.auth import get_current_user
from app.models.subscription import Subscription, SubscriptionStatus
from app.models.tenant import Tenant
from app.models.usage import UsageEvent
from app.models.user import User

router = APIRouter(prefix="/billing", tags=["billing"])

stripe.api_key = settings.STRIPE_SECRET_KEY

PLANS = {
    "starter": {
        "name": "Starter",
        "price_id": settings.STRIPE_STARTER_PRICE_ID,
        "price_monthly": 49,
        "limits": {
            "stt_minutes": 500,
            "tts_characters": 1_000_000,
            "conversations": 1_000,
        },
    },
    "growth": {
        "name": "Growth",
        "price_id": settings.STRIPE_GROWTH_PRICE_ID,
        "price_monthly": 199,
        "limits": {
            "stt_minutes": 2_500,
            "tts_characters": 5_000_000,
            "conversations": 10_000,
        },
    },
    "enterprise": {
        "name": "Enterprise",
        "price_id": None,
        "price_monthly": None,
        "limits": {"stt_minutes": -1, "tts_characters": -1, "conversations": -1},
    },
}


class SubscribeRequest(BaseModel):
    plan_tier: str
    success_url: str
    cancel_url: str


@router.get("/plans")
async def list_plans():
    return [
        {
            "tier": tier,
            "name": info["name"],
            "price_monthly": info["price_monthly"],
            "limits": info["limits"],
        }
        for tier, info in PLANS.items()
    ]


@router.post("/subscribe")
async def create_subscription(
    body: SubscribeRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if body.plan_tier not in PLANS:
        raise HTTPException(status_code=400, detail=f"Invalid plan: {body.plan_tier}")

    plan = PLANS[body.plan_tier]
    if not plan["price_id"]:
        raise HTTPException(status_code=400, detail="Enterprise plan requires manual setup")

    tenant_result = await db.execute(select(Tenant).where(Tenant.id == current_user.tenant_id))
    tenant = tenant_result.scalar_one()

    if not tenant.stripe_customer_id:
        customer = stripe.Customer.create(
            email=current_user.email,
            name=tenant.name,
            metadata={"tenant_id": str(tenant.id)},
        )
        tenant.stripe_customer_id = customer.id
        await db.commit()

    session = stripe.checkout.Session.create(
        customer=tenant.stripe_customer_id,
        mode="subscription",
        line_items=[{"price": plan["price_id"], "quantity": 1}],
        success_url=body.success_url,
        cancel_url=body.cancel_url,
        metadata={"tenant_id": str(tenant.id), "plan_tier": body.plan_tier},
    )

    return {"checkout_url": session.url, "session_id": session.id}


@router.post("/portal")
async def billing_portal(
    return_url: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    tenant_result = await db.execute(select(Tenant).where(Tenant.id == current_user.tenant_id))
    tenant = tenant_result.scalar_one()

    if not tenant.stripe_customer_id:
        raise HTTPException(status_code=400, detail="No billing account found")

    session = stripe.billing_portal.Session.create(
        customer=tenant.stripe_customer_id,
        return_url=return_url,
    )
    return {"portal_url": session.url}


@router.get("/usage")
async def get_current_usage(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    from sqlalchemy import func

    period_start = datetime.now(timezone.utc).replace(day=1, hour=0, minute=0, second=0, microsecond=0)

    result = await db.execute(
        select(
            UsageEvent.event_type,
            func.sum(UsageEvent.quantity).label("total"),
        )
        .where(
            UsageEvent.tenant_id == current_user.tenant_id,
            UsageEvent.created_at >= period_start,
        )
        .group_by(UsageEvent.event_type)
    )
    usage = {row.event_type: float(row.total) for row in result}

    tenant_result = await db.execute(select(Tenant).where(Tenant.id == current_user.tenant_id))
    tenant = tenant_result.scalar_one()
    plan = PLANS.get(tenant.plan_tier, PLANS["starter"])

    return {
        "period_start": period_start.isoformat(),
        "plan_tier": tenant.plan_tier,
        "limits": plan["limits"],
        "usage": {
            "stt_minutes": usage.get("stt", 0),
            "tts_characters": usage.get("tts", 0),
            "conversations": usage.get("conversation", 0),
            "translations": usage.get("translation", 0),
        },
    }


@router.get("/subscription")
async def get_subscription(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Subscription)
        .where(
            Subscription.tenant_id == current_user.tenant_id,
            Subscription.status.in_([SubscriptionStatus.ACTIVE, SubscriptionStatus.TRIALING]),
        )
        .order_by(Subscription.created_at.desc())
        .limit(1)
    )
    sub = result.scalar_one_or_none()
    if not sub:
        return {"subscription": None}

    return {
        "subscription": {
            "id": str(sub.id),
            "plan_tier": sub.plan_tier,
            "status": sub.status.value,
            "current_period_start": sub.current_period_start.isoformat(),
            "current_period_end": sub.current_period_end.isoformat(),
            "cancel_at_period_end": sub.cancel_at_period_end,
        }
    }


@router.post("/webhook", include_in_schema=False)
async def stripe_webhook(request: Request, db: AsyncSession = Depends(get_db)):
    payload = await request.body()
    sig_header = request.headers.get("stripe-signature")

    try:
        event = stripe.Webhook.construct_event(
            payload, sig_header, settings.STRIPE_WEBHOOK_SECRET
        )
    except (ValueError, stripe.error.SignatureVerificationError):
        raise HTTPException(status_code=400, detail="Invalid webhook signature")

    if event["type"] == "checkout.session.completed":
        session_data = event["data"]["object"]
        tenant_id = session_data["metadata"]["tenant_id"]
        plan_tier = session_data["metadata"]["plan_tier"]
        stripe_sub_id = session_data.get("subscription")

        if stripe_sub_id:
            stripe_sub = stripe.Subscription.retrieve(stripe_sub_id)
            sub = Subscription(
                tenant_id=uuid.UUID(tenant_id),
                stripe_subscription_id=stripe_sub_id,
                stripe_price_id=stripe_sub["items"]["data"][0]["price"]["id"],
                plan_tier=plan_tier,
                status=SubscriptionStatus.ACTIVE,
                current_period_start=datetime.fromtimestamp(
                    stripe_sub["current_period_start"], tz=timezone.utc
                ),
                current_period_end=datetime.fromtimestamp(
                    stripe_sub["current_period_end"], tz=timezone.utc
                ),
                limits=PLANS.get(plan_tier, {}).get("limits", {}),
            )
            db.add(sub)

            tenant_result = await db.execute(select(Tenant).where(Tenant.id == uuid.UUID(tenant_id)))
            tenant = tenant_result.scalar_one_or_none()
            if tenant:
                tenant.plan_tier = plan_tier
            await db.commit()

    elif event["type"] == "customer.subscription.deleted":
        sub_data = event["data"]["object"]
        result = await db.execute(
            select(Subscription).where(
                Subscription.stripe_subscription_id == sub_data["id"]
            )
        )
        sub = result.scalar_one_or_none()
        if sub:
            sub.status = SubscriptionStatus.CANCELED
            sub.canceled_at = datetime.now(timezone.utc)
            await db.commit()

    return {"status": "ok"}
