"""add user_id to voice_artists

Revision ID: 003
Revises: 002
Create Date: 2024-01-03 00:00:00.000000
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = "003"
down_revision: Union[str, None] = "002"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "voice_artists",
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=True),
    )
    op.create_index("ix_voice_artists_user_id", "voice_artists", ["user_id"])


def downgrade() -> None:
    op.drop_index("ix_voice_artists_user_id", table_name="voice_artists")
    op.drop_column("voice_artists", "user_id")
