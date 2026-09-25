"""
AgenticMarketer Backend — RAG & Knowledge Base Endpoints.
Allows file uploads, document indexing, collection querying, and document management.
"""

import shutil
from pathlib import Path
from typing import List, Optional
from pydantic import BaseModel
from fastapi import APIRouter, UploadFile, File, HTTPException, status

from backend.app.core.config import get_settings
from backend.app.rag.vector_store import rag_store

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


class RAGChunkResponse(BaseModel):
    doc_name: str
    chunk_index: int
    text: str
    score: float


@router.post("/upload", response_model=DocumentResponse, status_code=status.HTTP_201_CREATED)
async def upload_document(file: UploadFile = File(...)):
    """
    Upload and index a grounding document (.pdf, .docx, .txt, .md).
    Extracts text, splits into semantic chunks, and persists in vector store.
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
    results = rag_store.query_context(payload.query, top_k=payload.top_k or 4)
    answer = rag_store.synthesize_answer(payload.query, results)
    return RAGQueryResponse(
        query=payload.query,
        answer=answer,
        results=[RAGChunkResponse(**r) for r in results]
    )
