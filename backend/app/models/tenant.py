import uuid
from datetime import datetime
from sqlalchemy import String, Boolean, JSON, DateTime, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import Uuid as UUID
from app.db.base import Base


class Tenant(Base):
    __tablename__ = "tenants"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    slug: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    domain: Mapped[str | None] = mapped_column(String(255), unique=True)

    logo_url: Mapped[str | None] = mapped_column(String(500))
    primary_color: Mapped[str] = mapped_column(String(7), default="#6366f1")
    secondary_color: Mapped[str] = mapped_column(String(7), default="#8b5cf6")
    widget_name: Mapped[str] = mapped_column(String(100), default="Bolo Assistant")
    widget_allowed_domains: Mapped[list] = mapped_column(JSON, default=list)

    default_source_language: Mapped[str] = mapped_column(String(10), default="en")
    default_target_language: Mapped[str] = mapped_column(String(10), default="hi")
    supported_languages: Mapped[list] = mapped_column(
        JSON, default=lambda: ["hi", "ta", "te", "bn", "gu", "mr", "en"]
    )

    stripe_customer_id: Mapped[str | None] = mapped_column(String(255))
    plan_tier: Mapped[str] = mapped_column(String(50), default="starter")

    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    is_white_label: Mapped[bool] = mapped_column(Boolean, default=False)

    settings: Mapped[dict] = mapped_column(JSON, default=dict)
    metadata_: Mapped[dict] = mapped_column("metadata", JSON, default=dict)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    users: Mapped[list["User"]] = relationship("User", back_populates="tenant", cascade="all, delete-orphan")
    api_keys: Mapped[list["APIKey"]] = relationship("APIKey", back_populates="tenant", cascade="all, delete-orphan")
    conversations: Mapped[list["Conversation"]] = relationship("Conversation", back_populates="tenant", cascade="all, delete-orphan")
    knowledge_bases: Mapped[list["KnowledgeBase"]] = relationship("KnowledgeBase", back_populates="tenant", cascade="all, delete-orphan")
    voice_clones: Mapped[list["VoiceClone"]] = relationship("VoiceClone", back_populates="tenant", cascade="all, delete-orphan")
    subscriptions: Mapped[list["Subscription"]] = relationship("Subscription", back_populates="tenant")
    webhooks: Mapped[list["Webhook"]] = relationship("Webhook", back_populates="tenant", cascade="all, delete-orphan")
