import uuid
import enum
from datetime import datetime
from sqlalchemy import String, Boolean, DateTime, ForeignKey, JSON, Numeric, Integer, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import Uuid as UUID
from app.db.base import Base


class ArtistCategory(str, enum.Enum):
    CELEBRITY = "celebrity"
    VOICE_ARTIST = "voice_artist"
    RJ = "rj"
    SINGER = "singer"
    NARRATOR = "narrator"
    COMMUNITY_SPEAKER = "community_speaker"


class VerificationStatus(str, enum.Enum):
    PENDING = "pending"
    VERIFIED = "verified"
    REJECTED = "rejected"


class LicenseTier(str, enum.Enum):
    PERSONAL = "personal"
    COMMERCIAL = "commercial"
    BROADCAST = "broadcast"
    EXCLUSIVE = "exclusive"


class LicenseStatus(str, enum.Enum):
    PENDING = "pending"
    ACTIVE = "active"
    EXPIRED = "expired"
    REVOKED = "revoked"


class VoiceArtist(Base):
    __tablename__ = "voice_artists"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    display_name: Mapped[str] = mapped_column(String(255), nullable=False)
    slug: Mapped[str] = mapped_column(String(255), nullable=False, unique=True, index=True)
    bio: Mapped[str | None] = mapped_column(Text)
    tagline: Mapped[str | None] = mapped_column(String(255))

    category: Mapped[ArtistCategory] = mapped_column(String(50), nullable=False)
    languages: Mapped[list] = mapped_column(JSON, default=list)
    dialects: Mapped[list] = mapped_column(JSON, default=list)
    specialties: Mapped[list] = mapped_column(JSON, default=list)

    avatar_url: Mapped[str | None] = mapped_column(String(500))
    sample_audio_urls: Mapped[list] = mapped_column(JSON, default=list)
    voice_clone_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("voice_clones.id", ondelete="SET NULL"), nullable=True)

    verification_status: Mapped[VerificationStatus] = mapped_column(String(50), default=VerificationStatus.PENDING)
    consent_signed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    consent_document_url: Mapped[str | None] = mapped_column(String(500))
    id_verified: Mapped[bool] = mapped_column(Boolean, default=False)

    price_personal_inr: Mapped[int] = mapped_column(Integer, default=0)
    price_commercial_inr: Mapped[int] = mapped_column(Integer, default=0)
    price_broadcast_inr: Mapped[int] = mapped_column(Integer, default=0)
    price_exclusive_inr: Mapped[int] = mapped_column(Integer, default=0)

    platform_fee_pct: Mapped[int] = mapped_column(Integer, default=20)

    total_earnings_inr: Mapped[int] = mapped_column(Integer, default=0)
    total_licenses: Mapped[int] = mapped_column(Integer, default=0)
    avg_rating: Mapped[float] = mapped_column(Numeric(3, 2), default=0.0)
    rating_count: Mapped[int] = mapped_column(Integer, default=0)

    content_restrictions: Mapped[dict] = mapped_column(JSON, default=dict)

    is_featured: Mapped[bool] = mapped_column(Boolean, default=False)
    is_public: Mapped[bool] = mapped_column(Boolean, default=False)

    stripe_connect_id: Mapped[str | None] = mapped_column(String(255))
    upi_id: Mapped[str | None] = mapped_column(String(255))

    user_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), nullable=True, index=True)

    email: Mapped[str | None] = mapped_column(String(255))
    phone: Mapped[str | None] = mapped_column(String(50))

    data_collection_consent: Mapped[bool] = mapped_column(Boolean, default=False)
    data_consent_signed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    age_range: Mapped[str | None] = mapped_column(String(20))
    district: Mapped[str | None] = mapped_column(String(100))
    native_region: Mapped[str | None] = mapped_column(String(100))
    dialect_subtype: Mapped[str | None] = mapped_column(String(100))

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    licenses: Mapped[list["VoiceLicense"]] = relationship("VoiceLicense", back_populates="artist")


class VoiceLicense(Base):
    __tablename__ = "voice_licenses"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    voice_artist_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("voice_artists.id", ondelete="CASCADE"), index=True)
    licensee_tenant_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("tenants.id", ondelete="CASCADE"), index=True)

    tier: Mapped[LicenseTier] = mapped_column(String(50), nullable=False)
    status: Mapped[LicenseStatus] = mapped_column(String(50), default=LicenseStatus.PENDING)

    price_inr: Mapped[int] = mapped_column(Integer, nullable=False)
    platform_fee_inr: Mapped[int] = mapped_column(Integer, nullable=False)
    artist_earnings_inr: Mapped[int] = mapped_column(Integer, nullable=False)

    content_category: Mapped[str] = mapped_column(String(100), default="general")
    usage_description: Mapped[str | None] = mapped_column(Text)

    max_usage: Mapped[int | None] = mapped_column(Integer)
    usage_count: Mapped[int] = mapped_column(Integer, default=0)

    approved_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    expires_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    stripe_payment_intent_id: Mapped[str | None] = mapped_column(String(255))

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    artist: Mapped["VoiceArtist"] = relationship("VoiceArtist", back_populates="licenses")
