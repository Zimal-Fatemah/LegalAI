"""
Configuration settings for the RAG system.
"""

import os
from pathlib import Path
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Project directories
PROJECT_DIR = Path(__file__).parent
DATA_DIR = PROJECT_DIR / "data"
MODELS_DIR = PROJECT_DIR / "models"
UPLOADS_DIR = DATA_DIR / "uploads"

# Create directories if they don't exist
DATA_DIR.mkdir(exist_ok=True)
MODELS_DIR.mkdir(exist_ok=True)
UPLOADS_DIR.mkdir(exist_ok=True)

# ============================================
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
INTERNAL_API_KEY = os.getenv("INTERNAL_API_KEY")
ALLOWED_ORIGINS = [
    origin.strip()
    for origin in os.getenv("ALLOWED_ORIGINS", "").split(",")
    if origin.strip()
]

# config.py
# GROQ (cloud) settings
TEMPERATURE = 0.3
GROQ_MAX_TOKENS = 8192
GROQ_MODEL_NAME = "llama-3.3-70b-versatile"  # or "mixtral-8x7b-32768"  # Latest Llama 3.3 70B (recommended) # Options: llama3-70b-8192, llama3-8b-8192, mixtral-8x7b-32768

# ============================================
# LLM Configuration - Local (Fallback)
# ============================================
# For local development (requires Ollama running)
LLM_MODEL_NAME = "mistral"  # Change to your Ollama model name
LLM_MODEL_PATH = MODELS_DIR / "model"
LOCAL_MAX_TOKENS = 512

# ============================================
# Embedding Configuration
# ============================================
EMBEDDING_MODEL_NAME = "sentence-transformers/all-MiniLM-L6-v2"
EMBEDDING_DIMENSION = 384

# ============================================
# Vector Store Configuration
# ============================================
# Options: "faiss", "chroma", "supabase"
# Change this line
VECTOR_STORE_TYPE = "chroma"  # Was "faiss" - much faster for large document sets  # Change to "supabase" for cloud deployment
VECTOR_STORE_PATH = DATA_DIR / "vector_store"

# Supabase Configuration (for pgvector)
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY")
SUPABASE_TABLE_NAME = "documents"  # Table for storing embeddings

# ============================================
# Document Processing Configuration
# ============================================
CHUNK_SIZE = 500
CHUNK_OVERLAP = 50
PDF_UPLOADS_PATH = UPLOADS_DIR

# ============================================
# Retrieval Configuration
# ============================================
TOP_K_DOCUMENTS = 3  # Number of documents to retrieve for context
SIMILARITY_THRESHOLD = 0.3  # Minimum similarity score for document retrieval

# Select MAX_TOKENS based on available configuration (cloud vs local)
MAX_TOKENS = GROQ_MAX_TOKENS if GROQ_API_KEY else LOCAL_MAX_TOKENS

# ============================================
# ============================================
MODE_PROMPTS = {
    "Student Mode": """You are a helpful legal assistant for law students. 
YOUR PRIMARY RULE: Base your answer ONLY on the provided document context.
CRITICAL: The information may be scattered across multiple sections or pages. You must SYNTHESIZE and CONNECT the relevant information from the context to answer the question.
DO NOT use outside knowledge or your own training data.
DO NOT make up facts or citations not found in the context.
If the context contains information that partially answers the question, provide that information honestly.
If the context has NO relevant information at all, say: "Based on the provided documents, I cannot find information about this topic."

Examples of GOOD responses:
- "According to the Pakistan Penal Code sections in the context, theft is defined in Section 378 as..."
- "The Constitution (Article 199) grants the High Court jurisdiction to issue writs including habeas corpus, mandamus, and certiorari..."

Examples of BAD responses:
- "The document index holds no verified record" (when the information IS present but scattered)

Now answer the user's question based strictly on the context below.""",

    "Teacher Mode": """You are an Academic Professor.
HYBRID ACCESS RULE: Use the provided PDF context content to summarize topics or create notes.
HOWEVER, if the user asks you to prepare or formulate an EXAM, you are explicitly authorized to use your
INTERNAL MEMORY and educational knowledge base to write complete, rigorous test scripts.""",

    "Lawyer Mode": """You are an AI Legal Case Analyst assisting in professional legal work.
Your task is to perform an objective, standard legal analysis of the provided case data context.
Review the facts neutrally. Using your internal background memory regarding constitutional principles,
statutes, and criminal procedure code, outline how standard legal defense concepts are structured.
Maintain an objective, analytical, and professional tone."""
}
