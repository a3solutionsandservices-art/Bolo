from __future__ import annotations
import io
import json
import uuid
from typing import Optional

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, BackgroundTasks, status
from sqlalchemy import select, func, update
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel

from app.core.rag import get_rag_agent
from app.db.base import get_db
from app.middleware.auth import get_current_user
from app.models.knowledge_base import KnowledgeBase, KnowledgeDocument, DocumentStatus
from app.models.user import User

router = APIRouter(prefix="/knowledge-bases", tags=["knowledge"])


class CreateKBRequest(BaseModel):
    name: str
    description: Optional[str] = None
    languages: list[str] = ["en"]


@router.post("", status_code=status.HTTP_201_CREATED)
async def create_knowledge_base(
    body: CreateKBRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    namespace = f"tenant-{current_user.tenant_id}-kb-{uuid.uuid4().hex[:8]}"
    kb = KnowledgeBase(
        tenant_id=current_user.tenant_id,
        name=body.name,
        description=body.description,
        pinecone_namespace=namespace,
        languages=body.languages,
    )
    db.add(kb)
    await db.commit()
    await db.refresh(kb)
    return {
        "id": str(kb.id),
        "name": kb.name,
        "description": kb.description,
        "pinecone_namespace": kb.pinecone_namespace,
        "document_count": 0,
        "created_at": kb.created_at.isoformat(),
    }


@router.get("")
async def list_knowledge_bases(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(KnowledgeBase).where(
            KnowledgeBase.tenant_id == current_user.tenant_id,
            KnowledgeBase.is_active == True,
        )
    )
    kbs = result.scalars().all()
    return [
        {
            "id": str(kb.id),
            "name": kb.name,
            "description": kb.description,
            "document_count": kb.document_count,
            "total_chunks": kb.total_chunks,
            "languages": kb.languages,
            "created_at": kb.created_at.isoformat(),
        }
        for kb in kbs
    ]


@router.delete("/{kb_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_knowledge_base(
    kb_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(KnowledgeBase).where(
            KnowledgeBase.id == kb_id,
            KnowledgeBase.tenant_id == current_user.tenant_id,
        )
    )
    kb = result.scalar_one_or_none()
    if not kb:
        raise HTTPException(status_code=404, detail="Knowledge base not found")
    kb.is_active = False
    await db.commit()


@router.post("/{kb_id}/documents", status_code=status.HTTP_201_CREATED)
async def upload_document(
    kb_id: uuid.UUID,
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    title: str = Form(...),
    language: str = Form("en"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(KnowledgeBase).where(
            KnowledgeBase.id == kb_id,
            KnowledgeBase.tenant_id == current_user.tenant_id,
        )
    )
    kb = result.scalar_one_or_none()
    if not kb:
        raise HTTPException(status_code=404, detail="Knowledge base not found")

    content = await file.read()
    content_type = file.content_type or "text/plain"
    doc = KnowledgeDocument(
        knowledge_base_id=kb.id,
        title=title,
        filename=file.filename,
        content_type=content_type,
        file_size_bytes=len(content),
        language=language,
        status=DocumentStatus.PENDING,
    )
    db.add(doc)
    await db.execute(
        update(KnowledgeBase)
        .where(KnowledgeBase.id == kb.id)
        .values(document_count=KnowledgeBase.document_count + 1)
    )
    await db.commit()
    await db.refresh(doc)

    from app.core.config import settings as _settings

    if _settings.AWS_ACCESS_KEY_ID and _settings.AWS_S3_BUCKET:
        from app.services.storage import upload_document as s3_upload
        from app.tasks.knowledge import process_document

        s3_key = f"knowledge/{current_user.tenant_id}/{doc.id}/{file.filename}"
        try:
            await s3_upload(content, s3_key, content_type)
            process_document.delay(
                document_id=str(doc.id),
                kb_id=str(kb.id),
                namespace=kb.pinecone_namespace,
                s3_key=s3_key,
                content_type=content_type,
            )
        except Exception:
            background_tasks.add_task(
                _process_document,
                doc_id=str(doc.id),
                content=content,
                content_type=content_type,
                namespace=kb.pinecone_namespace,
                language=language,
                metadata={"kb_id": str(kb.id), "tenant_id": str(current_user.tenant_id)},
            )
    else:
        background_tasks.add_task(
            _process_document,
            doc_id=str(doc.id),
            content=content,
            content_type=content_type,
            namespace=kb.pinecone_namespace,
            language=language,
            metadata={"kb_id": str(kb.id), "tenant_id": str(current_user.tenant_id)},
        )

    return {
        "id": str(doc.id),
        "title": doc.title,
        "filename": doc.filename,
        "status": doc.status.value,
        "created_at": doc.created_at.isoformat(),
    }


@router.get("/{kb_id}/documents")
async def list_documents(
    kb_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(KnowledgeDocument)
        .join(KnowledgeBase)
        .where(
            KnowledgeDocument.knowledge_base_id == kb_id,
            KnowledgeBase.tenant_id == current_user.tenant_id,
        )
    )
    docs = result.scalars().all()
    return [
        {
            "id": str(d.id),
            "title": d.title,
            "filename": d.filename,
            "status": d.status.value,
            "chunk_count": d.chunk_count,
            "language": d.language,
            "file_size_bytes": d.file_size_bytes,
            "created_at": d.created_at.isoformat(),
        }
        for d in docs
    ]


@router.delete("/{kb_id}/documents/{doc_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_document(
    kb_id: uuid.UUID,
    doc_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(KnowledgeDocument)
        .join(KnowledgeBase)
        .where(
            KnowledgeDocument.id == doc_id,
            KnowledgeDocument.knowledge_base_id == kb_id,
            KnowledgeBase.tenant_id == current_user.tenant_id,
        )
    )
    doc = result.scalar_one_or_none()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    rag = get_rag_agent()
    try:
        kb_result = await db.execute(select(KnowledgeBase).where(KnowledgeBase.id == kb_id))
        kb = kb_result.scalar_one()
        await rag.delete_document(str(doc_id), kb.pinecone_namespace)
    except Exception:
        pass

    await db.delete(doc)
    await db.commit()


@router.post("/{kb_id}/query")
async def query_knowledge_base(
    kb_id: uuid.UUID,
    question: str,
    top_k: int = 5,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(KnowledgeBase).where(
            KnowledgeBase.id == kb_id,
            KnowledgeBase.tenant_id == current_user.tenant_id,
        )
    )
    kb = result.scalar_one_or_none()
    if not kb:
        raise HTTPException(status_code=404, detail="Knowledge base not found")

    rag = get_rag_agent()
    sources = await rag.query(question, kb.pinecone_namespace, top_k)
    return {"question": question, "results": sources}


async def _process_document(
    doc_id: str,
    content: bytes,
    content_type: str,
    namespace: str,
    language: str,
    metadata: dict,
) -> None:
    from app.db.base import AsyncSessionLocal
    from sqlalchemy import select

    text = _extract_text(content, content_type)
    rag = get_rag_agent()

    async with AsyncSessionLocal() as db:
        result = await db.execute(
            select(KnowledgeDocument).where(KnowledgeDocument.id == uuid.UUID(doc_id))
        )
        doc = result.scalar_one_or_none()
        if not doc:
            return

        try:
            doc.status = DocumentStatus.PROCESSING
            await db.commit()

            chunk_count = await rag.index_document(doc_id, text, namespace, metadata)

            doc.status = DocumentStatus.READY
            doc.chunk_count = chunk_count
            await db.commit()
        except Exception as e:
            doc.status = DocumentStatus.FAILED
            doc.error_message = str(e)
            await db.commit()


def _extract_text(content: bytes, content_type: str) -> str:
    if "pdf" in content_type:
        try:
            import pypdf

            reader = pypdf.PdfReader(io.BytesIO(content))
            return "\n".join(page.extract_text() or "" for page in reader.pages)
        except ImportError:
            pass

    if "json" in content_type:
        data = json.loads(content.decode("utf-8"))
        if isinstance(data, dict):
            return json.dumps(data, ensure_ascii=False)

    return content.decode("utf-8", errors="replace")
