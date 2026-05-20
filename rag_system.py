"""
Main RAG system orchestrator.
Ties together document loading, embeddings, and LLM components.
Supports both Groq (cloud) and Ollama (local) backends.
"""

import logging
from pathlib import Path
from typing import List, Optional

from document_loader import DocumentLoader
from embeddings import EmbeddingManager
from config import VECTOR_STORE_TYPE, MODE_PROMPTS, TOP_K_DOCUMENTS

# Try to import Groq, fall back to Ollama if not available
try:
    from groq_llm import GroqLLMManager, GroqRAGChain
    GROQ_AVAILABLE = True
except ImportError:
    GROQ_AVAILABLE = False
    from llm_chain import LLMManager, RAGChain

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)


class RAGSystem:
    """Main RAG system that orchestrates all components."""

    def __init__(self, use_groq: bool = True, use_local_model: bool = False):
        """
        Initialize the RAG system.

        Args:
            use_groq: If True, use Groq API (recommended). If False, use Ollama.
            use_local_model: If True and use_groq=False, load model from local file path.
        """
        logger.info(f"Initializing RAG System (use_groq={use_groq})...")

        self.document_loader = DocumentLoader()
        self.embedding_manager = EmbeddingManager()
        self.use_groq = use_groq
        self.rag_chain = None

        # Initialize LLM based on choice
        if use_groq and GROQ_AVAILABLE:
            logger.info("Using Groq LLM (cloud)...")
            self.llm_manager = GroqLLMManager()
        else:
            if use_groq and not GROQ_AVAILABLE:
                logger.warning("Groq not available. Falling back to Ollama.")
            logger.info("Using Ollama LLM (local)...")
            self.llm_manager = LLMManager(use_local_path=use_local_model)

    def initialize_from_pdfs(self, pdf_paths: List[str]) -> None:
        """
        Initialize the RAG system with PDF documents.

        Args:
            pdf_paths: List of paths to PDF files
        """
        logger.info(f"Initializing RAG from {len(pdf_paths)} PDF(s)...")

        # Load and split all PDFs
        all_chunks = []
        for pdf_path in pdf_paths:
            chunks = self.document_loader.load_and_split_pdf(pdf_path)
            all_chunks.extend(chunks)

        logger.info(f"Total chunks to embed: {len(all_chunks)}")

        # Create vector store
        self.embedding_manager.create_vector_store(all_chunks, store_type=VECTOR_STORE_TYPE)

        # Initialize RAG chain
        retriever = self.embedding_manager.get_retriever(k=TOP_K_DOCUMENTS)
        self._init_rag_chain(retriever)

        logger.info("RAG System initialized successfully!")

    def initialize_from_saved_vector_store(self) -> None:
        """Initialize RAG system from previously saved vector store."""
        logger.info("Initializing RAG from saved vector store...")

        # Load vector store
        self.embedding_manager.load_vector_store(store_type=VECTOR_STORE_TYPE)

        # Initialize RAG chain
        retriever = self.embedding_manager.get_retriever(k=TOP_K_DOCUMENTS)
        self._init_rag_chain(retriever)

        logger.info("RAG System initialized from saved vector store!")

    def _init_rag_chain(self, retriever) -> None:
        """Initialize the appropriate RAG chain based on LLM choice."""
        if self.use_groq and GROQ_AVAILABLE:
            self.rag_chain = GroqRAGChain(self.llm_manager, retriever)
        else:
            self.rag_chain = RAGChain(self.llm_manager, retriever)

    def add_documents(self, pdf_paths: List[str]) -> None:
        """
        Add new documents to existing vector store.

        Args:
            pdf_paths: List of paths to new PDF files
        """
        if self.embedding_manager.vector_store is None:
            raise ValueError("Vector store not initialized. Call initialize_from_pdfs first.")

        logger.info(f"Adding {len(pdf_paths)} new PDF(s) to vector store...")

        # Load and split new PDFs
        all_chunks = []
        for pdf_path in pdf_paths:
            chunks = self.document_loader.load_and_split_pdf(pdf_path)
            all_chunks.extend(chunks)

        # Add to existing vector store
        self.embedding_manager.vector_store.add_documents(all_chunks)

        logger.info(f"Added {len(all_chunks)} new chunks to vector store")

    def query(self, question: str, mode: str = None, show_sources: bool = True) -> dict:
        """
        Query the RAG system.

        Args:
            question: The question to ask
            mode: Optional mode - "Student Mode", "Teacher Mode", or "Lawyer Mode"
            show_sources: If True, return source documents used for the answer

        Returns:
            Dictionary with answer and optionally source documents
        """
        if self.rag_chain is None:
            raise ValueError("RAG chain not initialized. Initialize system first.")

        logger.info(f"Query: {question} (mode={mode})")

        # Get system prompt for the selected mode
        system_prompt = None
        if mode and mode in MODE_PROMPTS:
            system_prompt = MODE_PROMPTS[mode]
            logger.info(f"Using mode: {mode}")

        # Use Groq RAG chain or Ollama RAG chain
        if self.use_groq and GROQ_AVAILABLE:
            result = self.rag_chain.query_with_context(question, system_prompt=system_prompt)
        else:
            # Ollama version doesn't support system_prompt directly
            result = self.rag_chain.query_with_context(question)

        if show_sources:
            logger.info("\n--- Answer ---")
            logger.info(result["answer"])
            logger.info("\n--- Sources ---")
            for i, doc in enumerate(result["context_documents"]):
                source = doc.metadata.get("source", "Unknown")
                page = doc.metadata.get("page", 0) + 1
                logger.info(f"Source {i+1}: {source} (page {page})")
                logger.info(f"Content: {doc.page_content[:200]}...\n")

        return result

    def batch_query(self, questions: List[str], mode: str = None, show_sources: bool = False) -> List[dict]:
        """
        Process multiple queries.

        Args:
            questions: List of questions
            mode: Mode to use for all queries ("Student Mode", "Teacher Mode", "Lawyer Mode")
            show_sources: If True, return source documents

        Returns:
            List of results
        """
        logger.info(f"Processing batch of {len(questions)} queries...")

        results = []
        for i, question in enumerate(questions, 1):
            logger.info(f"\n[{i}/{len(questions)}] {question}")
            result = self.query(question, mode=mode, show_sources=show_sources)
            results.append(result)

        return results


