"""
Utility functions and helpers for RAG system.
"""

import logging
from pathlib import Path
from typing import List, Tuple

logger = logging.getLogger(__name__)


class PDFValidator:
    """Validates and checks PDF files."""

    @staticmethod
    def validate_pdf(pdf_path: str) -> Tuple[bool, str]:
        """
        Validate if a file is a valid PDF.

        Args:
            pdf_path: Path to PDF file

        Returns:
            Tuple of (is_valid, message)
        """
        path = Path(pdf_path)

        if not path.exists():
            return False, f"File not found: {pdf_path}"

        if not path.suffix.lower() == ".pdf":
            return False, f"File is not a PDF: {pdf_path}"

        if path.stat().st_size == 0:
            return False, f"PDF file is empty: {pdf_path}"

        if path.stat().st_size > 500 * 1024 * 1024:  # 500 MB limit
            return False, f"PDF file too large (>500MB): {pdf_path}"

        return True, "Valid PDF"

    @staticmethod
    def validate_pdfs(pdf_paths: List[str]) -> Tuple[List[str], List[str]]:
        """
        Validate multiple PDFs.

        Args:
            pdf_paths: List of PDF paths

        Returns:
            Tuple of (valid_paths, error_paths)
        """
        valid = []
        errors = []

        for pdf_path in pdf_paths:
            is_valid, message = PDFValidator.validate_pdf(pdf_path)
            if is_valid:
                valid.append(pdf_path)
                logger.info(f"✓ {pdf_path}")
            else:
                errors.append(f"{pdf_path}: {message}")
                logger.warning(f"✗ {message}")

        return valid, errors


class VectorStoreManager:
    """Manages vector store operations."""

    @staticmethod
    def get_store_size(store_path: str) -> str:
        """
        Get total size of vector store.

        Args:
            store_path: Path to vector store

        Returns:
            Human-readable size string
        """
        total_size = 0
        path = Path(store_path)

        if not path.exists():
            return "0 B"

        for file in path.rglob("*"):
            if file.is_file():
                total_size += file.stat().st_size

        # Convert bytes to human readable format
        for unit in ["B", "KB", "MB", "GB"]:
            if total_size < 1024:
                return f"{total_size:.2f} {unit}"
            total_size /= 1024

        return f"{total_size:.2f} TB"

    @staticmethod
    def clear_store(store_path: str) -> bool:
        """
        Delete vector store.

        Args:
            store_path: Path to vector store

        Returns:
            True if successful, False otherwise
        """
        import shutil

        path = Path(store_path)

        if not path.exists():
            logger.warning(f"Vector store not found: {store_path}")
            return False

        try:
            shutil.rmtree(path)
            logger.info(f"Vector store deleted: {store_path}")
            return True
        except Exception as e:
            logger.error(f"Error deleting vector store: {e}")
            return False


class QueryOptimizer:
    """Optimizes queries for better results."""

    @staticmethod
    def expand_query(query: str) -> List[str]:
        """
        Generate related queries to improve retrieval.

        Args:
            query: Original query

        Returns:
            List of expanded queries
        """
        variations = [
            query,
            f"Tell me about: {query}",
            f"Explain {query}",
            f"What is {query}?",
            f"How to {query}?",
        ]
        return [q.strip() for q in variations]

    @staticmethod
    def clean_query(query: str) -> str:
        """
        Clean and normalize query string.

        Args:
            query: Raw query string

        Returns:
            Cleaned query
        """
        # Remove extra whitespace
        query = " ".join(query.split())

        # Remove special characters but keep meaningful ones
        query = query.replace("?", " ").replace("!", " ")

        return query.strip()


class ResultFormatter:
    """Formats RAG results for display."""

    @staticmethod
    def format_answer(answer: str, max_length: int = None) -> str:
        """
        Format answer for display.

        Args:
            answer: Raw answer text
            max_length: Maximum length (None for unlimited)

        Returns:
            Formatted answer
        """
        # Clean up whitespace
        answer = " ".join(answer.split())

        if max_length and len(answer) > max_length:
            answer = answer[:max_length] + "..."

        return answer

    @staticmethod
    def format_sources(documents: List, max_docs: int = 5) -> str:
        """
        Format source documents for display.

        Args:
            documents: List of source documents
            max_docs: Maximum documents to show

        Returns:
            Formatted sources string
        """
        output = "Sources:\n"

        for i, doc in enumerate(documents[:max_docs], 1):
            metadata = doc.metadata
            page = metadata.get("page", "?")
            source = metadata.get("source", "Unknown")

            output += f"{i}. {Path(source).name} (Page {page})\n"
            output += f"   {doc.page_content[:100]}...\n"

        if len(documents) > max_docs:
            output += f"\n... and {len(documents) - max_docs} more sources"

        return output


# Experimental: Query rewriting with LLM
class LLMQueryRewriter:
    """Uses LLM to rewrite queries for better retrieval."""

    def __init__(self, llm):
        """Initialize with LLM instance."""
        self.llm = llm

    def rewrite_query(self, query: str) -> str:
        """
        Rewrite query using LLM.

        Args:
            query: Original query

        Returns:
            Rewritten query optimized for retrieval
        """
        prompt = f"""Rewrite the following question to be more specific and searchable in a document database.
Make it concise and include key terms.

Original question: {query}

Rewritten question:"""

        rewritten = self.llm(prompt)
        return rewritten.strip()
