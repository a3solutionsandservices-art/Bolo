"""Add speaker metadata and data collection consent to voice_artists

Revision ID: 004
Revises: 003
Create Date: 2024-01-04 00:00:00.000000
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = "004"
down_revision: Union[str, None] = "003"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("voice_artists", sa.Column("data_collection_consent", sa.Boolean(), nullable=False, server_default="false"))
    op.add_column("voice_artists", sa.Column("data_consent_signed_at", sa.DateTime(timezone=True), nullable=True))
    op.add_column("voice_artists", sa.Column("age_range", sa.String(20), nullable=True))
    op.add_column("voice_artists", sa.Column("district", sa.String(100), nullable=True))
    op.add_column("voice_artists", sa.Column("native_region", sa.String(100), nullable=True))
    op.add_column("voice_artists", sa.Column("dialect_subtype", sa.String(100), nullable=True))


def downgrade() -> None:
    op.drop_column("voice_artists", "dialect_subtype")
    op.drop_column("voice_artists", "native_region")
    op.drop_column("voice_artists", "district")
    op.drop_column("voice_artists", "age_range")
    op.drop_column("voice_artists", "data_consent_signed_at")
    op.drop_column("voice_artists", "data_collection_consent")
