from __future__ import annotations
import asyncio
import logging

from app.celery_app import celery

logger = logging.getLogger(__name__)


@celery.task(bind=True, max_retries=2, default_retry_delay=60)
def train_voice_clone_task(self, clone_id: str, tenant_id: str, sample_urls: list[str], language: str):
    """
    Background task: submit voice clone samples to Sarvam AI and poll until ready.
    Falls back to marking the clone FAILED on error.
    """
    try:
        asyncio.run(_train_async(clone_id, tenant_id, sample_urls, language))
    except Exception as exc:
        logger.exception("train_voice_clone_task failed for %s", clone_id)
        raise self.retry(exc=exc)


async def _train_async(clone_id: str, tenant_id: str, sample_urls: list[str], language: str) -> None:
    import uuid
    import httpx
    from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
    from sqlalchemy.orm import sessionmaker
    from sqlalchemy import select, update

    from app.core.config import settings
    from app.models.voice_clone import VoiceClone, VoiceCloneStatus

    engine = create_async_engine(settings.DATABASE_URL, echo=False)
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    async with async_session() as db:
        try:
            async with httpx.AsyncClient(
                base_url=settings.SARVAM_API_BASE,
                headers={"api-subscription-key": settings.SARVAM_API_KEY},
                timeout=120.0,
            ) as client:
                resp = await client.post(
                    "/voice-cloning/train",
                    json={
                        "sample_urls": sample_urls,
                        "language_code": f"{language}-IN" if "-" not in language else language,
                    },
                )
                resp.raise_for_status()
                data = resp.json()
                sarvam_voice_id = data.get("voice_id") or data.get("id")

            await db.execute(
                update(VoiceClone)
                .where(VoiceClone.id == uuid.UUID(clone_id))
                .values(
                    status=VoiceCloneStatus.READY,
                    sarvam_voice_id=sarvam_voice_id,
                )
            )
            await db.commit()

        except Exception as exc:
            await db.execute(
                update(VoiceClone)
                .where(VoiceClone.id == uuid.UUID(clone_id))
                .values(status=VoiceCloneStatus.FAILED, )
            )
            await db.commit()
            raise

    await engine.dispose()
