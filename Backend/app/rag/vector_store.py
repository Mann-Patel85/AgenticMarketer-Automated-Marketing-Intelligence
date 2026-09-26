"""
AgenticMarketer Backend — RAG Document Processing & Vector Store Engine.
Handles:
1. Multi-format parsing (.pdf, .docx, .txt, .md)
2. Semantic chunking with configurable overlap
3. Vector generation via Google Gemini Embedding API with local cosine fallback
4. Persistent indexing of documents and chunks
"""

import os
import re
import json
import math
import uuid
from pathlib import Path
from typing import List, Dict, Any, Optional
from datetime import datetime, timezone

import pypdf
import docx
import numpy as np

from backend.app.core.config import get_settings


class RAGVectorStore:
    """Persistent RAG Document Vector Store & Semantic Retrieval Engine."""

    def __init__(self):
        settings = get_settings()
        self.data_dir = Path(settings.DATA_DIRECTORY)
        self.uploads_dir = Path(settings.UPLOAD_DIRECTORY)
        self.metadata_file = self.data_dir / "rag_metadata.json"
        self.chunks_file = self.data_dir / "rag_chunks.json"

        # Ensure directories exist
        self.uploads_dir.mkdir(parents=True, exist_ok=True)
        self._init_storage()

    def _init_storage(self) -> None:
        """Initialize storage files if they do not exist."""
        if not self.metadata_file.exists():
            with open(self.metadata_file, "w", encoding="utf-8") as f:
                json.dump([], f, indent=2)

        if not self.chunks_file.exists():
            with open(self.chunks_file, "w", encoding="utf-8") as f:
                json.dump([], f, indent=2)

    def _load_metadata(self) -> List[Dict[str, Any]]:
        try:
            with open(self.metadata_file, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            return []

    def _save_metadata(self, data: List[Dict[str, Any]]) -> None:
        with open(self.metadata_file, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2)

    def _load_chunks(self) -> List[Dict[str, Any]]:
        try:
            with open(self.chunks_file, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            return []

    def _save_chunks(self, chunks: List[Dict[str, Any]]) -> None:
        with open(self.chunks_file, "w", encoding="utf-8") as f:
            json.dump(chunks, f, indent=2)

    def sanitize_text(self, text: str) -> str:
        """Clean up PDF character encoding artifacts, Unicode replacement chars, and whitespace."""
        if not text:
            return ""
        text = text.replace("\ufffd", "'").replace("\x00", "")
        text = re.sub(r"[ \t]+", " ", text)
        return text.strip()

    # ── Document Parsers ─────────────────────────────────────────────
    def extract_text(self, file_path: Path, extension: str) -> str:
        """Extract plain text from PDF, DOCX, TXT, or MD documents."""
        ext = extension.lower()

        if ext == ".pdf":
            text = []
            with open(file_path, "rb") as f:
                reader = pypdf.PdfReader(f)
                for page_num, page in enumerate(reader.pages):
                    page_text = page.extract_text() or ""
                    cleaned = self.sanitize_text(page_text)
                    if cleaned:
                        text.append(f"--- Page {page_num + 1} ---\n{cleaned}")
            return "\n\n".join(text)

        elif ext == ".docx":
            doc = docx.Document(file_path)
            paragraphs = [self.sanitize_text(p.text) for p in doc.paragraphs if p.text.strip()]
            return "\n\n".join(paragraphs)

        elif ext in [".txt", ".md"]:
            with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
                return self.sanitize_text(f.read())

        else:
            raise ValueError(f"Unsupported document format: {extension}")

    # ── Semantic Chunking ────────────────────────────────────────────
    def chunk_text(
        self,
        text: str,
        chunk_size: int = 700,
        chunk_overlap: int = 100,
    ) -> List[str]:
        """Split document text into overlapping semantic passages."""
        # Clean text
        clean_text = re.sub(r"\r\n", "\n", text)
        clean_text = re.sub(r"\n{3,}", "\n\n", clean_text).strip()

        if len(clean_text) <= chunk_size:
            return [clean_text] if clean_text else []

        chunks = []
        start = 0
        text_len = len(clean_text)

        while start < text_len:
            end = min(start + chunk_size, text_len)
            # Try to break on paragraph or sentence boundary
            if end < text_len:
                boundary = clean_text.rfind("\n\n", start, end)
                if boundary == -1 or boundary < start + (chunk_size // 2):
                    boundary = clean_text.rfind(". ", start, end)
                if boundary != -1 and boundary >= start + (chunk_size // 2):
                    end = boundary + 1

            chunk_content = clean_text[start:end].strip()
            if chunk_content:
                chunks.append(chunk_content)

            if end >= text_len:
                break
            start = max(end - chunk_overlap, start + 1)

        return chunks

    # ── Embedding & Similarity ───────────────────────────────────────
    def _compute_fallback_vector(self, text: str, dim: int = 128) -> List[float]:
        """Deterministic term-frequency vector embedding for offline similarity."""
        words = re.findall(r"\b\w{3,}\b", text.lower())
        vec = [0.0] * dim
        if not words:
            return vec

        for word in words:
            idx = hash(word) % dim
            vec[idx] += 1.0

        # L2 normalize vector
        norm = math.sqrt(sum(x * x for x in vec))
        if norm > 0:
            vec = [x / norm for x in vec]
        return vec

    def generate_embedding(self, text: str) -> List[float]:
        """Generate embedding vector using Gemini API if available, else fast local vector."""
        settings = get_settings()
        if settings.GEMINI_API_KEY:
            try:
                from google import genai as gai
                client = gai.Client(api_key=settings.GEMINI_API_KEY)
                result = client.models.embed_content(
                    model="gemini-embedding-001",
                    contents=text[:2000],
                )
                if result and result.embeddings:
                    return result.embeddings[0].values
            except Exception:
                # Fall back to local term vector
                pass

        return self._compute_fallback_vector(text)

    def _cosine_similarity(self, vec_a: List[float], vec_b: List[float]) -> float:
        """Calculate cosine similarity between two float vectors."""
        if not vec_a or not vec_b or len(vec_a) != len(vec_b):
            return 0.0
        a = np.array(vec_a, dtype=np.float32)
        b = np.array(vec_b, dtype=np.float32)
        norm_a = np.linalg.norm(a)
        norm_b = np.linalg.norm(b)
        if norm_a == 0 or norm_b == 0:
            return 0.0
        return float(np.dot(a, b) / (norm_a * norm_b))

    # ── Document Management ──────────────────────────────────────────
    def index_document(self, file_path: Path, original_filename: str) -> Dict[str, Any]:
        """Ingest, parse, chunk, and index a document into the RAG vector store."""
        ext = Path(original_filename).suffix.lower()
        extracted_text = self.extract_text(file_path, ext)
        chunks = self.chunk_text(extracted_text)

        doc_id = str(uuid.uuid4())
        file_size_bytes = os.path.getsize(file_path)
        created_at = datetime.now(timezone.utc).isoformat()

        # Generate embeddings for each chunk
        indexed_chunks = []
        for i, chunk_text in enumerate(chunks):
            embedding = self.generate_embedding(chunk_text)
            indexed_chunks.append({
                "id": str(uuid.uuid4()),
                "doc_id": doc_id,
                "doc_name": original_filename,
                "chunk_index": i,
                "text": chunk_text,
                "vector": embedding,
                "created_at": created_at,
            })

        # Save chunks
        all_chunks = self._load_chunks()
        all_chunks.extend(indexed_chunks)
        self._save_chunks(all_chunks)

        # Save document metadata
        preview = extracted_text[:300].strip() + ("..." if len(extracted_text) > 300 else "")
        doc_meta = {
            "id": doc_id,
            "filename": original_filename,
            "size_bytes": file_size_bytes,
            "size_formatted": f"{file_size_bytes / 1024:.1f} KB" if file_size_bytes < 1024 * 1024 else f"{file_size_bytes / (1024*1024):.1f} MB",
            "chunk_count": len(chunks),
            "status": "ready",
            "preview": preview,
            "created_at": created_at,
        }

        metadata = self._load_metadata()
        metadata.append(doc_meta)
        self._save_metadata(metadata)

        return doc_meta

    def list_documents(self) -> List[Dict[str, Any]]:
        """Return all indexed documents and their stats."""
        return self._load_metadata()

    def delete_document(self, doc_id: str) -> bool:
        """Remove document and its vector chunks from the store by ID or filename."""
        metadata = self._load_metadata()
        target = str(doc_id).strip()
        matched = [
            doc for doc in metadata
            if doc.get("id") == target or doc.get("filename") == target or doc.get("filename", "").lower() == target.lower()
        ]

        if not matched:
            return False

        removed_ids = {doc["id"] for doc in matched}
        removed_filenames = {doc.get("filename") for doc in matched if doc.get("filename")}

        updated_meta = [doc for doc in metadata if doc["id"] not in removed_ids]

        chunks = self._load_chunks()
        updated_chunks = [
            c for c in chunks
            if c.get("doc_id") not in removed_ids and c.get("doc_name") not in removed_filenames
        ]

        # Clean up physical uploaded files
        settings = get_settings()
        uploads_dir = Path(settings.UPLOAD_DIRECTORY)
        for fname in removed_filenames:
            if not fname:
                continue
            fpath = uploads_dir / fname
            if fpath.exists() and fpath.is_file():
                try:
                    fpath.unlink()
                except Exception:
                    pass
            # Also clean up any legacy stem variations on disk
            stem = Path(fname).stem
            ext = Path(fname).suffix
            for match in uploads_dir.glob(f"{stem}*{ext}"):
                if match.is_file():
                    try:
                        match.unlink()
                    except Exception:
                        pass

        self._save_metadata(updated_meta)
        self._save_chunks(updated_chunks)
        return True

    def query_context(self, query: str, top_k: int = 4) -> List[Dict[str, Any]]:
        """Retrieve most relevant semantic chunks for a given marketing directive/query."""
        chunks = self._load_chunks()
        if not chunks:
            return []

        query_vec = self.generate_embedding(query)
        scored_chunks = []

        query_terms = set(re.findall(r"\b\w{3,}\b", query.lower()))

        for chunk in chunks:
            chunk_vec = chunk.get("vector", [])
            cos_sim = self._cosine_similarity(query_vec, chunk_vec)

            # Keyword overlap boost
            chunk_words = set(re.findall(r"\b\w{3,}\b", chunk.get("text", "").lower()))
            overlap = len(query_terms.intersection(chunk_words))
            overlap_bonus = (overlap / (len(query_terms) or 1)) * 0.25

            final_score = cos_sim + overlap_bonus
            scored_chunks.append({
                "doc_name": chunk.get("doc_name", "Document"),
                "chunk_index": chunk.get("chunk_index", 0),
                "text": chunk.get("text", ""),
                "score": round(float(final_score), 4),
            })

        # Sort by relevance score descending
        scored_chunks.sort(key=lambda x: x["score"], reverse=True)
        return scored_chunks[:top_k]

    def synthesize_answer(self, query: str, top_chunks: List[Dict[str, Any]]) -> str:
        """Synthesize a direct, professional AI answer based on retrieved vector chunks."""
        if not top_chunks:
            return "No relevant grounding documents found in vector memory for this query."

        context_passages = "\n\n".join([
            f"--- Document: {c.get('doc_name', 'Document')} (Chunk {c.get('chunk_index', 0)}) ---\n{c.get('text', '')}"
            for c in top_chunks
        ])

        prompt = f"""You are an enterprise Brand & Marketing Intelligence AI assistant.
Based STRICTLY on the grounding context provided below, synthesize a direct, clear, highly informative answer to the user's query.

[User Query]:
{query}

[Grounding Documents Context]:
{context_passages}

Guidelines for your response:
1. Provide a direct, professional, well-structured answer (use bullet points or markdown tables where appropriate).
2. Highlight specific rules, guidelines, hex codes, or key takeaways mentioned in the documents.
3. If the context does not fully answer the query, clearly state what information is available from the documents.
"""
        settings = get_settings()
        # 1. Try Groq Cloud AI first for fast response
        if settings.GROQ_API_KEY:
            try:
                import requests
                headers = {
                    "Authorization": f"Bearer {settings.GROQ_API_KEY}",
                    "Content-Type": "application/json"
                }
                payload = {
                    "model": "openai/gpt-oss-120b",
                    "messages": [
                        {"role": "system", "content": "You are a precise enterprise RAG synthesis engine."},
                        {"role": "user", "content": prompt}
                    ],
                    "temperature": 0.2,
                    "max_tokens": 768
                }
                res = requests.post("https://api.groq.com/openai/v1/chat/completions", headers=headers, json=payload, timeout=8)
                if res.status_code == 200:
                    data = res.json()
                    ans = data['choices'][0]['message']['content'].strip()
                    if ans:
                        return ans
            except Exception:
                pass

        # 2. Try Gemini API as backup
        if settings.GEMINI_API_KEY:
            try:
                from google import genai as gai
                client = gai.Client(api_key=settings.GEMINI_API_KEY)
                for m in [
                    "models/gemini-3.8-flash",
                    "models/gemini-3.7-flash",
                    "models/gemini-3.6-flash",
                    "models/gemini-3.5-flash",
                    "models/gemini-3.5-flash-lite",
                    "models/gemini-3.1-flash-lite",
                    "models/gemini-flash-latest",
                    "gemini-3.8-flash",
                    "gemini-3.6-flash",
                ]:
                    try:
                        res = client.models.generate_content(model=m, contents=prompt)
                        if res and res.text:
                            return res.text.strip()
                    except Exception:
                        continue
            except Exception:
                pass

        # 3. Fallback snippet
        snippet = top_chunks[0].get("text", "")[:300]
        return f"Based on indexed document ({top_chunks[0].get('doc_name')}):\n\n{snippet}..."


# Singleton instance
rag_store = RAGVectorStore()



