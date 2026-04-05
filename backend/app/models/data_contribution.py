import uuid
from datetime import datetime
from sqlalchemy import String, Boolean, DateTime, ForeignKey, JSON, Numeric, Integer, Text, func
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy import Uuid as UUID
from app.db.base import Base


class DataContribution(Base):
    __tablename__ = "data_contributions"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    voice_artist_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("voice_artists.id", ondelete="CASCADE"), index=True)

    prompt_id: Mapped[str] = mapped_column(String(100), nullable=False)
    prompt_text: Mapped[str] = mapped_column(Text, nullable=False)
    language: Mapped[str] = mapped_column(String(10), nullable=False)
    dialect: Mapped[str | None] = mapped_column(String(100))

    audio_url: Mapped[str] = mapped_column(String(500), nullable=False)
    transcript: Mapped[str | None] = mapped_column(Text)
    cer_score: Mapped[float | None] = mapped_column(Numeric(5, 4))
    is_accepted: Mapped[bool] = mapped_column(Boolean, default=False)
    is_peer_validated: Mapped[bool] = mapped_column(Boolean, default=False)

    speaker_age_range: Mapped[str | None] = mapped_column(String(20))
    speaker_district: Mapped[str | None] = mapped_column(String(100))
    speaker_native_region: Mapped[str | None] = mapped_column(String(100))
    speaker_dialect_subtype: Mapped[str | None] = mapped_column(String(100))
    duration_seconds: Mapped[float | None] = mapped_column(Numeric(8, 3))

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
