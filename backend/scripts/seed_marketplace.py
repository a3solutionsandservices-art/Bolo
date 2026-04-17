"""
Seed the Voice Marketplace with demo artist profiles and TTS-generated sample audio.

Usage (inside Docker):
    docker compose exec backend python scripts/seed_marketplace.py

Usage (local, from backend/ directory with venv active):
    python scripts/seed_marketplace.py

What it does:
- Creates 8 demo voice artist profiles covering different Indian languages and categories
- Generates a 15-second sample audio clip for each artist using Sarvam TTS
  (100% license-free — synthesized by Bolo itself)
- Saves audio to /app/media/marketplace/samples/
- Skips audio generation if SARVAM_API_KEY is not configured (artists are still created)
- Safe to re-run: skips artists whose slug already exists
"""

import asyncio
import base64
import json
import logging
import sys
import uuid
from pathlib import Path

import httpx

logging.basicConfig(level=logging.INFO, format="%(levelname)s %(message)s")
log = logging.getLogger(__name__)

MEDIA_DIR = Path("/app/media/marketplace/samples")

DEMO_ARTISTS = [
    {
        "display_name": "Priya Sharma",
        "slug": "priya-sharma-demo",
        "tagline": "The voice of Bollywood's next generation",
        "bio": "Priya has narrated over 200 audiobooks and dubbed for leading Bollywood productions. Her warm, expressive Hindi brings characters to life.",
        "category": "celebrity",
        "languages": ["Hindi", "English"],
        "dialects": ["Awadhi", "Brij"],
        "specialties": ["Dubbing", "Narration", "Audiobooks", "Advertising"],
        "price_personal_inr": 5000,
        "price_commercial_inr": 25000,
        "price_broadcast_inr": 75000,
        "price_exclusive_inr": 300000,
        "tts_lang": "hi",
        "tts_speaker": "meera",
        "sample_text": "नमस्ते! मेरा नाम प्रिया शर्मा है। मैं हिंदी में आपकी ब्रांड की आवाज़ बनना चाहती हूं। मेरी आवाज़ आपके ग्राहकों के दिलों को छू जाएगी।",
    },
    {
        "display_name": "Kalyani Menon",
        "slug": "kalyani-menon-demo",
        "tagline": "South India's most-recognised radio voice",
        "bio": "15 years on Kerala's top FM station. Kalyani's velvety Malayalam voice has become synonymous with trust and warmth across South India.",
        "category": "rj",
        "languages": ["Malayalam", "Tamil", "English"],
        "dialects": ["Thrissur", "Kozhikode"],
        "specialties": ["Podcast Hosting", "Advertising", "IVR", "Character Voices"],
        "price_personal_inr": 3000,
        "price_commercial_inr": 15000,
        "price_broadcast_inr": 50000,
        "price_exclusive_inr": 200000,
        "tts_lang": "ml",
        "tts_speaker": "anushka",
        "sample_text": "ഹലോ! ഞാൻ കല്യാണി മേനോൻ. കേരളത്തിലെ ഏറ്റവും പ്രശസ്തമായ റേഡിയോ ശബ്ദം. എന്റെ ശബ്ദം നിങ്ങളുടെ ബ്രാൻഡിനെ ഓരോ മലയാളിയുടെ ഹൃദയത്തിലും എത്തിക്കും.",
    },
    {
        "display_name": "Ravi Narayan",
        "slug": "ravi-narayan-demo",
        "tagline": "Tamil Nadu's documentary narration specialist",
        "bio": "Ravi has lent his authoritative baritone to over 50 Tamil documentaries and is the official narrator for three national broadcasters.",
        "category": "narrator",
        "languages": ["Tamil", "English"],
        "dialects": ["Chennai Tamil", "Madurai Tamil"],
        "specialties": ["Narration", "News Reading", "Audiobooks", "Dubbing"],
        "price_personal_inr": 4000,
        "price_commercial_inr": 20000,
        "price_broadcast_inr": 60000,
        "price_exclusive_inr": 250000,
        "tts_lang": "ta",
        "tts_speaker": "anushka",
        "sample_text": "வணக்கம்! என் பெயர் ரவி நாராயணன். தமிழ் நாட்டின் முன்னணி தொகுப்பாளர். என் குரல் உங்கள் வியாபாரத்திற்கு ஒரு தனி அடையாளம் தரும்.",
    },
    {
        "display_name": "Dhruv Patel",
        "slug": "dhruv-patel-demo",
        "tagline": "Gujarat's go-to voice for business and brand",
        "bio": "Dhruv is Ahmedabad's most in-demand commercial voice. His clear, energetic Gujarati has powered campaigns for FMCG and BFSI leaders.",
        "category": "voice_artist",
        "languages": ["Gujarati", "Hindi", "English"],
        "dialects": ["Saurashtra", "Surti"],
        "specialties": ["Advertising", "IVR", "AI Training", "Character Voices"],
        "price_personal_inr": 2500,
        "price_commercial_inr": 12000,
        "price_broadcast_inr": 40000,
        "price_exclusive_inr": 150000,
        "tts_lang": "gu",
        "tts_speaker": "meera",
        "sample_text": "નમસ્તે! હું ધ્રુવ પટેલ છું. ગુજરાતની સૌથી ભરોસાપાત્ર વ્યાવસાયિક આવાજ. મારી આવાજ આપના ગ્રાહકો સુધી પહોંચશે.",
    },
    {
        "display_name": "Ananya Krishnan",
        "slug": "ananya-krishnan-demo",
        "tagline": "Kannada's leading female voice artist",
        "bio": "Ananya's expressive Kannada has been featured in over 100 TV commercials and she is the preferred voice for Bengaluru's top tech brands.",
        "category": "voice_artist",
        "languages": ["Kannada", "Tamil", "English"],
        "dialects": ["Bengaluru Kannada", "Mysuru Kannada"],
        "specialties": ["Advertising", "Dubbing", "Character Voices", "Narration"],
        "price_personal_inr": 3500,
        "price_commercial_inr": 18000,
        "price_broadcast_inr": 55000,
        "price_exclusive_inr": 200000,
        "tts_lang": "kn",
        "tts_speaker": "anushka",
        "sample_text": "ನಮಸ್ಕಾರ! ನಾನು ಅನನ್ಯ ಕೃಷ್ಣನ್. ಕನ್ನಡದ ಅತ್ಯಂತ ಜನಪ್ರಿಯ ಮಹಿಳಾ ಧ್ವನಿ ಕಲಾವಿದೆ. ನಿಮ್ಮ ಬ್ರ್ಯಾಂಡ್‌ಗೆ ಒಂದು ಅಪೂರ್ವ ಧ್ವನಿ ನೀಡಲು ನಾನು ಸಿದ್ಧ.",
    },
    {
        "display_name": "Balaji Reddy",
        "slug": "balaji-reddy-demo",
        "tagline": "Telugu cinema's most versatile dubbing artist",
        "bio": "Balaji has dubbed for A-list Telugu films and is the official voice of three Fortune 500 companies in the Telugu market.",
        "category": "voice_artist",
        "languages": ["Telugu", "Hindi", "English"],
        "dialects": ["Hyderabadi Telugu", "Coastal Andhra"],
        "specialties": ["Dubbing", "Advertising", "Narration", "IVR"],
        "price_personal_inr": 4500,
        "price_commercial_inr": 22000,
        "price_broadcast_inr": 65000,
        "price_exclusive_inr": 250000,
        "tts_lang": "te",
        "tts_speaker": "anushka",
        "sample_text": "నమస్కారం! నేను బాలాజీ రెడ్డి. తెలుగు సినిమా మరియు వ్యాపార ప్రపంచంలో నా గళం అందరికీ పరిచయం. మీ బ్రాండ్‌కి నా గళాన్ని అందిస్తాను.",
    },
    {
        "display_name": "Gurpreet Singh",
        "slug": "gurpreet-singh-demo",
        "tagline": "Punjab's #1 radio and brand voice",
        "bio": "Gurpreet hosts Punjab's highest-rated morning show and his energetic Punjabi has become the benchmark for brand communication in North India.",
        "category": "rj",
        "languages": ["Punjabi", "Hindi", "English"],
        "dialects": ["Majhi", "Malwai"],
        "specialties": ["Podcast Hosting", "Advertising", "IVR", "AI Training"],
        "price_personal_inr": 3000,
        "price_commercial_inr": 15000,
        "price_broadcast_inr": 45000,
        "price_exclusive_inr": 180000,
        "tts_lang": "pa",
        "tts_speaker": "meera",
        "sample_text": "ਸਤਿ ਸ੍ਰੀ ਅਕਾਲ! ਮੇਰਾ ਨਾਂ ਗੁਰਪ੍ਰੀਤ ਸਿੰਘ ਹੈ। ਪੰਜਾਬ ਦੀ ਸਭ ਤੋਂ ਮਸ਼ਹੂਰ ਆਵਾਜ਼। ਮੇਰੀ ਆਵਾਜ਼ ਤੁਹਾਡੇ ਬ੍ਰਾਂਡ ਨੂੰ ਹਰ ਪੰਜਾਬੀ ਦੇ ਦਿਲ ਤੱਕ ਪਹੁੰਚਾਵੇਗੀ।",
    },
    {
        "display_name": "Meena Dash",
        "slug": "meena-dash-demo",
        "tagline": "Odisha's pioneer in Odia voice content",
        "bio": "Meena is the first Odia voice artist to create an AI voice clone for commercial licensing. Her clear, expressive Odia reaches every corner of the state.",
        "category": "community_speaker",
        "languages": ["Odia", "Hindi", "English"],
        "dialects": ["Sambalpuri", "Baleswari"],
        "specialties": ["Narration", "AI Training", "IVR", "Advertising"],
        "price_personal_inr": 2000,
        "price_commercial_inr": 10000,
        "price_broadcast_inr": 35000,
        "price_exclusive_inr": 120000,
        "tts_lang": "or",
        "tts_speaker": "meera",
        "sample_text": "ନମସ୍କାର! ମୋ ନାଁ ମୀନା ଦାଶ। ଓଡ଼ିଶାର ଆଗ୍ରଣୀ ମହିଳା ଭଏସ ଆର୍ଟିଷ୍ଟ। ମୋ ଭଏସ ଆପଣଙ୍କ ବ୍ରାଣ୍ଡକୁ ପ୍ରତ୍ୟେକ ଓଡ଼ିଆ ଘରକୁ ପହଞ୍ଚାଇବ।",
    },
]


