from __future__ import annotations
import asyncio
import logging

from app.celery_app import celery

logger = logging.getLogger(__name__)


@celery.task(bind=True, max_retries=3, default_retry_delay=30)
def process_document(self, document_id: str, kb_id: str, namespace: str, s3_key: str, content_type: str):
    """
    Background task: download document from S3, extract text, chunk, embed into Pinecone.
    """
    try:
        asyncio.run(_process_document_async(document_id, kb_id, namespace, s3_key, content_type))
    except Exception as exc:
        logger.exception("process_document failed for %s", document_id)
        raise self.retry(exc=exc)


async def _process_document_async(
    document_id: str,
    kb_id: str,
    namespace: str,
    s3_key: str,
    content_type: str,
) -> None:
    import uuid
    from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
    from sqlalchemy.orm import sessionmaker
    from sqlalchemy import select, update

    from app.core.config import settings
    from app.core.rag import get_rag_agent
    from app.models.knowledge_base import KnowledgeDocument, DocumentStatus, KnowledgeBase

    engine = create_async_engine(settings.DATABASE_URL, echo=False)
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    async with async_session() as db:
        result = await db.execute(
            select(KnowledgeDocument).where(KnowledgeDocument.id == uuid.UUID(document_id))
        )
        doc = result.scalar_one_or_none()
        if not doc:
            return

        await db.execute(
            update(KnowledgeDocument)
            .where(KnowledgeDocument.id == doc.id)
            .values(status=DocumentStatus.PROCESSING)
        )
        await db.commit()

        try:
            import boto3
            s3 = boto3.client(
                "s3",
                region_name=settings.AWS_REGION,
                aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
                aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
            )
            obj = s3.get_object(Bucket=settings.AWS_S3_BUCKET, Key=s3_key)
            raw_bytes = obj["Body"].read()

            text = _extract_text(raw_bytes, content_type)

            rag = get_rag_agent()
            chunk_count = await rag.index_document(
                document_id=document_id,
                text=text,
                namespace=namespace,
                metadata={"kb_id": kb_id, "s3_key": s3_key},
            )

            await db.execute(
                update(KnowledgeDocument)
                .where(KnowledgeDocument.id == doc.id)
                .values(status=DocumentStatus.READY, chunk_count=chunk_count)
            )
            await db.execute(
                update(KnowledgeBase)
                .where(KnowledgeBase.id == uuid.UUID(kb_id))
                .values(
                    document_count=KnowledgeBase.document_count + 1,
                    total_chunks=KnowledgeBase.total_chunks + chunk_count,
                )
            )
            await db.commit()

        except Exception as exc:
            await db.execute(
                update(KnowledgeDocument)
                .where(KnowledgeDocument.id == doc.id)
                .values(status=DocumentStatus.FAILED, error_message=str(exc))
            )
            await db.commit()
            raise

    await engine.dispose()


def _extract_text(raw_bytes: bytes, content_type: str) -> str:
    if "pdf" in content_type:
        try:
            import pypdf
            import io
            reader = pypdf.PdfReader(io.BytesIO(raw_bytes))
            return "\n".join(page.extract_text() or "" for page in reader.pages)
        except ImportError:
            pass

    if "word" in content_type or "docx" in content_type:
        try:
            import docx
            import io
            doc = docx.Document(io.BytesIO(raw_bytes))
            return "\n".join(p.text for p in doc.paragraphs)
        except ImportError:
            pass

    return raw_bytes.decode("utf-8", errors="replace")
