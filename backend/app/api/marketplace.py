import difflib
import uuid
from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, Depends, File, Form, HTTPException, Query, Request, UploadFile, status
from pydantic import BaseModel
from sqlalchemy import select, update, func, or_, cast, String
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.limiter import limiter
from app.core.stt import get_stt
from app.db.base import get_db
from app.middleware.auth import get_current_user
from app.models.data_contribution import DataContribution
from app.models.user import User, UserRole
from app.models.voice_artist import (
    VoiceArtist,
    VoiceLicense,
    ArtistCategory,
    LicenseTier,
    LicenseStatus,
    VerificationStatus,
)
from app.services.storage import upload_audio

router = APIRouter(prefix="/marketplace", tags=["marketplace"])

PLATFORM_FEE_PCT = 20


class ArtistResponse(BaseModel):
    id: str
    display_name: str
    slug: str
    bio: Optional[str]
    tagline: Optional[str]
    category: str
    languages: list[str]
    dialects: list[str]
    specialties: list[str]
    avatar_url: Optional[str]
    sample_audio_urls: list[str]
    verification_status: str
    price_personal_inr: int
    price_commercial_inr: int
    price_broadcast_inr: int
    price_exclusive_inr: int
    total_licenses: int
    avg_rating: float
    rating_count: int
    is_featured: bool
    content_restrictions: dict
    created_at: str


class RegisterArtistRequest(BaseModel):
    display_name: str
    slug: str
    bio: Optional[str] = None
    tagline: Optional[str] = None
    category: ArtistCategory
    languages: list[str]
    dialects: list[str] = []
    specialties: list[str] = []
    avatar_url: Optional[str] = None
    price_personal_inr: int = 0
    price_commercial_inr: int = 0
    price_broadcast_inr: int = 0
    price_exclusive_inr: int = 0
    content_restrictions: dict = {}
    email: Optional[str] = None
    phone: Optional[str] = None
    upi_id: Optional[str] = None
    data_collection_consent: bool = False
    age_range: Optional[str] = None
    district: Optional[str] = None
    native_region: Optional[str] = None
    dialect_subtype: Optional[str] = None


class UpdateArtistRequest(BaseModel):
    bio: Optional[str] = None
    tagline: Optional[str] = None
    avatar_url: Optional[str] = None
    specialties: Optional[list[str]] = None
    price_personal_inr: Optional[int] = None
    price_commercial_inr: Optional[int] = None
    price_broadcast_inr: Optional[int] = None
    price_exclusive_inr: Optional[int] = None
    content_restrictions: Optional[dict] = None
    upi_id: Optional[str] = None
    is_public: Optional[bool] = None


class LicenseRequest(BaseModel):
    tier: LicenseTier
    content_category: str = "general"
    usage_description: Optional[str] = None


class LicenseResponse(BaseModel):
    id: str
    voice_artist_id: str
    tier: str
    status: str
    price_inr: int
    platform_fee_inr: int
    artist_earnings_inr: int
    content_category: str
    usage_description: Optional[str]
    usage_count: int
    max_usage: Optional[int]
    approved_at: Optional[str]
    expires_at: Optional[str]
    created_at: str


class EarningsSummary(BaseModel):
    total_earnings_inr: int
    total_licenses: int
    avg_rating: float
    rating_count: int
    pending_earnings_inr: int
    active_licenses: int
    this_month_earnings_inr: int
    licenses: list[LicenseResponse]


