import asyncio
import uuid
from pathlib import Path

import boto3

from app.core.config import settings

_s3_client = None
_LOCAL_MEDIA_DIR = Path("/app/media")


def s3_configured() -> bool:
    return bool(
        settings.AWS_ACCESS_KEY_ID
        and settings.AWS_ACCESS_KEY_ID != "your-aws-key"
        and settings.AWS_SECRET_ACCESS_KEY
        and settings.AWS_SECRET_ACCESS_KEY != "your-aws-secret"
        and settings.AWS_S3_BUCKET
    )


def _get_s3():
    global _s3_client
    if _s3_client is None:
        _s3_client = boto3.client(
            "s3",
            region_name=settings.AWS_REGION,
            aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
            aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
        )
    return _s3_client


def _local_url(key: str) -> str:
    return f"/media/{key}"


def _write_file(dest: Path, data: bytes) -> None:
    dest.parent.mkdir(parents=True, exist_ok=True)
    dest.write_bytes(data)


async def _save_local(audio_bytes: bytes, key: str) -> str:
    dest = _LOCAL_MEDIA_DIR / key
    await asyncio.to_thread(_write_file, dest, audio_bytes)
    return _local_url(key)


async def upload_audio(audio_bytes: bytes, key: str, tenant_id: uuid.UUID) -> str:
    if not s3_configured():
        return await _save_local(audio_bytes, key)

    s3 = _get_s3()
    bucket = settings.AWS_S3_BUCKET

    await asyncio.to_thread(
        s3.put_object,
        Bucket=bucket,
        Key=key,
        Body=audio_bytes,
        ContentType="audio/wav",
        Metadata={"tenant_id": str(tenant_id)},
    )

    url = await asyncio.to_thread(
        s3.generate_presigned_url,
        "get_object",
        Params={"Bucket": bucket, "Key": key},
        ExpiresIn=86400,
    )
    return url


async def upload_document(content: bytes, key: str, content_type: str) -> str:
    if not s3_configured():
        dest = _LOCAL_MEDIA_DIR / key
        await asyncio.to_thread(_write_file, dest, content)
        return f"local://{key}"

    s3 = _get_s3()
    bucket = settings.AWS_S3_BUCKET

    await asyncio.to_thread(
        s3.put_object,
        Bucket=bucket,
        Key=key,
        Body=content,
        ContentType=content_type,
    )
    return f"s3://{bucket}/{key}"


async def generate_presigned_url(key: str, expires_in: int = 3600) -> str:
    if not s3_configured():
        return _local_url(key)

    s3 = _get_s3()
    return await asyncio.to_thread(
        s3.generate_presigned_url,
        "get_object",
        Params={"Bucket": settings.AWS_S3_BUCKET, "Key": key},
        ExpiresIn=expires_in,
    )
