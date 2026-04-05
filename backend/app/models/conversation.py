import uuid
from datetime import datetime
from sqlalchemy import String, Boolean, DateTime, ForeignKey, JSON, Float, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import Uuid as UUID
from app.db.base import Base
import enum


class ConversationMode(str, enum.Enum):
    TRANSLATION = "translation"
    CONVERSATION = "conversation"
    AGENT = "agent"


class ConversationStatus(str, enum.Enum):
    ACTIVE = "active"
    COMPLETED = "completed"
    ABANDONED = "abandoned"


class Conversation(Base):
    __tablename__ = "conversations"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("tenants.id", ondelete="CASCADE"), index=True)
    knowledge_base_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("knowledge_bases.id", ondelete="SET NULL"))

    session_id: Mapped[str] = mapped_column(String(255), unique=True, index=True, default=lambda: str(uuid.uuid4()))
    mode: Mapped[ConversationMode] = mapped_column(String(50), default=ConversationMode.CONVERSATION)
    status: Mapped[ConversationStatus] = mapped_column(String(50), default=ConversationStatus.ACTIVE)

    source_language: Mapped[str] = mapped_column(String(10), default="en")
    target_language: Mapped[str] = mapped_column(String(10), default="hi")

    caller_id: Mapped[str | None] = mapped_column(String(255))
    caller_metadata: Mapped[dict] = mapped_column(JSON, default=dict)

    overall_sentiment: Mapped[str | None] = mapped_column(String(50))
    overall_intent: Mapped[str | None] = mapped_column(String(100))

    total_duration_seconds: Mapped[float] = mapped_column(Float, default=0.0)
    total_stt_characters: Mapped[int] = mapped_column(default=0)
    total_tts_characters: Mapped[int] = mapped_column(default=0)
    total_translation_characters: Mapped[int] = mapped_column(default=0)

    transcript_url: Mapped[str | None] = mapped_column(String(500))
    recording_url: Mapped[str | None] = mapped_column(String(500))

    ended_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), index=True)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    tenant: Mapped["Tenant"] = relationship("Tenant", back_populates="conversations")
    knowledge_base: Mapped["KnowledgeBase | None"] = relationship("KnowledgeBase")
    messages: Mapped[list["Message"]] = relationship("Message", back_populates="conversation", cascade="all, delete-orphan", order_by="Message.created_at")
