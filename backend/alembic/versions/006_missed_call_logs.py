"""add missed_call_logs table

Revision ID: 006
Revises: 005
Create Date: 2024-01-06 00:00:00.000000
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = "006"
down_revision: Union[str, None] = "005"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "missed_call_logs",
        sa.Column("id", sa.Uuid(as_uuid=True), primary_key=True),
        sa.Column("tenant_id", sa.Uuid(as_uuid=True), sa.ForeignKey("tenants.id", ondelete="SET NULL"), nullable=True, index=True),
        sa.Column("caller_number", sa.String(50), nullable=False, index=True),
        sa.Column("called_number", sa.String(50), nullable=False),
        sa.Column("provider", sa.String(50), nullable=False, server_default="twilio"),
        sa.Column("status", sa.String(50), nullable=False, server_default="received", index=True),
        sa.Column("intent", sa.String(50), nullable=True),
        sa.Column("intent_confidence", sa.Float, nullable=True),
        sa.Column("call_sid", sa.String(255), nullable=True, index=True),
        sa.Column("callback_call_sid", sa.String(255), nullable=True),
        sa.Column("conversation_transcript", sa.JSON, nullable=True),
        sa.Column("raw_webhook_payload", sa.JSON, nullable=True),
        sa.Column("extracted_entities", sa.JSON, nullable=True),
        sa.Column("callback_error", sa.String(500), nullable=True),
        sa.Column("language_detected", sa.String(10), nullable=False, server_default="hi"),
        sa.Column("received_at", sa.DateTime(timezone=True), server_default=sa.func.now(), index=True),
        sa.Column("callback_initiated_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("callback_completed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )


def downgrade() -> None:
    op.drop_table("missed_call_logs")