@router.get("", response_model=list[ArtistResponse])
@limiter.limit("60/minute")
async def browse_marketplace(
    request: Request,
    category: Optional[str] = None,
    language: Optional[str] = None,
    dialect: Optional[str] = None,
    featured: Optional[bool] = None,
    q: Optional[str] = None,
    limit: int = Query(default=24, le=100),
    offset: int = 0,
    db: AsyncSession = Depends(get_db),
):
    stmt = select(VoiceArtist).where(
        VoiceArtist.is_public == True,
        VoiceArtist.verification_status == VerificationStatus.VERIFIED,
    )

    if category:
        stmt = stmt.where(VoiceArtist.category == category)
    if featured:
        stmt = stmt.where(VoiceArtist.is_featured == True)
    if q:
        stmt = stmt.where(
            or_(
                VoiceArtist.display_name.ilike(f"%{q}%"),
                VoiceArtist.bio.ilike(f"%{q}%"),
                VoiceArtist.tagline.ilike(f"%{q}%"),
            )
        )

    if language:
        stmt = stmt.where(VoiceArtist.languages.cast(JSONB).contains(cast([language], JSONB)))
    if dialect:
        stmt = stmt.where(VoiceArtist.dialects.cast(JSONB).contains(cast([dialect], JSONB)))

    stmt = stmt.order_by(VoiceArtist.is_featured.desc(), VoiceArtist.total_licenses.desc())
    stmt = stmt.offset(offset).limit(limit)

    result = await db.execute(stmt)
    return [_to_artist_response(a) for a in result.scalars().all()]


@router.get("/featured", response_model=list[ArtistResponse])
@limiter.limit("60/minute")
async def get_featured_artists(request: Request, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(VoiceArtist)
        .where(
            VoiceArtist.is_featured == True,
            VoiceArtist.is_public == True,
            VoiceArtist.verification_status == VerificationStatus.VERIFIED,
        )
        .order_by(VoiceArtist.avg_rating.desc())
        .limit(8)
    )
    return [_to_artist_response(a) for a in result.scalars().all()]


@router.get("/artist/{slug}", response_model=ArtistResponse)
@limiter.limit("60/minute")
async def get_artist_by_slug(request: Request, slug: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(VoiceArtist).where(
            VoiceArtist.slug == slug,
            VoiceArtist.is_public == True,
        )
    )
    artist = result.scalar_one_or_none()
    if not artist:
        raise HTTPException(status_code=404, detail="Artist not found")
    return _to_artist_response(artist)


@router.post("/register", response_model=ArtistResponse, status_code=status.HTTP_201_CREATED)
async def register_as_artist(
    body: RegisterArtistRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    existing = await db.execute(select(VoiceArtist).where(VoiceArtist.slug == body.slug))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=409, detail="Slug already taken")

    now = datetime.now(timezone.utc)
    artist = VoiceArtist(
        display_name=body.display_name,
        slug=body.slug,
        bio=body.bio,
        tagline=body.tagline,
        category=body.category,
        languages=body.languages,
        dialects=body.dialects,
        specialties=body.specialties,
        avatar_url=body.avatar_url,
        price_personal_inr=body.price_personal_inr,
        price_commercial_inr=body.price_commercial_inr,
        price_broadcast_inr=body.price_broadcast_inr,
        price_exclusive_inr=body.price_exclusive_inr,
        content_restrictions=body.content_restrictions,
        user_id=current_user.id,
        email=body.email or current_user.email,
        phone=body.phone,
        upi_id=body.upi_id,
        platform_fee_pct=PLATFORM_FEE_PCT,
        verification_status=VerificationStatus.PENDING,
        is_public=False,
        data_collection_consent=body.data_collection_consent,
        data_consent_signed_at=now if body.data_collection_consent else None,
        age_range=body.age_range,
        district=body.district,
        native_region=body.native_region,
        dialect_subtype=body.dialect_subtype,
    )
    db.add(artist)
    await db.commit()
    await db.refresh(artist)
    return _to_artist_response(artist)


