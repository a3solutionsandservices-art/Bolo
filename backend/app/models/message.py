import uuid
from datetime import datetime
from sqlalchemy import String, DateTime, ForeignKey, JSON, Float, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import Uuid as UUID
from app.db.base import Base
import enum


class MessageRole(str, enum.Enum):
    USER = "user"
    ASSISTANT = "assistant"
    SYSTEM = "system"


class Message(Base):
    __tablename__ = "messages"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    conversation_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("conversations.id", ondelete="CASCADE"), index=True)

    role: Mapped[MessageRole] = mapped_column(String(50), nullable=False)
    content_original: Mapped[str] = mapped_column(Text, nullable=False)
    content_translated: Mapped[str | None] = mapped_column(Text)

    detected_language: Mapped[str | None] = mapped_column(String(10))
    source_language: Mapped[str] = mapped_column(String(10))
    target_language: Mapped[str] = mapped_column(String(10))

    audio_url: Mapped[str | None] = mapped_column(String(500))
    audio_duration_seconds: Mapped[float] = mapped_column(Float, default=0.0)
    stt_confidence: Mapped[float] = mapped_column(Float, default=0.0)

    sentiment: Mapped[str | None] = mapped_column(String(50))
    intent: Mapped[str | None] = mapped_column(String(100))
    intent_confidence: Mapped[float] = mapped_column(Float, default=0.0)

    rag_sources: Mapped[list] = mapped_column(JSON, default=list)
    processing_latency_ms: Mapped[float] = mapped_column(Float, default=0.0)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), index=True)

    conversation: Mapped["Conversation"] = relationship("Conversation", back_populates="messages")
