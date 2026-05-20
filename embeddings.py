"""
Embeddings and vector store management.
Handles creating embeddings and storing/retrieving vectors.
"""

import logging
from pathlib import Path
from typing import List

from langchain_huggingface import HuggingFaceEmbeddings
from langchain_community.vectorstores import FAISS, Chroma

from config import (
    EMBEDDING_MODEL_NAME,
    VECTOR_STORE_TYPE,
    VECTOR_STORE_PATH,
    EMBEDDING_DIMENSION,
)

logger = logging.getLogger(__name__)


class EmbeddingManager:
    """Manages embeddings and vector store operations."""

    def __init__(self, model_name: str = EMBEDDING_MODEL_NAME):
        """
        Initialize the embedding manager.

        Args:
            model_name: Name of the embedding model from HuggingFace
        """
        logger.info(f"Initializing embeddings with model: {model_name}")
        self.embeddings = HuggingFaceEmbeddings(model_name=model_name)
        self.vector_store = None
        self.vector_store_path = Path(VECTOR_STORE_PATH)

    def create_vector_store(self, documents: List, store_type: str = VECTOR_STORE_TYPE) -> None:
        """
        Create a vector store from documents.

        Args:
            documents: List of document chunks to embed
            store_type: Type of vector store ("faiss" or "chroma")
        """
        logger.info(f"Creating {store_type} vector store with {len(documents)} documents...")

        if store_type.lower() == "faiss":
            self.vector_store = FAISS.from_documents(documents, self.embeddings)
            self.save_faiss_index()
        elif store_type.lower() == "chroma":
            self.vector_store = Chroma.from_documents(
                documents,
                self.embeddings,
                persist_directory=str(self.vector_store_path),
            )
        else:
            raise ValueError(f"Unknown vector store type: {store_type}")

        logger.info(f"Vector store created successfully")

    def save_faiss_index(self) -> None:
        """Save FAISS vector store to disk."""
        self.vector_store_path.mkdir(parents=True, exist_ok=True)
        self.vector_store.save_local(str(self.vector_store_path))
        logger.info(f"FAISS index saved to {self.vector_store_path}")

    def load_vector_store(self, store_type: str = VECTOR_STORE_TYPE):
        """
        Load an existing vector store from disk.

        Args:
            store_type: Type of vector store to load

        Returns:
            Loaded vector store
        """
        logger.info(f"Loading {store_type} vector store from {self.vector_store_path}...")

        if not self.vector_store_path.exists():
            raise FileNotFoundError(f"Vector store not found at {self.vector_store_path}")

        if store_type.lower() == "faiss":
            self.vector_store = FAISS.load_local(
                str(self.vector_store_path), 
                self.embeddings,
                allow_dangerous_deserialization=True
            )
        elif store_type.lower() == "chroma":
            self.vector_store = Chroma(
                persist_directory=str(self.vector_store_path),
                embedding_function=self.embeddings,
            )
        else:
            raise ValueError(f"Unknown vector store type: {store_type}")

        logger.info(f"Vector store loaded successfully")
        return self.vector_store

    def get_retriever(self, k: int = 3):
        """
        Get a retriever from the vector store.

        Args:
            k: Number of documents to retrieve

        Returns:
            Retriever object
        """
        if self.vector_store is None:
            raise ValueError("Vector store not initialized. Load or create one first.")

        retriever = self.vector_store.as_retriever(search_kwargs={"k": k})
        logger.info(f"Retriever created with k={k}")
        return retriever

    def similarity_search(self, query: str, k: int = 3) -> List:
        """
        Perform similarity search on the vector store.

        Args:
            query: Query string
            k: Number of results to return

        Returns:
            List of similar documents
        """
        if self.vector_store is None:
            raise ValueError("Vector store not initialized.")

        results = self.vector_store.similarity_search(query, k=k)
        logger.info(f"Found {len(results)} similar documents for query: {query[:50]}...")
        return results