import uuid
from datetime import datetime
from sqlalchemy import String, DateTime, ForeignKey, JSON, Float, Integer, func
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy import Uuid as UUID
from app.db.base import Base


class UsageEvent(Base):
    __tablename__ = "usage_events"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("tenants.id", ondelete="CASCADE"), index=True)
    conversation_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("conversations.id", ondelete="SET NULL"))

    event_type: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    quantity: Mapped[float] = mapped_column(Float, default=1.0)
    unit: Mapped[str] = mapped_column(String(50), nullable=False)

    source_language: Mapped[str | None] = mapped_column(String(10))
    target_language: Mapped[str | None] = mapped_column(String(10))
    model_used: Mapped[str | None] = mapped_column(String(100))

    cost_usd: Mapped[float] = mapped_column(Float, default=0.0)
    metadata_: Mapped[dict] = mapped_column("metadata", JSON, default=dict)

    stripe_usage_record_id: Mapped[str | None] = mapped_column(String(255))

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), index=True)
