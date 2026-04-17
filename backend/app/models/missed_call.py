import enum
import uuid
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, JSON, String, func
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy import Uuid as UUID

from app.db.base import Base


class MissedCallStatus(str, enum.Enum):
    RECEIVED = "received"
    CALLBACK_INITIATED = "callback_initiated"
    CALLBACK_COMPLETED = "callback_completed"
    CALLBACK_FAILED = "callback_failed"
    NO_ANSWER = "no_answer"
    VOICEMAIL_LEFT = "voicemail_left"
    USER_DISCONNECTED = "user_disconnected"


class CallIntent(str, enum.Enum):
    BOOKING = "booking"
    INQUIRY = "inquiry"
    COMPLAINT = "complaint"
    SUPPORT = "support"
    OTHER = "other"


class MissedCallLog(Base):
    __tablename__ = "missed_call_logs"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("tenants.id", ondelete="SET NULL"), index=True, nullable=True)

    caller_number: Mapped[str] = mapped_column(String(50), index=True)
    called_number: Mapped[str] = mapped_column(String(50))
    provider: Mapped[str] = mapped_column(String(50), default="twilio")

    status: Mapped[MissedCallStatus] = mapped_column(String(50), default=MissedCallStatus.RECEIVED, index=True)
    intent: Mapped[CallIntent | None] = mapped_column(String(50), nullable=True)
    intent_confidence: Mapped[float | None] = mapped_column(nullable=True)

    call_sid: Mapped[str | None] = mapped_column(String(255), index=True, nullable=True)
    callback_call_sid: Mapped[str | None] = mapped_column(String(255), nullable=True)

    conversation_transcript: Mapped[list | None] = mapped_column(JSON, nullable=True)
    raw_webhook_payload: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    extracted_entities: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    callback_error: Mapped[str | None] = mapped_column(String(500), nullable=True)

    language_detected: Mapped[str] = mapped_column(String(10), default="hi")

    received_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), index=True)
    callback_initiated_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    callback_completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
