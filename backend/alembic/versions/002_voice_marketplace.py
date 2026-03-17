"""voice marketplace tables

Revision ID: 002
Revises: 001
Create Date: 2024-01-02 00:00:00.000000
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = "002"
down_revision: Union[str, None] = "001"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "voice_artists",
        sa.Column("id", sa.Uuid(as_uuid=True), primary_key=True, server_default=sa.text("uuid_generate_v4()")),
        sa.Column("display_name", sa.String(255), nullable=False),
        sa.Column("slug", sa.String(255), nullable=False, unique=True),
        sa.Column("bio", sa.Text),
        sa.Column("tagline", sa.String(255)),
        sa.Column("category", sa.String(50), nullable=False),
        sa.Column("languages", sa.JSON, nullable=False, server_default="[]"),
        sa.Column("dialects", sa.JSON, nullable=False, server_default="[]"),
        sa.Column("specialties", sa.JSON, nullable=False, server_default="[]"),
        sa.Column("avatar_url", sa.String(500)),
        sa.Column("sample_audio_urls", sa.JSON, nullable=False, server_default="[]"),
        sa.Column("voice_clone_id", sa.Uuid(as_uuid=True), sa.ForeignKey("voice_clones.id", ondelete="SET NULL"), nullable=True),
        sa.Column("verification_status", sa.String(50), nullable=False, server_default="pending"),
        sa.Column("consent_signed_at", sa.DateTime(timezone=True)),
        sa.Column("consent_document_url", sa.String(500)),
        sa.Column("id_verified", sa.Boolean, nullable=False, server_default="false"),
        sa.Column("price_personal_inr", sa.Integer, nullable=False, server_default="0"),
        sa.Column("price_commercial_inr", sa.Integer, nullable=False, server_default="0"),
        sa.Column("price_broadcast_inr", sa.Integer, nullable=False, server_default="0"),
        sa.Column("price_exclusive_inr", sa.Integer, nullable=False, server_default="0"),
        sa.Column("platform_fee_pct", sa.Integer, nullable=False, server_default="20"),
        sa.Column("total_earnings_inr", sa.Integer, nullable=False, server_default="0"),
        sa.Column("total_licenses", sa.Integer, nullable=False, server_default="0"),
        sa.Column("avg_rating", sa.Numeric(3, 2), nullable=False, server_default="0.0"),
        sa.Column("rating_count", sa.Integer, nullable=False, server_default="0"),
        sa.Column("content_restrictions", sa.JSON, nullable=False, server_default="{}"),
        sa.Column("is_featured", sa.Boolean, nullable=False, server_default="false"),
        sa.Column("is_public", sa.Boolean, nullable=False, server_default="false"),
        sa.Column("stripe_connect_id", sa.String(255)),
        sa.Column("upi_id", sa.String(255)),
        sa.Column("email", sa.String(255)),
        sa.Column("phone", sa.String(50)),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_index("ix_voice_artists_slug", "voice_artists", ["slug"], unique=True)

    op.create_table(
        "voice_licenses",
        sa.Column("id", sa.Uuid(as_uuid=True), primary_key=True, server_default=sa.text("uuid_generate_v4()")),
        sa.Column("voice_artist_id", sa.Uuid(as_uuid=True), sa.ForeignKey("voice_artists.id", ondelete="CASCADE"), nullable=False),
        sa.Column("licensee_tenant_id", sa.Uuid(as_uuid=True), sa.ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False),
        sa.Column("tier", sa.String(50), nullable=False),
        sa.Column("status", sa.String(50), nullable=False, server_default="pending"),
        sa.Column("price_inr", sa.Integer, nullable=False),
        sa.Column("platform_fee_inr", sa.Integer, nullable=False),
        sa.Column("artist_earnings_inr", sa.Integer, nullable=False),
        sa.Column("content_category", sa.String(100), nullable=False, server_default="general"),
        sa.Column("usage_description", sa.Text),
        sa.Column("max_usage", sa.Integer),
        sa.Column("usage_count", sa.Integer, nullable=False, server_default="0"),
        sa.Column("approved_at", sa.DateTime(timezone=True)),
        sa.Column("expires_at", sa.DateTime(timezone=True)),
        sa.Column("stripe_payment_intent_id", sa.String(255)),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_index("ix_voice_licenses_voice_artist_id", "voice_licenses", ["voice_artist_id"])
    op.create_index("ix_voice_licenses_licensee_tenant_id", "voice_licenses", ["licensee_tenant_id"])


def downgrade() -> None:
    op.drop_table("voice_licenses")
    op.drop_table("voice_artists")
