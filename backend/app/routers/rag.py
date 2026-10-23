"""
AgenticMarketer Backend — RAG & Knowledge Base Endpoints.
Allows file uploads, document indexing, collection querying, and document management.
"""

import shutil
import uuid
from pathlib import Path
from typing import List, Optional
from pydantic import BaseModel
from fastapi import APIRouter, UploadFile, File, HTTPException, status

from backend.app.core.config import get_settings
from backend.app.rag.vector_store import rag_store
from backend.app.services.rag_prompts import sanitize_rag_markdown

router = APIRouter(prefix="/api/rag", tags=["Knowledge Base & RAG"])


class DocumentResponse(BaseModel):
    id: str
    filename: str
    size_bytes: int
    size_formatted: str
    chunk_count: int
    status: str
    preview: str
    created_at: str


class RAGQueryRequest(BaseModel):
    query: str
    top_k: Optional[int] = 4
    filename: Optional[str] = None
    doc_filter: Optional[List[str]] = None


class RAGChunkResponse(BaseModel):
    doc_name: str
    chunk_index: int
    text: str
    score: float


@router.post("/upload", response_model=DocumentResponse, status_code=status.HTTP_201_CREATED)
async def upload_document(file: UploadFile = File(...)):
    """
    Upload and index a grounding document or visual asset (.pdf, .docx, .txt, .md, .png, .jpg, .jpeg, .webp).
    Extracts text and visual OCR/specs, splits into semantic chunks, and persists in vector store.
    """
    settings = get_settings()
    filename = file.filename or "uploaded_document"
    ext = Path(filename).suffix.lower()

    if ext not in settings.ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported file type '{ext}'. Allowed extensions: {settings.ALLOWED_EXTENSIONS}",
        )

    # Save to disk
    uploads_dir = Path(settings.UPLOAD_DIRECTORY)
    uploads_dir.mkdir(parents=True, exist_ok=True)
    stem = Path(filename).stem
    target_path = uploads_dir / f"{stem}{ext}"

    # Handle duplicates by appending counter if needed
    counter = 1
    while target_path.exists():
        target_path = uploads_dir / f"{stem}_{counter}{ext}"
        counter += 1

    try:
        with open(target_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to save file: {str(e)}",
        )
    finally:
        await file.close()

    try:
        doc_meta = rag_store.index_document(target_path, filename)
        return DocumentResponse(**doc_meta)
    except Exception as e:
        if target_path.exists():
            target_path.unlink()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to process and index document: {str(e)}",
        )


@router.get("/documents", response_model=List[DocumentResponse])
async def list_documents():
    """List all indexed grounding documents and their chunk statistics."""
    docs = rag_store.list_documents()
    return [DocumentResponse(**d) for d in docs]


@router.delete("/documents/{doc_id}")
async def delete_document(doc_id: str):
    """Delete a document and purge all its chunks from the RAG store."""
    success = rag_store.delete_document(doc_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Document with ID '{doc_id}' not found.",
        )
    return {"success": True, "message": f"Document '{doc_id}' purged successfully."}


class RAGQueryResponse(BaseModel):
    query: str
    answer: str
    results: List[RAGChunkResponse]


@router.post("/query", response_model=RAGQueryResponse)
async def query_knowledge_base(payload: RAGQueryRequest):
    """Query indexed documents for top semantic grounding chunks and synthesized AI answer."""
    doc_filter = list(payload.doc_filter) if payload.doc_filter else []
    if payload.filename and payload.filename.strip() and payload.filename != "ALL":
        if payload.filename.strip() not in doc_filter:
            doc_filter.append(payload.filename.strip())

    results = rag_store.query_context(
        payload.query,
        top_k=payload.top_k or 4,
        doc_filter=doc_filter if doc_filter else None,
    )
    raw_answer = rag_store.synthesize_answer(payload.query, results)
    clean_answer = sanitize_rag_markdown(raw_answer)
    return RAGQueryResponse(
        query=payload.query,
        answer=clean_answer,
        results=[RAGChunkResponse(**r) for r in results]
    )


@router.post("/analyze-brief")
async def analyze_campaign_brief(file: UploadFile = File(...)):
    """
    Lightweight multimodal brief analyzer for the Campaign Goal panel.
    Analyzes uploaded images (product photos, sketches) or brief documents (PDF, Word, TXT)
    using Cloudflare Vision and PIL without permanently polluting the corporate vector store.
    """
    settings = get_settings()
    filename = file.filename or "uploaded_brief"
    ext = Path(filename).suffix.lower()

    if ext not in settings.ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported file type '{ext}'. Allowed: {settings.ALLOWED_EXTENSIONS}",
        )

    # Save to scratch / temp uploads
    temp_dir = Path(settings.UPLOAD_DIRECTORY) / "temp_briefs"
    temp_dir.mkdir(parents=True, exist_ok=True)
    file_id = str(uuid.uuid4())[:8]
    temp_path = temp_dir / f"{file_id}_{filename}"

    try:
        with open(temp_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    finally:
        await file.close()

    try:
        # Extract rich content using multimodal extract_text
        extracted_content = rag_store.extract_text(temp_path, ext)
        is_image = ext in [".png", ".jpg", ".jpeg", ".webp"]

        # Build concise brief summary
        lines = [l.strip() for l in extracted_content.splitlines() if l.strip() and not l.strip().startswith("=")]
        summary = " ".join(lines[:3])[:240]

        return {
            "success": True,
            "filename": filename,
            "temp_path": str(temp_path),
            "file_type": "image" if is_image else "document",
            "summary": summary,
            "full_brief_content": extracted_content
        }
    except Exception as e:
        if temp_path.exists():
            temp_path.unlink()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to analyze brief: {str(e)}",
        )
