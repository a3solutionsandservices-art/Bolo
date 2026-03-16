"""initial schema

Revision ID: 001
Revises:
Create Date: 2024-01-01 00:00:00.000000
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = "001"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"')

    op.create_table(
        "tenants",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("uuid_generate_v4()")),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("slug", sa.String(100), nullable=False, unique=True),
        sa.Column("domain", sa.String(255), unique=True),
        sa.Column("logo_url", sa.String(500)),
        sa.Column("primary_color", sa.String(7), nullable=False, server_default="#6366f1"),
        sa.Column("secondary_color", sa.String(7), nullable=False, server_default="#8b5cf6"),
        sa.Column("widget_name", sa.String(100), nullable=False, server_default="BoloAI Assistant"),
        sa.Column("widget_allowed_domains", postgresql.JSON, nullable=False, server_default="[]"),
        sa.Column("default_source_language", sa.String(10), nullable=False, server_default="en"),
        sa.Column("default_target_language", sa.String(10), nullable=False, server_default="hi"),
        sa.Column("supported_languages", postgresql.JSON, nullable=False, server_default='["hi","ta","te","bn","gu","mr","en"]'),
        sa.Column("stripe_customer_id", sa.String(255)),
        sa.Column("plan_tier", sa.String(50), nullable=False, server_default="starter"),
        sa.Column("is_active", sa.Boolean, nullable=False, server_default="true"),
        sa.Column("is_white_label", sa.Boolean, nullable=False, server_default="false"),
        sa.Column("settings", postgresql.JSON, nullable=False, server_default="{}"),
        sa.Column("metadata", postgresql.JSON, nullable=False, server_default="{}"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_index("ix_tenants_slug", "tenants", ["slug"])

    op.create_table(
        "users",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("uuid_generate_v4()")),
        sa.Column("tenant_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False),
        sa.Column("email", sa.String(255), nullable=False, unique=True),
        sa.Column("hashed_password", sa.String(255), nullable=False),
        sa.Column("full_name", sa.String(255)),
        sa.Column("role", sa.String(50), nullable=False, server_default="viewer"),
        sa.Column("is_active", sa.Boolean, nullable=False, server_default="true"),
        sa.Column("is_verified", sa.Boolean, nullable=False, server_default="false"),
        sa.Column("last_login_at", sa.DateTime(timezone=True)),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_index("ix_users_email", "users", ["email"])
    op.create_index("ix_users_tenant_id", "users", ["tenant_id"])

    op.create_table(
        "api_keys",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("uuid_generate_v4()")),
        sa.Column("tenant_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False),
        sa.Column("created_by", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="SET NULL")),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("key_prefix", sa.String(10), nullable=False),
        sa.Column("key_hash", sa.String(255), nullable=False, unique=True),
        sa.Column("scopes", postgresql.JSON, nullable=False, server_default='["voice:read","voice:write","conversation:read","conversation:write"]'),
        sa.Column("is_active", sa.Boolean, nullable=False, server_default="true"),
        sa.Column("last_used_at", sa.DateTime(timezone=True)),
        sa.Column("expires_at", sa.DateTime(timezone=True)),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    op.create_table(
        "knowledge_bases",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("uuid_generate_v4()")),
        sa.Column("tenant_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("description", sa.Text),
        sa.Column("pinecone_namespace", sa.String(255), nullable=False, unique=True),
        sa.Column("embedding_model", sa.String(100), nullable=False, server_default="text-embedding-3-small"),
        sa.Column("is_active", sa.Boolean, nullable=False, server_default="true"),
        sa.Column("document_count", sa.Integer, nullable=False, server_default="0"),
        sa.Column("total_chunks", sa.Integer, nullable=False, server_default="0"),
        sa.Column("languages", postgresql.JSON, nullable=False, server_default='["en"]'),
        sa.Column("settings", postgresql.JSON, nullable=False, server_default="{}"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_index("ix_knowledge_bases_tenant_id", "knowledge_bases", ["tenant_id"])

    op.create_table(
        "knowledge_documents",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("uuid_generate_v4()")),
        sa.Column("knowledge_base_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("knowledge_bases.id", ondelete="CASCADE"), nullable=False),
        sa.Column("title", sa.String(500), nullable=False),
        sa.Column("filename", sa.String(255)),
        sa.Column("s3_key", sa.String(500)),
        sa.Column("content_type", sa.String(100), nullable=False, server_default="text/plain"),
        sa.Column("file_size_bytes", sa.Integer, nullable=False, server_default="0"),
        sa.Column("language", sa.String(10), nullable=False, server_default="en"),
        sa.Column("status", sa.String(50), nullable=False, server_default="pending"),
        sa.Column("chunk_count", sa.Integer, nullable=False, server_default="0"),
        sa.Column("error_message", sa.Text),
        sa.Column("metadata", postgresql.JSON, nullable=False, server_default="{}"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_index("ix_knowledge_documents_kb_id", "knowledge_documents", ["knowledge_base_id"])

    op.create_table(
        "conversations",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("uuid_generate_v4()")),
        sa.Column("tenant_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False),
        sa.Column("knowledge_base_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("knowledge_bases.id", ondelete="SET NULL")),
        sa.Column("session_id", sa.String(255), nullable=False, unique=True),
        sa.Column("mode", sa.String(50), nullable=False, server_default="conversation"),
        sa.Column("status", sa.String(50), nullable=False, server_default="active"),
        sa.Column("source_language", sa.String(10), nullable=False, server_default="en"),
        sa.Column("target_language", sa.String(10), nullable=False, server_default="hi"),
        sa.Column("caller_id", sa.String(255)),
        sa.Column("caller_metadata", postgresql.JSON, nullable=False, server_default="{}"),
        sa.Column("overall_sentiment", sa.String(50)),
        sa.Column("overall_intent", sa.String(100)),
        sa.Column("total_duration_seconds", sa.Float, nullable=False, server_default="0"),
        sa.Column("total_stt_characters", sa.Integer, nullable=False, server_default="0"),
        sa.Column("total_tts_characters", sa.Integer, nullable=False, server_default="0"),
        sa.Column("total_translation_characters", sa.Integer, nullable=False, server_default="0"),
        sa.Column("transcript_url", sa.String(500)),
        sa.Column("recording_url", sa.String(500)),
        sa.Column("ended_at", sa.DateTime(timezone=True)),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_index("ix_conversations_tenant_id", "conversations", ["tenant_id"])
    op.create_index("ix_conversations_session_id", "conversations", ["session_id"])
    op.create_index("ix_conversations_created_at", "conversations", ["created_at"])

    op.create_table(
        "messages",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("uuid_generate_v4()")),
        sa.Column("conversation_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("conversations.id", ondelete="CASCADE"), nullable=False),
        sa.Column("role", sa.String(50), nullable=False),
        sa.Column("content_original", sa.Text, nullable=False),
        sa.Column("content_translated", sa.Text),
        sa.Column("detected_language", sa.String(10)),
        sa.Column("source_language", sa.String(10), nullable=False),
        sa.Column("target_language", sa.String(10), nullable=False),
        sa.Column("audio_url", sa.String(500)),
        sa.Column("audio_duration_seconds", sa.Float, nullable=False, server_default="0"),
        sa.Column("stt_confidence", sa.Float, nullable=False, server_default="0"),
        sa.Column("sentiment", sa.String(50)),
        sa.Column("intent", sa.String(100)),
        sa.Column("intent_confidence", sa.Float, nullable=False, server_default="0"),
        sa.Column("rag_sources", postgresql.JSON, nullable=False, server_default="[]"),
        sa.Column("processing_latency_ms", sa.Float, nullable=False, server_default="0"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_index("ix_messages_conversation_id", "messages", ["conversation_id"])
    op.create_index("ix_messages_created_at", "messages", ["created_at"])

    op.create_table(
        "voice_clones",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("uuid_generate_v4()")),
        sa.Column("tenant_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("description", sa.String(500)),
        sa.Column("language", sa.String(10), nullable=False),
        sa.Column("sarvam_voice_id", sa.String(255)),
        sa.Column("status", sa.String(50), nullable=False, server_default="pending"),
        sa.Column("sample_audio_urls", postgresql.JSON, nullable=False, server_default="[]"),
        sa.Column("is_default", sa.Boolean, nullable=False, server_default="false"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    op.create_table(
        "subscriptions",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("uuid_generate_v4()")),
        sa.Column("tenant_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False),
        sa.Column("stripe_subscription_id", sa.String(255), nullable=False, unique=True),
        sa.Column("stripe_price_id", sa.String(255), nullable=False),
        sa.Column("plan_tier", sa.String(50), nullable=False),
        sa.Column("status", sa.String(50), nullable=False),
        sa.Column("current_period_start", sa.DateTime(timezone=True), nullable=False),
        sa.Column("current_period_end", sa.DateTime(timezone=True), nullable=False),
        sa.Column("cancel_at_period_end", sa.Boolean, nullable=False, server_default="false"),
        sa.Column("canceled_at", sa.DateTime(timezone=True)),
        sa.Column("limits", postgresql.JSON, nullable=False, server_default="{}"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    op.create_table(
        "usage_events",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("uuid_generate_v4()")),
        sa.Column("tenant_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False),
        sa.Column("conversation_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("conversations.id", ondelete="SET NULL")),
        sa.Column("event_type", sa.String(50), nullable=False),
        sa.Column("quantity", sa.Float, nullable=False, server_default="1"),
        sa.Column("unit", sa.String(50), nullable=False),
        sa.Column("source_language", sa.String(10)),
        sa.Column("target_language", sa.String(10)),
        sa.Column("model_used", sa.String(100)),
        sa.Column("cost_usd", sa.Float, nullable=False, server_default="0"),
        sa.Column("metadata", postgresql.JSON, nullable=False, server_default="{}"),
        sa.Column("stripe_usage_record_id", sa.String(255)),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_index("ix_usage_events_tenant_id", "usage_events", ["tenant_id"])
    op.create_index("ix_usage_events_event_type", "usage_events", ["event_type"])
    op.create_index("ix_usage_events_created_at", "usage_events", ["created_at"])

    op.create_table(
        "webhooks",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("uuid_generate_v4()")),
        sa.Column("tenant_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False),
        sa.Column("url", sa.String(500), nullable=False),
        sa.Column("secret", sa.String(255), nullable=False),
        sa.Column("events", postgresql.JSON, nullable=False, server_default='["conversation.completed","message.created"]'),
        sa.Column("is_active", sa.Boolean, nullable=False, server_default="true"),
        sa.Column("failure_count", sa.Integer, nullable=False, server_default="0"),
        sa.Column("last_triggered_at", sa.DateTime(timezone=True)),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )


def downgrade() -> None:
    op.drop_table("webhooks")
    op.drop_table("usage_events")
    op.drop_table("subscriptions")
    op.drop_table("voice_clones")
    op.drop_table("messages")
    op.drop_table("conversations")
    op.drop_table("knowledge_documents")
    op.drop_table("knowledge_bases")
    op.drop_table("api_keys")
    op.drop_table("users")
    op.drop_table("tenants")