@router.patch("/my-profile", response_model=ArtistResponse)
async def update_my_artist_profile(
    body: UpdateArtistRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    artist = await _get_artist_for_user(current_user, db)

    updates = {k: v for k, v in body.model_dump(exclude_none=True).items()}
    if updates:
        await db.execute(update(VoiceArtist).where(VoiceArtist.id == artist.id).values(**updates))
        await db.commit()
        await db.refresh(artist)
    return _to_artist_response(artist)


@router.get("/my-profile", response_model=ArtistResponse)
async def get_my_artist_profile(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    artist = await _get_artist_for_user(current_user, db)
    return _to_artist_response(artist)


@router.get("/my-earnings", response_model=EarningsSummary)
async def get_my_earnings(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    artist = await _get_artist_for_user(current_user, db)

    licenses_result = await db.execute(
        select(VoiceLicense)
        .where(VoiceLicense.voice_artist_id == artist.id)
        .order_by(VoiceLicense.created_at.desc())
        .limit(50)
    )
    licenses = licenses_result.scalars().all()

    now = datetime.now(timezone.utc)
    month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)

    pending_earnings = sum(
        l.artist_earnings_inr for l in licenses if l.status == LicenseStatus.PENDING
    )
    active_count = sum(1 for l in licenses if l.status == LicenseStatus.ACTIVE)
    month_earnings = sum(
        l.artist_earnings_inr
        for l in licenses
        if l.status == LicenseStatus.ACTIVE and l.created_at >= month_start
    )

    return EarningsSummary(
        total_earnings_inr=artist.total_earnings_inr,
        total_licenses=artist.total_licenses,
        avg_rating=float(artist.avg_rating or 0),
        rating_count=artist.rating_count,
        pending_earnings_inr=pending_earnings,
        active_licenses=active_count,
        this_month_earnings_inr=month_earnings,
        licenses=[_to_license_response(l) for l in licenses],
    )


@router.post("/license/{artist_id}", response_model=LicenseResponse, status_code=status.HTTP_201_CREATED)
async def request_license(
    artist_id: uuid.UUID,
    body: LicenseRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(VoiceArtist).where(
            VoiceArtist.id == artist_id,
            VoiceArtist.is_public == True,
            VoiceArtist.verification_status == VerificationStatus.VERIFIED,
        )
    )
    artist = result.scalar_one_or_none()
    if not artist:
        raise HTTPException(status_code=404, detail="Artist not found")

    existing_license = await db.execute(
        select(VoiceLicense).where(
            VoiceLicense.voice_artist_id == artist_id,
            VoiceLicense.licensee_tenant_id == current_user.tenant_id,
            VoiceLicense.tier == body.tier,
            VoiceLicense.status.in_([LicenseStatus.ACTIVE, LicenseStatus.PENDING]),
        )
    )
    if existing_license.scalar_one_or_none():
        raise HTTPException(status_code=409, detail="An active or pending license already exists for this tier")

    price = _tier_price(artist, body.tier)
    if price == 0 and body.tier != LicenseTier.PERSONAL:
        raise HTTPException(status_code=400, detail="This license tier is not available for this artist")

    platform_fee = price * artist.platform_fee_pct // 100
    artist_earnings = price - platform_fee

    license = VoiceLicense(
        voice_artist_id=artist.id,
        licensee_tenant_id=current_user.tenant_id,
        tier=body.tier,
        status=LicenseStatus.PENDING if price > 0 else LicenseStatus.ACTIVE,
        price_inr=price,
        platform_fee_inr=platform_fee,
        artist_earnings_inr=artist_earnings,
        content_category=body.content_category,
        usage_description=body.usage_description,
        approved_at=datetime.now(timezone.utc) if price == 0 else None,
    )
    db.add(license)
    await db.commit()
    await db.refresh(license)
    return _to_license_response(license)


@router.get("/my-licenses", response_model=list[LicenseResponse])
async def get_my_licenses(
    limit: int = Query(default=50, le=100),
    offset: int = 0,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(VoiceLicense)
        .where(VoiceLicense.licensee_tenant_id == current_user.tenant_id)
        .order_by(VoiceLicense.created_at.desc())
        .offset(offset)
        .limit(limit)
    )
    return [_to_license_response(l) for l in result.scalars().all()]


@router.patch("/license/{license_id}/approve", response_model=LicenseResponse)
async def approve_license(
    license_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    artist = await _get_artist_for_user(current_user, db)

    result = await db.execute(
        select(VoiceLicense).where(
            VoiceLicense.id == license_id,
            VoiceLicense.voice_artist_id == artist.id,
        )
    )
    license = result.scalar_one_or_none()
    if not license:
        raise HTTPException(status_code=404, detail="License not found")
    if license.status != LicenseStatus.PENDING:
        raise HTTPException(status_code=400, detail="License is not pending")

    now = datetime.now(timezone.utc)
    await db.execute(
        update(VoiceLicense)
        .where(VoiceLicense.id == license_id)
        .values(status=LicenseStatus.ACTIVE, approved_at=now)
    )
    await db.execute(
        update(VoiceArtist)
        .where(VoiceArtist.id == artist.id)
        .values(
            total_earnings_inr=VoiceArtist.total_earnings_inr + license.artist_earnings_inr,
            total_licenses=VoiceArtist.total_licenses + 1,
        )
    )
    await db.commit()
    await db.refresh(license)
    return _to_license_response(license)


@router.patch("/license/{license_id}/revoke", response_model=LicenseResponse)
async def revoke_license(
    license_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    artist = await _get_artist_for_user(current_user, db)

    result = await db.execute(
        select(VoiceLicense).where(
            VoiceLicense.id == license_id,
            VoiceLicense.voice_artist_id == artist.id,
        )
    )
    license = result.scalar_one_or_none()
    if not license:
        raise HTTPException(status_code=404, detail="License not found")
    if license.status == LicenseStatus.REVOKED:
        raise HTTPException(status_code=400, detail="License is already revoked")

    was_active = license.status == LicenseStatus.ACTIVE
    await db.execute(
        update(VoiceLicense).where(VoiceLicense.id == license_id).values(status=LicenseStatus.REVOKED)
    )
    if was_active:
        await db.execute(
            update(VoiceArtist)
            .where(VoiceArtist.id == artist.id)
            .values(
                total_earnings_inr=VoiceArtist.total_earnings_inr - license.artist_earnings_inr,
                total_licenses=VoiceArtist.total_licenses - 1,
            )
        )
    await db.commit()
    await db.refresh(license)
    return _to_license_response(license)


_CONTRIBUTE_PROMPTS: dict[str, list[dict]] = {
    "hi": [
        {"id": "hi-001", "text": "मेरा नाम रामू है और मैं दिल्ली में रहता हूं।"},
        {"id": "hi-002", "text": "आज मौसम बहुत अच्छा है, धूप खिली हुई है।"},
        {"id": "hi-003", "text": "हमारे देश में कई भाषाएं बोली जाती हैं।"},
        {"id": "hi-004", "text": "बाज़ार में सब्ज़ियों के दाम बहुत बढ़ गए हैं।"},
        {"id": "hi-005", "text": "मुझे अपने परिवार के साथ समय बिताना बहुत पसंद है।"},
        {"id": "hi-006", "text": "डॉक्टर ने कहा कि रोज़ व्यायाम करना ज़रूरी है।"},
        {"id": "hi-007", "text": "बच्चे स्कूल से घर लौट आए हैं।"},
        {"id": "hi-008", "text": "खेत में किसान फसल काट रहे हैं।"},
        {"id": "hi-009", "text": "नदी के किनारे बहुत सारे पेड़ लगे हैं।"},
        {"id": "hi-010", "text": "रेलगाड़ी समय पर स्टेशन पहुंच गई।"},
    ],
    "ta": [
        {"id": "ta-001", "text": "என் பெயர் முருகன், நான் சென்னையில் வசிக்கிறேன்."},
        {"id": "ta-002", "text": "இன்று வானிலை மிகவும் நல்லாக இருக்கிறது."},
        {"id": "ta-003", "text": "நம் நாட்டில் பல மொழிகள் பேசப்படுகின்றன."},
        {"id": "ta-004", "text": "சந்தையில் காய்கறிகளின் விலை அதிகரித்துள்ளது."},
        {"id": "ta-005", "text": "குழந்தைகள் பள்ளியிலிருந்து திரும்பி வந்துள்ளனர்."},
    ],
    "te": [
        {"id": "te-001", "text": "నా పేరు రామారావు, నేను హైదరాబాద్‌లో నివసిస్తున్నాను."},
        {"id": "te-002", "text": "ఈరోజు వాతావరణం చాలా బాగుంది."},
        {"id": "te-003", "text": "మన దేశంలో అనేక భాషలు మాట్లాడతారు."},
        {"id": "te-004", "text": "పిల్లలు పాఠశాల నుండి తిరిగి వచ్చారు."},
        {"id": "te-005", "text": "రైతులు పొలంలో పని చేస్తున్నారు."},
    ],
    "bn": [
        {"id": "bn-001", "text": "আমার নাম রাহুল, আমি কলকাতায় থাকি।"},
        {"id": "bn-002", "text": "আজ আবহাওয়া খুব সুন্দর।"},
        {"id": "bn-003", "text": "আমাদের দেশে অনেক ভাষা বলা হয়।"},
        {"id": "bn-004", "text": "বাজারে সবজির দাম অনেক বেড়ে গেছে।"},
        {"id": "bn-005", "text": "শিশুরা স্কুল থেকে বাড়ি ফিরে এসেছে।"},
    ],
    "gu": [
        {"id": "gu-001", "text": "મારું નામ ધ્રુવ છે અને હું અમદાવાદમાં રહું છું."},
        {"id": "gu-002", "text": "આજે હવામાન ખૂબ સારું છે."},
        {"id": "gu-003", "text": "આપણા દેશમાં ઘણી ભાષાઓ બોલવામાં આવે છે."},
        {"id": "gu-004", "text": "બજારમાં શાકભાજીના ભાવ વધી ગયા છે."},
        {"id": "gu-005", "text": "બાળકો શાળામાંથી ઘરે આવ્યા છે."},
    ],
    "mr": [
        {"id": "mr-001", "text": "माझे नाव राहुल आहे आणि मी पुण्यात राहतो."},
        {"id": "mr-002", "text": "आज हवामान खूप छान आहे."},
        {"id": "mr-003", "text": "आपल्या देशात अनेक भाषा बोलल्या जातात."},
        {"id": "mr-004", "text": "बाजारात भाज्यांचे भाव खूप वाढले आहेत."},
        {"id": "mr-005", "text": "मुले शाळेतून घरी आली आहेत."},
    ],
    "kn": [
        {"id": "kn-001", "text": "ನನ್ನ ಹೆಸರು ರಾಜು, ನಾನು ಬೆಂಗಳೂರಿನಲ್ಲಿ ವಾಸಿಸುತ್ತೇನೆ."},
        {"id": "kn-002", "text": "ಇಂದು ಹವಾಮಾನ ತುಂಬಾ ಚೆನ್ನಾಗಿದೆ."},
        {"id": "kn-003", "text": "ನಮ್ಮ ದೇಶದಲ್ಲಿ ಅನೇಕ ಭಾಷೆಗಳನ್ನು ಮಾತನಾಡಲಾಗುತ್ತದೆ."},
        {"id": "kn-004", "text": "ಮಕ್ಕಳು ಶಾಲೆಯಿಂದ ಮನೆಗೆ ಬಂದಿದ್ದಾರೆ."},
        {"id": "kn-005", "text": "ರೈತರು ಹೊಲದಲ್ಲಿ ಕೆಲಸ ಮಾಡುತ್ತಿದ್ದಾರೆ."},
    ],
    "ml": [
        {"id": "ml-001", "text": "എന്റെ പേര് രാജൻ, ഞാൻ തിരുവനന്തപുരത്ത് താമസിക്കുന്നു."},
        {"id": "ml-002", "text": "ഇന്ന് കാലാവസ്ഥ വളരെ നല്ലതാണ്."},
        {"id": "ml-003", "text": "നമ്മുടെ രാജ്യത്ത് പലഭാഷകളും സംസാരിക്കപ്പെടുന്നു."},
        {"id": "ml-004", "text": "കുട്ടികൾ സ്കൂളിൽ നിന്ന് വീട്ടിലേക്ക് വന്നിട്ടുണ്ട്."},
        {"id": "ml-005", "text": "കർഷകർ പാടത്ത് ജോലി ചെയ്യുന്നു."},
    ],
    "pa": [
        {"id": "pa-001", "text": "ਮੇਰਾ ਨਾਮ ਗੁਰਪ੍ਰੀਤ ਹੈ ਅਤੇ ਮੈਂ ਅੰਮ੍ਰਿਤਸਰ ਵਿੱਚ ਰਹਿੰਦਾ ਹਾਂ।"},
        {"id": "pa-002", "text": "ਅੱਜ ਮੌਸਮ ਬਹੁਤ ਵਧੀਆ ਹੈ।"},
        {"id": "pa-003", "text": "ਸਾਡੇ ਦੇਸ਼ ਵਿੱਚ ਬਹੁਤ ਸਾਰੀਆਂ ਭਾਸ਼ਾਵਾਂ ਬੋਲੀਆਂ ਜਾਂਦੀਆਂ ਹਨ।"},
        {"id": "pa-004", "text": "ਬੱਚੇ ਸਕੂਲ ਤੋਂ ਘਰ ਆ ਗਏ ਹਨ।"},
        {"id": "pa-005", "text": "ਕਿਸਾਨ ਖੇਤਾਂ ਵਿੱਚ ਕੰਮ ਕਰ ਰਹੇ ਹਨ।"},
    ],
    "or": [
        {"id": "or-001", "text": "ମୋ ନାମ ମୋହନ ଏବଂ ମୁଁ ଭୁବନେଶ୍ୱରରେ ରୁହେ।"},
        {"id": "or-002", "text": "ଆଜି ପାଣିପାଗ ବହୁତ ଭଲ ଅଛି।"},
        {"id": "or-003", "text": "ଆମ ଦେଶରେ ଅନେକ ଭାଷା କୁହାଯାଏ।"},
        {"id": "or-004", "text": "ପିଲାମାନେ ବିଦ୍ୟାଳୟରୁ ଘରକୁ ଫେରି ଆସିଛନ୍ତି।"},
        {"id": "or-005", "text": "କୃଷକମାନେ ଜମିରେ କାମ କରୁଛନ୍ତି।"},
    ],
}

CER_ACCEPT_THRESHOLD = 0.35


def _compute_cer(expected: str, actual: str) -> float:
    if not expected:
        return 1.0
    ratio = difflib.SequenceMatcher(None, expected.strip(), actual.strip()).ratio()
    return round(1.0 - ratio, 4)


@router.get("/contribute/prompts")
@limiter.limit("30/minute")
async def get_contribute_prompts(
    request: Request,
    language: str = Query(..., description="Language code, e.g. hi, ta"),
    limit: int = Query(default=5, le=10),
    current_user: User = Depends(get_current_user),
):
    if language not in _CONTRIBUTE_PROMPTS:
        raise HTTPException(status_code=400, detail=f"No prompts available for language '{language}'. Supported: {list(_CONTRIBUTE_PROMPTS.keys())}")
    prompts = _CONTRIBUTE_PROMPTS[language][:limit]
    return {"language": language, "prompts": prompts, "total": len(prompts)}


@router.post("/contribute/submit", status_code=status.HTTP_201_CREATED)
@limiter.limit("20/minute")
async def submit_contribute_recording(
    request: Request,
    audio: UploadFile = File(...),
    prompt_id: str = Form(...),
    prompt_text: str = Form(...),
    language: str = Form(...),
    dialect: Optional[str] = Form(None),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    artist = await _get_artist_for_user(current_user, db)

    if not artist.data_collection_consent:
        raise HTTPException(status_code=403, detail="You must enable data collection consent in your profile before contributing recordings.")

    audio_bytes = await audio.read()
    if len(audio_bytes) > 25 * 1024 * 1024:
        raise HTTPException(status_code=413, detail="Audio exceeds 25 MB limit")

    stt = get_stt()
    try:
        result = await stt.transcribe(audio_bytes, language=language if language in settings.SUPPORTED_LANGUAGES else None)
        transcript = result.text
        duration = result.duration_seconds
    except Exception:
        transcript = None
        duration = None

    cer = _compute_cer(prompt_text, transcript or "") if transcript else 1.0
    is_accepted = cer <= CER_ACCEPT_THRESHOLD

    s3_key = f"contributions/{artist.id}/{language}/{prompt_id}/{uuid.uuid4()}.wav"
    try:
        audio_url = await upload_audio(audio_bytes, s3_key, current_user.tenant_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to store recording: {e}")

    contribution = DataContribution(
        voice_artist_id=artist.id,
        prompt_id=prompt_id,
        prompt_text=prompt_text,
        language=language,
        dialect=dialect or artist.dialect_subtype,
        audio_url=audio_url,
        transcript=transcript,
        cer_score=cer,
        is_accepted=is_accepted,
        speaker_age_range=artist.age_range,
        speaker_district=artist.district,
        speaker_native_region=artist.native_region,
        speaker_dialect_subtype=artist.dialect_subtype,
        duration_seconds=duration,
    )
    db.add(contribution)
    await db.commit()
    await db.refresh(contribution)

    return {
        "id": str(contribution.id),
        "prompt_id": prompt_id,
        "is_accepted": is_accepted,
        "cer_score": float(cer),
        "transcript": transcript,
        "message": "Recording accepted — thank you!" if is_accepted else f"Recording quality low (error rate {cer:.0%}). Please re-record clearly.",
    }


@router.get("/contribute/my-stats")
async def get_contribute_stats(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    artist = await _get_artist_for_user(current_user, db)

    result = await db.execute(
        select(
            func.count(DataContribution.id).label("total"),
            func.sum(func.cast(DataContribution.is_accepted, String)).label("accepted"),
        ).where(DataContribution.voice_artist_id == artist.id)
    )
    row = result.one()
    total = row.total or 0
    accepted = int(row.accepted or 0)

    by_lang = await db.execute(
        select(DataContribution.language, func.count(DataContribution.id).label("count"))
        .where(DataContribution.voice_artist_id == artist.id, DataContribution.is_accepted == True)
        .group_by(DataContribution.language)
    )

    return {
        "total_submissions": total,
        "accepted_recordings": accepted,
        "rejection_rate": round(1 - accepted / total, 3) if total else 0,
        "by_language": [{"language": r.language, "count": r.count} for r in by_lang.all()],
    }


async def _get_artist_for_user(user: User, db: AsyncSession) -> VoiceArtist:
    result = await db.execute(
        select(VoiceArtist).where(VoiceArtist.user_id == user.id)
    )
    artist = result.scalar_one_or_none()
    if not artist:
        raise HTTPException(status_code=404, detail="Artist profile not found. Register first.")
    return artist


def _tier_price(artist: VoiceArtist, tier: LicenseTier) -> int:
    return {
        LicenseTier.PERSONAL: artist.price_personal_inr,
        LicenseTier.COMMERCIAL: artist.price_commercial_inr,
        LicenseTier.BROADCAST: artist.price_broadcast_inr,
        LicenseTier.EXCLUSIVE: artist.price_exclusive_inr,
    }[tier]


def _to_artist_response(a: VoiceArtist) -> ArtistResponse:
    return ArtistResponse(
        id=str(a.id),
        display_name=a.display_name,
        slug=a.slug,
        bio=a.bio,
        tagline=a.tagline,
        category=a.category,
        languages=a.languages or [],
        dialects=a.dialects or [],
        specialties=a.specialties or [],
        avatar_url=a.avatar_url,
        sample_audio_urls=a.sample_audio_urls or [],
        verification_status=a.verification_status,
        price_personal_inr=a.price_personal_inr,
        price_commercial_inr=a.price_commercial_inr,
        price_broadcast_inr=a.price_broadcast_inr,
        price_exclusive_inr=a.price_exclusive_inr,
        total_licenses=a.total_licenses,
        avg_rating=float(a.avg_rating or 0),
        rating_count=a.rating_count,
        is_featured=a.is_featured,
        content_restrictions=a.content_restrictions or {},
        created_at=a.created_at.isoformat(),
    )


def _to_license_response(l: VoiceLicense) -> LicenseResponse:
    return LicenseResponse(
        id=str(l.id),
        voice_artist_id=str(l.voice_artist_id),
        tier=l.tier,
        status=l.status,
        price_inr=l.price_inr,
        platform_fee_inr=l.platform_fee_inr,
        artist_earnings_inr=l.artist_earnings_inr,
        content_category=l.content_category,
        usage_description=l.usage_description,
        usage_count=l.usage_count,
        max_usage=l.max_usage,
        approved_at=l.approved_at.isoformat() if l.approved_at else None,
        expires_at=l.expires_at.isoformat() if l.expires_at else None,
        created_at=l.created_at.isoformat(),
    )
