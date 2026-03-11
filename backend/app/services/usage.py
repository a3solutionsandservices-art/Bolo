import uuid
from typing import Optional

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.usage import UsageEvent


class UsageService:
    @staticmethod
    async def record(
        db: AsyncSession,
        tenant_id: uuid.UUID,
        event_type: str,
        quantity: float,
        unit: str,
        conversation_id: Optional[uuid.UUID] = None,
        source_language: Optional[str] = None,
        target_language: Optional[str] = None,
        model_used: Optional[str] = None,
        metadata: Optional[dict] = None,
    ) -> UsageEvent:
        event = UsageEvent(
            tenant_id=tenant_id,
            conversation_id=conversation_id,
            event_type=event_type,
            quantity=quantity,
            unit=unit,
            source_language=source_language,
            target_language=target_language,
            model_used=model_used,
            metadata_=metadata or {},
        )
        db.add(event)
        await db.flush()
        return event
