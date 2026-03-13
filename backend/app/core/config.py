from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    APP_NAME: str = "VaaniAI"
    APP_VERSION: str = "0.1.0"
    DEBUG: bool = False
    SECRET_KEY: str = "change-me-in-production"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    REFRESH_TOKEN_EXPIRE_DAYS: int = 30

    DATABASE_URL: str = "postgresql+asyncpg://vaaniai:vaaniai@localhost:5432/vaaniai"
    DATABASE_SYNC_URL: str = "postgresql://vaaniai:vaaniai@localhost:5432/vaaniai"

    REDIS_URL: str = "redis://localhost:6379/0"

    OPENAI_API_KEY: str = ""
    OPENAI_MODEL: str = "gpt-4o"

    SARVAM_API_KEY: str = ""
    SARVAM_API_BASE: str = "https://api.sarvam.ai"

    GOOGLE_TRANSLATE_API_KEY: str = ""

    PINECONE_API_KEY: str = ""
    PINECONE_ENVIRONMENT: str = "us-east-1-aws"
    PINECONE_INDEX_NAME: str = "vaaniai-knowledge"

    STRIPE_SECRET_KEY: str = ""
    STRIPE_WEBHOOK_SECRET: str = ""
    STRIPE_STARTER_PRICE_ID: str = ""
    STRIPE_GROWTH_PRICE_ID: str = ""

    AWS_ACCESS_KEY_ID: str = ""
    AWS_SECRET_ACCESS_KEY: str = ""
    AWS_REGION: str = "us-east-1"
    AWS_S3_BUCKET: str = "vaaniai-audio"

    STT_PROVIDER: str = "sarvam"
    STT_FALLBACK_PROVIDER: str = "whisper"

    WHISPER_MODEL_SIZE: str = "large-v3"
    WHISPER_DEVICE: str = "cpu"
    WHISPER_COMPUTE_TYPE: str = "int8"

    SARVAM_STT_MODEL: str = "saaras:v2"
    SARVAM_STT_WITH_DIARIZATION: bool = False
    SARVAM_TTS_MODEL: str = "bulbul:v1"

    TWILIO_ACCOUNT_SID: str = ""
    TWILIO_AUTH_TOKEN: str = ""
    TWILIO_PHONE_NUMBER: str = ""
    TWILIO_WEBHOOK_SECRET: str = ""
    TWILIO_DEFAULT_TENANT_ID: str = ""

    FASTTEXT_MODEL_PATH: str = "models/lid.176.bin"

    INDICTRANS_DEVICE: str = "cpu"

    API_BASE_URL: str = "https://api.vaaniai.com"

    CORS_ORIGINS: List[str] = [
        "http://localhost",
        "http://localhost:80",
        "http://localhost:3000",
        "http://localhost:8000",
        "https://app.vaaniai.com",
    ]

    RATE_LIMIT_DEFAULT: str = "100/minute"
    RATE_LIMIT_VOICE: str = "30/minute"

    CELERY_BROKER_URL: str = "redis://localhost:6379/1"
    CELERY_RESULT_BACKEND: str = "redis://localhost:6379/2"

    MAX_AUDIO_SIZE_MB: int = 25
    SUPPORTED_LANGUAGES: List[str] = ["hi", "ta", "te", "bn", "gu", "mr", "en"]
    LANGUAGE_NAMES: dict = {
        "hi": "Hindi",
        "ta": "Tamil",
        "te": "Telugu",
        "bn": "Bengali",
        "gu": "Gujarati",
        "mr": "Marathi",
        "en": "English",
    }


settings = Settings()
