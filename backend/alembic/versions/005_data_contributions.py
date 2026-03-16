"""Create data_contributions table for language data collection

Revision ID: 005
Revises: 004
Create Date: 2024-01-05 00:00:00.000000
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = "005"
down_revision: Union[str, None] = "004"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "data_contributions",
        sa.Column("id", sa.Uuid(as_uuid=True), primary_key=True),
        sa.Column("voice_artist_id", sa.Uuid(as_uuid=True), sa.ForeignKey("voice_artists.id", ondelete="CASCADE"), nullable=False, index=True),
        sa.Column("prompt_id", sa.String(100), nullable=False),
        sa.Column("prompt_text", sa.Text(), nullable=False),
        sa.Column("language", sa.String(10), nullable=False),
        sa.Column("dialect", sa.String(100), nullable=True),
        sa.Column("audio_url", sa.String(500), nullable=False),
        sa.Column("transcript", sa.Text(), nullable=True),
        sa.Column("cer_score", sa.Numeric(5, 4), nullable=True),
        sa.Column("is_accepted", sa.Boolean(), nullable=False, server_default="false"),
        sa.Column("is_peer_validated", sa.Boolean(), nullable=False, server_default="false"),
        sa.Column("speaker_age_range", sa.String(20), nullable=True),
        sa.Column("speaker_district", sa.String(100), nullable=True),
        sa.Column("speaker_native_region", sa.String(100), nullable=True),
        sa.Column("speaker_dialect_subtype", sa.String(100), nullable=True),
        sa.Column("duration_seconds", sa.Numeric(8, 3), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
    )
    op.create_index("ix_data_contributions_language", "data_contributions", ["language"])
    op.create_index("ix_data_contributions_is_accepted", "data_contributions", ["is_accepted"])


def downgrade() -> None:
    op.drop_table("data_contributions")
