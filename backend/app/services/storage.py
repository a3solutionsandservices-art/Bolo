from __future__ import annotations
import uuid

import boto3
from botocore.exceptions import ClientError

from app.core.config import settings


_s3_client = None


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


async def upload_audio(audio_bytes: bytes, key: str, tenant_id: uuid.UUID) -> str:
    s3 = _get_s3()
    bucket = settings.AWS_S3_BUCKET

    s3.put_object(
        Bucket=bucket,
        Key=key,
        Body=audio_bytes,
        ContentType="audio/wav",
        Metadata={"tenant_id": str(tenant_id)},
    )

    url = s3.generate_presigned_url(
        "get_object",
        Params={"Bucket": bucket, "Key": key},
        ExpiresIn=86400,
    )
    return url


async def upload_document(content: bytes, key: str, content_type: str) -> str:
    s3 = _get_s3()
    bucket = settings.AWS_S3_BUCKET

    s3.put_object(
        Bucket=bucket,
        Key=key,
        Body=content,
        ContentType=content_type,
    )
    return f"s3://{bucket}/{key}"


async def generate_presigned_url(key: str, expires_in: int = 3600) -> str:
    s3 = _get_s3()
    return s3.generate_presigned_url(
        "get_object",
        Params={"Bucket": settings.AWS_S3_BUCKET, "Key": key},
        ExpiresIn=expires_in,
    )