# ============================================
# Mode-Specific Helper Methods
# ============================================

class LawRAGSystem(RAGSystem):
    """
    Extended RAG system with mode-specific methods for legal use cases.
    Inherits from RAGSystem and adds convenience methods for Student/Teacher/Lawyer modes.
    """

    def student_query(self, question: str) -> dict:
        """
        Query in Student Mode - Strictly limited to PDF context only.
        No external knowledge or LLM memory allowed.
        """
        return self.query(question, mode="Student Mode")

    def teacher_query(self, question: str) -> dict:
        """
        Query in Teacher Mode - PDF context + internal knowledge for exam creation.
        """
        return self.query(question, mode="Teacher Mode")

    def lawyer_query(self, question: str) -> dict:
        """
        Query in Lawyer Mode - PDF context + legal knowledge for case analysis.
        """
        return self.query(question, mode="Lawyer Mode")

    def generate_case_brief(self, case_text: str) -> dict:
        """
        Generate a legal case brief from case text or PDF content.
        """
        prompt = f"""Generate a concise legal brief and summary outlining the facts of this case:

{case_text}

Provide:
1. Case name and citation (if available)
2. Key facts
3. Legal issues
4. Court's reasoning
5. Decision/Outcome
6. Significance (if any)"""
        
        return self.query(prompt, mode="Lawyer Mode")

    def generate_quiz(self, topic: str, num_questions: int = 5) -> dict:
        """
        Generate a quiz based on the loaded documents.
        """
        prompt = f"""Based strictly on the provided document context, generate {num_questions} multiple choice questions for a student quiz.

For each question, provide:
- The question text
- Four options (A, B, C, D)
- The correct answer

Format as JSON array:
[
  {{
    "question": "Question text",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "answer": "The correct option text"
  }}
]

Topic: {topic}"""
        
        return self.query(prompt, mode="Student Mode")