from __future__ import annotations
from datetime import datetime, timedelta, timezone
from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy import select, func, and_, case
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.db_utils import trunc_day, trunc_hour, as_date_str, as_datetime_str
from app.db.base import get_db
from app.middleware.auth import get_current_user
from app.models.conversation import Conversation, ConversationStatus
from app.models.message import Message
from app.models.usage import UsageEvent
from app.models.user import User

router = APIRouter(prefix="/analytics", tags=["analytics"])


@router.get("/overview")
async def get_overview(
    days: int = Query(30, ge=1, le=365),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    since = datetime.now(timezone.utc) - timedelta(days=days)

    total_conversations = await db.scalar(
        select(func.count(Conversation.id)).where(
            Conversation.tenant_id == current_user.tenant_id,
            Conversation.created_at >= since,
        )
    )

    completed_conversations = await db.scalar(
        select(func.count(Conversation.id)).where(
            Conversation.tenant_id == current_user.tenant_id,
            Conversation.created_at >= since,
            Conversation.status == ConversationStatus.COMPLETED,
        )
    )

    total_messages = await db.scalar(
        select(func.count(Message.id))
        .join(Conversation)
        .where(
            Conversation.tenant_id == current_user.tenant_id,
            Message.created_at >= since,
        )
    )

    avg_latency = await db.scalar(
        select(func.avg(Message.processing_latency_ms))
        .join(Conversation)
        .where(
            Conversation.tenant_id == current_user.tenant_id,
            Message.created_at >= since,
            Message.processing_latency_ms > 0,
        )
    )

    usage_result = await db.execute(
        select(
            UsageEvent.event_type,
            func.sum(UsageEvent.quantity).label("total"),
            func.sum(UsageEvent.cost_usd).label("cost"),
        )
        .where(
            UsageEvent.tenant_id == current_user.tenant_id,
            UsageEvent.created_at >= since,
        )
        .group_by(UsageEvent.event_type)
    )
    usage_by_type = {row.event_type: {"total": float(row.total or 0), "cost_usd": float(row.cost or 0)} for row in usage_result}

    return {
        "period_days": days,
        "total_conversations": total_conversations or 0,
        "completed_conversations": completed_conversations or 0,
        "completion_rate": (
            (completed_conversations or 0) / max(total_conversations or 1, 1)
        ),
        "total_messages": total_messages or 0,
        "avg_response_latency_ms": float(avg_latency or 0),
        "usage": usage_by_type,
    }


@router.get("/conversations")
async def get_conversation_analytics(
    days: int = Query(30, ge=1, le=365),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    since = datetime.now(timezone.utc) - timedelta(days=days)

    daily_result = await db.execute(
        select(
            trunc_day(Conversation.created_at).label("day"),
            func.count(Conversation.id).label("count"),
        )
        .where(
            Conversation.tenant_id == current_user.tenant_id,
            Conversation.created_at >= since,
        )
        .group_by("day")
        .order_by("day")
    )

    sentiment_result = await db.execute(
        select(
            Conversation.overall_sentiment,
            func.count(Conversation.id).label("count"),
        )
        .where(
            Conversation.tenant_id == current_user.tenant_id,
            Conversation.created_at >= since,
            Conversation.overall_sentiment != None,
        )
        .group_by(Conversation.overall_sentiment)
    )

    return {
        "daily": [
            {"date": as_date_str(row.day), "count": row.count}
            for row in daily_result
        ],
        "sentiment_distribution": {
            row.overall_sentiment: row.count for row in sentiment_result
        },
    }


@router.get("/languages")
async def get_language_analytics(
    days: int = Query(30, ge=1, le=365),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    since = datetime.now(timezone.utc) - timedelta(days=days)

    result = await db.execute(
        select(
            Conversation.source_language,
            Conversation.target_language,
            func.count(Conversation.id).label("count"),
        )
        .where(
            Conversation.tenant_id == current_user.tenant_id,
            Conversation.created_at >= since,
        )
        .group_by(Conversation.source_language, Conversation.target_language)
        .order_by(func.count(Conversation.id).desc())
    )

    return {
        "language_pairs": [
            {
                "source": row.source_language,
                "source_name": settings.LANGUAGE_NAMES.get(row.source_language, row.source_language),
                "target": row.target_language,
                "target_name": settings.LANGUAGE_NAMES.get(row.target_language, row.target_language),
                "count": row.count,
            }
            for row in result
        ]
    }


@router.get("/latency")
async def get_latency_analytics(
    days: int = Query(7, ge=1, le=90),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    since = datetime.now(timezone.utc) - timedelta(days=days)

    result = await db.execute(
        select(
            trunc_hour(Message.created_at).label("hour"),
            func.avg(Message.processing_latency_ms).label("avg_ms"),
            func.min(Message.processing_latency_ms).label("min_ms"),
            func.max(Message.processing_latency_ms).label("max_ms"),
            func.count(Message.id).label("count"),
        )
        .join(Conversation)
        .where(
            Conversation.tenant_id == current_user.tenant_id,
            Message.created_at >= since,
            Message.processing_latency_ms > 0,
        )
        .group_by("hour")
        .order_by("hour")
    )

    return {
        "hourly": [
            {
                "hour": as_datetime_str(row.hour),
                "avg_ms": float(row.avg_ms),
                "min_ms": float(row.min_ms),
                "max_ms": float(row.max_ms),
                "count": row.count,
            }
            for row in result
        ]
    }
