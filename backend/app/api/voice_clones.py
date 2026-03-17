import uuid
from typing import Optional

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from pydantic import BaseModel
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.stt import get_stt
from app.db.base import get_db
from app.middleware.auth import get_current_user
from app.models.voice_clone import VoiceClone, VoiceCloneStatus
from app.models.user import User, UserRole
from app.services.storage import upload_audio

MIN_STT_CONFIDENCE = 0.4
MIN_DURATION_SECONDS = 3.0

router = APIRouter(prefix="/voice-clones", tags=["voice-clones"])


class CreateVoiceCloneRequest(BaseModel):
    name: str
    description: Optional[str] = None
    language: str = "hi"


class VoiceCloneResponse(BaseModel):
    id: str
    name: str
    description: Optional[str]
    language: str
    status: str
    sarvam_voice_id: Optional[str]
    is_default: bool
    sample_audio_urls: list[str]
    created_at: str


@router.post("", response_model=VoiceCloneResponse, status_code=status.HTTP_201_CREATED)
async def create_voice_clone(
    body: CreateVoiceCloneRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    clone = VoiceClone(
        tenant_id=current_user.tenant_id,
        name=body.name,
        description=body.description,
        language=body.language,
        status=VoiceCloneStatus.PENDING,
    )
    db.add(clone)
    await db.commit()
    await db.refresh(clone)
    return _to_response(clone)


@router.get("", response_model=list[VoiceCloneResponse])
async def list_voice_clones(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(VoiceClone)
        .where(VoiceClone.tenant_id == current_user.tenant_id)
        .order_by(VoiceClone.created_at.desc())
    )
    return [_to_response(c) for c in result.scalars().all()]


@router.get("/{clone_id}", response_model=VoiceCloneResponse)
async def get_voice_clone(
    clone_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    clone = await _get_or_404(clone_id, current_user.tenant_id, db)
    return _to_response(clone)


MAX_SAMPLE_BYTES = 50 * 1024 * 1024


@router.post("/{clone_id}/samples", response_model=VoiceCloneResponse)
async def upload_sample_audio(
    clone_id: uuid.UUID,
    audio: UploadFile = File(...),
    language: Optional[str] = Form(None),
    skip_validation: bool = Form(False),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    clone = await _get_or_404(clone_id, current_user.tenant_id, db)

    audio_bytes = await audio.read()
    if len(audio_bytes) > MAX_SAMPLE_BYTES:
        raise HTTPException(status_code=413, detail="Sample audio exceeds 50 MB limit")

    if skip_validation and current_user.role not in (UserRole.SUPER_ADMIN, UserRole.TENANT_ADMIN):
        raise HTTPException(status_code=403, detail="Only admins may skip validation")

    if not skip_validation:
        stt = get_stt()
        try:
            result = await stt.transcribe(audio_bytes, language=language or clone.language)
            if result.duration_seconds < MIN_DURATION_SECONDS:
                raise HTTPException(
                    status_code=422,
                    detail=f"Recording too short ({result.duration_seconds:.1f}s). Minimum is {MIN_DURATION_SECONDS}s. Please record a longer sample."
                )
            if result.confidence < MIN_STT_CONFIDENCE:
                raise HTTPException(
                    status_code=422,
                    detail=f"Audio quality too low (confidence {result.confidence:.0%}). Please record in a quieter environment with a clear voice."
                )
            if not result.text.strip():
                raise HTTPException(
                    status_code=422,
                    detail="No speech detected in the recording. Please ensure your microphone is working."
                )
        except HTTPException:
            raise
        except Exception:
            pass

    s3_key = f"voice-clones/{clone.id}/samples/{uuid.uuid4()}.wav"
    try:
        url = await upload_audio(audio_bytes, s3_key, current_user.tenant_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to upload sample: {e}")

    updated_urls = list(clone.sample_audio_urls or []) + [url]
    await db.execute(
        update(VoiceClone)
        .where(VoiceClone.id == clone_id)
        .values(sample_audio_urls=updated_urls)
    )
    await db.commit()
    await db.refresh(clone)
    return _to_response(clone)


@router.post("/{clone_id}/train", response_model=VoiceCloneResponse)
async def train_voice_clone(
    clone_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    from app.tasks.voice_clone import train_voice_clone_task

    clone = await _get_or_404(clone_id, current_user.tenant_id, db)

    if not clone.sample_audio_urls:
        raise HTTPException(status_code=400, detail="Upload at least one audio sample before training")

    if clone.status in (VoiceCloneStatus.READY, VoiceCloneStatus.TRAINING):
        raise HTTPException(
            status_code=400,
            detail=f"Voice clone is already {clone.status}",
        )

    await db.execute(
        update(VoiceClone)
        .where(VoiceClone.id == clone_id)
        .values(status=VoiceCloneStatus.TRAINING)
    )
    await db.commit()
    await db.refresh(clone)

    train_voice_clone_task.delay(
        str(clone_id),
        str(current_user.tenant_id),
        list(clone.sample_audio_urls),
        clone.language,
    )

    return _to_response(clone)


@router.patch("/{clone_id}/default", response_model=VoiceCloneResponse)
async def set_default_voice_clone(
    clone_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    clone = await _get_or_404(clone_id, current_user.tenant_id, db)

    if clone.status != VoiceCloneStatus.READY:
        raise HTTPException(status_code=400, detail="Only READY voice clones can be set as default")

    await db.execute(
        update(VoiceClone)
        .where(VoiceClone.tenant_id == current_user.tenant_id)
        .values(is_default=False)
    )
    await db.execute(
        update(VoiceClone)
        .where(VoiceClone.id == clone_id)
        .values(is_default=True)
    )
    await db.commit()
    await db.refresh(clone)
    return _to_response(clone)


@router.delete("/{clone_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_voice_clone(
    clone_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    clone = await _get_or_404(clone_id, current_user.tenant_id, db)
    await db.delete(clone)
    await db.commit()


async def _get_or_404(clone_id: uuid.UUID, tenant_id: uuid.UUID, db: AsyncSession) -> VoiceClone:
    result = await db.execute(
        select(VoiceClone).where(
            VoiceClone.id == clone_id,
            VoiceClone.tenant_id == tenant_id,
        )
    )
    clone = result.scalar_one_or_none()
    if not clone:
        raise HTTPException(status_code=404, detail="Voice clone not found")
    return clone


def _to_response(clone: VoiceClone) -> VoiceCloneResponse:
    return VoiceCloneResponse(
        id=str(clone.id),
        name=clone.name,
        description=clone.description,
        language=clone.language,
        status=clone.status,
        sarvam_voice_id=clone.sarvam_voice_id,
        is_default=clone.is_default,
        sample_audio_urls=clone.sample_audio_urls or [],
        created_at=clone.created_at.isoformat(),
    )
