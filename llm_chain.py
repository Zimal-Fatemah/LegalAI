"""
LLM chain and RAG pipeline.
Handles integration with local language models and RAG query processing.
"""

import logging
from typing import Optional

from langchain_community.llms import Ollama as OllamaLLM
from langchain_community.llms import LlamaCpp
from langchain_core.prompts import PromptTemplate
from langchain.callbacks.base import CallbackManager
from langchain.callbacks.streaming_stdout import StreamingStdOutCallbackHandler

from config import LLM_MODEL_NAME, LLM_MODEL_PATH, TEMPERATURE, MAX_TOKENS

logger = logging.getLogger(__name__)


class LLMManager:
    """Manages language model loading and configuration."""

    def __init__(self, model_name: str = LLM_MODEL_NAME, use_local_path: bool = False):
        """
        Initialize the LLM manager.

        Args:
            model_name: Model name (for Ollama) or path (for local model)
            use_local_path: If True, load model from local file path
        """
        self.model_name = model_name
        self.llm = None
        self.use_local_path = use_local_path

    def load_ollama_model(self) -> None:
        """Load model using Ollama (requires Ollama server running locally)."""
        logger.info(f"Loading Ollama model: {self.model_name}")

        self.llm = OllamaLLM(
            model=self.model_name,
            temperature=TEMPERATURE,
            num_ctx=2048,  # Context window
        )

        logger.info(f"Ollama model loaded: {self.model_name}")

    def load_local_model(self, model_path: str = None) -> None:
        """
        Load a local GGML model file.

        Args:
            model_path: Path to the GGML model file (.gguf)
        """
        if model_path is None:
            model_path = str(LLM_MODEL_PATH)

        logger.info(f"Loading local model from: {model_path}")

        callback_manager = CallbackManager([StreamingStdOutCallbackHandler()])

        self.llm = LlamaCpp(
            model_path=model_path,
            temperature=TEMPERATURE,
            max_tokens=MAX_TOKENS,
            n_ctx=2048,  # Context window
            callback_manager=callback_manager,
            verbose=False,
        )

        logger.info(f"Local model loaded from: {model_path}")

    def load_model(self) -> None:
        """Load the configured model."""
        if self.use_local_path:
            self.load_local_model()
        else:
            self.load_ollama_model()

    def get_llm(self):
        """Get the loaded LLM instance."""
        if self.llm is None:
            self.load_model()
        return self.llm


class RAGChain:
    """Manages the RAG (Retrieval-Augmented Generation) chain."""

    def __init__(self, llm_manager: LLMManager, retriever):
        """
        Initialize the RAG chain.

        Args:
            llm_manager: Initialized LLMManager instance
            retriever: Vector store retriever
        """
        self.llm_manager = llm_manager
        self.retriever = retriever
        self.qa_chain = None
        self._initialize_chain()

    def _initialize_chain(self) -> None:
        """Initialize the RAG chain."""
        logger.info("Initializing RAG chain...")
        # Chain is built on-the-fly in query_with_context
        logger.info("RAG chain initialized successfully")

    def query(self, question: str) -> dict:
        """
        Process a query through the RAG pipeline.

        Args:
            question: User's question

        Returns:
            Dictionary with answer and source documents
        """
        return self.query_with_context(question)

    def query_with_context(self, question: str, num_docs: int = 3) -> dict:
        """
        Process a query with explicit document retrieval.

        Args:
            question: User's question
            num_docs: Number of documents to retrieve

        Returns:
            Dictionary with answer, sources, and retrieved documents
        """
        logger.info(f"Processing query with {num_docs} context documents: {question}")

        # Retrieve relevant documents
        relevant_docs = self.retriever.invoke(question)[:num_docs]

        # Format context
        context = "\n\n".join([f"Document {i+1}:\n{doc.page_content}" 
                                for i, doc in enumerate(relevant_docs)])

        # Create prompt with context
        rag_template = """You are a helpful assistant. Use the following context to answer the question.
If you don't know the answer based on the context, say "I don't know based on the provided context."

Context:
{context}

Question: {question}

Answer:"""

        prompt = rag_template.format(context=context, question=question)

        # Get answer from LLM
        try:
            llm = self.llm_manager.get_llm()
            answer = llm.invoke(prompt)
        except Exception as e:
            logger.warning(f"LLM error (Ollama not running?): {str(e)}")
            answer = f"[Retrieved {len(relevant_docs)} relevant documents - LLM unavailable]\n\n" + context

        return {
            "answer": answer,
            "context_documents": relevant_docs,
            "context": context,
        }