async def generate_tts_sample(
    client: httpx.AsyncClient,
    text: str,
    lang_code: str,
    speaker: str,
    api_key: str,
    out_path: Path,
) -> bool:
    sarvam_lang_map = {
        "hi": "hi-IN", "ta": "ta-IN", "te": "te-IN", "bn": "bn-IN",
        "gu": "gu-IN", "mr": "mr-IN", "kn": "kn-IN", "ml": "ml-IN",
        "pa": "pa-IN", "or": "or-IN", "en": "en-IN",
    }
    sarvam_lang = sarvam_lang_map.get(lang_code, "hi-IN")
    try:
        resp = await client.post(
            "https://api.sarvam.ai/text-to-speech",
            headers={"api-subscription-key": api_key, "Content-Type": "application/json"},
            json={
                "inputs": [text],
                "target_language_code": sarvam_lang,
                "speaker": speaker,
                "pitch": 0,
                "pace": 1.0,
                "loudness": 1.2,
                "speech_sample_rate": 22050,
                "enable_preprocessing": True,
                "model": "bulbul:v2",
            },
            timeout=30.0,
        )
        resp.raise_for_status()
        audio_b64 = resp.json()["audios"][0]
        out_path.write_bytes(base64.b64decode(audio_b64))
        return True
    except Exception as e:
        log.warning("TTS generation failed for %s: %s", lang_code, e)
        return False


