"""
AgenticMarketer Backend — RAG Prompts & Post-Processing Sanitizer.
Ensures clean GitHub-Flavored Markdown (GFM) output, eliminates raw HTML tags (<br>),
formats executive summaries with structured sections and bullets, and sanitizes responses.
"""

import re
from typing import List, Dict, Any

RAG_SYSTEM_INSTRUCTION = """You are an enterprise Brand & Marketing Intelligence AI assistant.
Your role is to synthesize direct, highly accurate, and beautifully structured executive intelligence from the provided grounding documents.

STRICT FORMATTING AND SYNTAX RULES:
1. NEVER output raw HTML tags (e.g., <br>, <br/>, <b>, <span>, <div>, <p>) anywhere in your response, especially NOT inside Markdown tables or prose.
2. Rely EXCLUSIVELY on standard GitHub-Flavored Markdown (GFM):
   - PREFER bold structured section headers (e.g., '### Visual Identity & Guidelines') with bulleted lists ('* Item') over dense, multi-line pipe tables when explaining guidelines, multi-part directives, or specifications.
   - If a table is truly necessary for tabular comparisons, ensure every cell contains concise, single-line text without embedded line breaks, raw tags, or multi-paragraph blocks.
3. Keep all sentences fully completed and professional. Do NOT leave incomplete thoughts or trailing sentences.
4. Highlight exact brand rules, design standards, typography, HEX color codes, and quantitative benchmarks found in the context.
5. If the documents do not contain the answer, explicitly state what is and isn't available from the retrieved knowledge base.
"""


def build_rag_synthesis_prompt(query: str, top_chunks: List[Dict[str, Any]]) -> str:
    """Builds grounding context passages and user prompt for RAG synthesis."""
    context_passages = "\n\n".join([
        f"--- Document: {c.get('doc_name', 'Document')} (Chunk {c.get('chunk_index', 0)}) ---\n{c.get('text', '')}"
        for c in top_chunks
    ])

    return f"""[User Query]:
{query}

[Grounding Documents Context]:
{context_passages}

Based STRICTLY on the grounding documents above, synthesize a comprehensive, clean, and professional executive response.
Adhere strictly to GitHub-Flavored Markdown without ANY raw HTML tags (<br>, <b>, etc.).
"""


def sanitize_rag_markdown(text: str) -> str:
    """
    Sanitizes raw AI response before dispatching to client:
    1. Replaces <br>, <br/>, <br /> with standard newline or space separators.
    2. Converts raw HTML bold/italic tags into standard markdown (** and *).
    3. Strips stray raw HTML wrapper tags (<span>, </span>, <div>, </div>).
    4. Fixes broken table rows where <br> was placed inside table pipes.
    """
    if not text:
        return ""

    sanitized = text

    # Handle table pipe rows specifically: if a pipe line contains <br>, replace with space or semicolon
    # to avoid breaking Markdown table structure
    def clean_table_line(match):
        line = match.group(0)
        # In a table row line (| ... |), replace <br> variants with " / " or "; "
        cleaned_line = re.sub(r"<\s*br\s*/?>", " ; ", line, flags=re.IGNORECASE)
        return cleaned_line

    sanitized = re.sub(r"^\|.*\|$", clean_table_line, sanitized, flags=re.MULTILINE)

    # In general prose, convert <br> tags to standard newlines
    sanitized = re.sub(r"<\s*br\s*/?>", "\n", sanitized, flags=re.IGNORECASE)

    # Convert common basic HTML tags into native GFM
    sanitized = re.sub(r"<\s*b\s*>(.*?)<\s*/\s*b\s*>", r"**\1**", sanitized, flags=re.IGNORECASE | re.DOTALL)
    sanitized = re.sub(r"<\s*strong\s*>(.*?)<\s*/\s*strong\s*>", r"**\1**", sanitized, flags=re.IGNORECASE | re.DOTALL)
    sanitized = re.sub(r"<\s*i\s*>(.*?)<\s*/\s*i\s*>", r"*\1*", sanitized, flags=re.IGNORECASE | re.DOTALL)
    sanitized = re.sub(r"<\s*em\s*>(.*?)<\s*/\s*em\s*>", r"*\1*", sanitized, flags=re.IGNORECASE | re.DOTALL)

    # Strip empty or stray span/div tags
    sanitized = re.sub(r"<\s*/?\s*(span|div|p)\b[^>]*>", "", sanitized, flags=re.IGNORECASE)

    # Clean up multiple consecutive blank lines
    sanitized = re.sub(r"\n{3,}", "\n\n", sanitized)

    return sanitized.strip()
