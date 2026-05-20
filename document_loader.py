"""
Document loader and preprocessor for PDF files.
Handles loading, splitting, and cleaning PDF documents.
"""

import logging
from pathlib import Path
from typing import List

from langchain_community.document_loaders import PyPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter

from config import CHUNK_SIZE, CHUNK_OVERLAP, PDF_UPLOADS_PATH

logger = logging.getLogger(__name__)


class DocumentLoader:
    """Loads and processes PDF documents."""

    def __init__(self, chunk_size: int = CHUNK_SIZE, chunk_overlap: int = CHUNK_OVERLAP):
        """
        Initialize the document loader.

        Args:
            chunk_size: Size of text chunks for splitting
            chunk_overlap: Overlap between chunks for context preservation
        """
        self.chunk_size = chunk_size
        self.chunk_overlap = chunk_overlap
        self.text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=chunk_size,
            chunk_overlap=chunk_overlap,
            separators=["\n\n", "\n", " ", ""],
        )

    def load_pdf(self, pdf_path: str) -> List:
        """
        Load a PDF file and return its documents.

        Args:
            pdf_path: Path to the PDF file

        Returns:
            List of loaded documents
        """
        logger.info(f"Loading PDF: {pdf_path}")

        if not Path(pdf_path).exists():
            raise FileNotFoundError(f"PDF file not found: {pdf_path}")

        loader = PyPDFLoader(pdf_path)
        documents = loader.load()

        logger.info(f"Loaded {len(documents)} pages from {Path(pdf_path).name}")
        return documents

    def split_documents(self, documents: List) -> List:
        """
        Split documents into smaller chunks.

        Args:
            documents: List of documents to split

        Returns:
            List of document chunks
        """
        logger.info(f"Splitting {len(documents)} documents into chunks...")

        chunks = self.text_splitter.split_documents(documents)

        logger.info(f"Created {len(chunks)} chunks (size={self.chunk_size}, overlap={self.chunk_overlap})")
        return chunks

    def load_and_split_pdf(self, pdf_path: str) -> List:
        """
        Load a PDF and split into chunks in one operation.

        Args:
            pdf_path: Path to the PDF file

        Returns:
            List of document chunks ready for embedding
        """
        documents = self.load_pdf(pdf_path)
        chunks = self.split_documents(documents)
        return chunks

    @staticmethod
    def get_pdfs_in_folder(folder_path: str = None) -> List[str]:
        """
        Get all PDF files in a folder.

        Args:
            folder_path: Path to folder (uses default uploads path if None)

        Returns:
            List of PDF file paths
        """
        if folder_path is None:
            folder_path = PDF_UPLOADS_PATH

        folder = Path(folder_path)
        pdf_files = list(folder.glob("*.pdf"))

        logger.info(f"Found {len(pdf_files)} PDF files in {folder_path}")
        return [str(pdf) for pdf in pdf_files]