async def seed() -> None:
    import os
    sys.path.insert(0, str(Path(__file__).parent.parent))

    from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
    from sqlalchemy.orm import sessionmaker
    from sqlalchemy import select

    db_url = os.getenv("DATABASE_URL", "postgresql+asyncpg://bolo:bolo@localhost:5432/bolo")
    sarvam_api_key = os.getenv("SARVAM_API_KEY", "")

    engine = create_async_engine(db_url, echo=False)
    SessionLocal = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    from app.models.voice_artist import VoiceArtist, ArtistCategory, VerificationStatus

    MEDIA_DIR.mkdir(parents=True, exist_ok=True)
    log.info("Media dir: %s", MEDIA_DIR)

    tts_enabled = bool(sarvam_api_key)
    if not tts_enabled:
        log.warning("SARVAM_API_KEY not set — artist profiles will be created without audio samples")

    async with httpx.AsyncClient() as http_client:
        async with SessionLocal() as db:
            created = 0
            skipped = 0

            for artist_data in DEMO_ARTISTS:
                existing = await db.execute(
                    select(VoiceArtist).where(VoiceArtist.slug == artist_data["slug"])
                )
                if existing.scalar_one_or_none():
                    log.info("SKIP  %s (already exists)", artist_data["slug"])
                    skipped += 1
                    continue

                sample_audio_urls: list[str] = []

                if tts_enabled:
                    audio_filename = f"{artist_data['slug']}.wav"
                    audio_path = MEDIA_DIR / audio_filename
                    log.info("GEN   %s — generating TTS sample (%s)...", artist_data["slug"], artist_data["tts_lang"])
                    ok = await generate_tts_sample(
                        http_client,
                        artist_data["sample_text"],
                        artist_data["tts_lang"],
                        artist_data["tts_speaker"],
                        sarvam_api_key,
                        audio_path,
                    )
                    if ok:
                        sample_audio_urls = [f"/media/marketplace/samples/{audio_filename}"]
                        log.info("      saved %s (%.1f KB)", audio_filename, audio_path.stat().st_size / 1024)
                    else:
                        log.warning("      audio generation failed, continuing without sample")

                artist = VoiceArtist(
                    id=uuid.uuid4(),
                    display_name=artist_data["display_name"],
                    slug=artist_data["slug"],
                    tagline=artist_data["tagline"],
                    bio=artist_data["bio"],
                    category=ArtistCategory(artist_data["category"]),
                    languages=artist_data["languages"],
                    dialects=artist_data["dialects"],
                    specialties=artist_data["specialties"],
                    sample_audio_urls=sample_audio_urls,
                    price_personal_inr=artist_data["price_personal_inr"],
                    price_commercial_inr=artist_data["price_commercial_inr"],
                    price_broadcast_inr=artist_data["price_broadcast_inr"],
                    price_exclusive_inr=artist_data["price_exclusive_inr"],
                    platform_fee_pct=20,
                    verification_status=VerificationStatus.VERIFIED,
                    is_public=True,
                    is_featured=artist_data["category"] in ("celebrity", "rj"),
                    avg_rating=4.5 + (hash(artist_data["slug"]) % 5) / 10,
                    rating_count=10 + abs(hash(artist_data["slug"])) % 90,
                    total_licenses=abs(hash(artist_data["slug"])) % 50,
                    content_restrictions={},
                )
                db.add(artist)
                await db.commit()
                log.info("CREATE %s (%s)", artist_data["display_name"], artist_data["category"])
                created += 1

    await engine.dispose()
    log.info("")
    log.info("Done — %d created, %d skipped", created, skipped)
    log.info("Visit http://localhost:3000/dashboard/marketplace to see the artists")


if __name__ == "__main__":
    asyncio.run(seed())
