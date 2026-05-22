"""
Groq LLM integration for RAG system.
Replaces Ollama with Groq's free API (Llama 3.3 70B).
"""

import logging
import os
from typing import Optional

from langchain_groq import ChatGroq
from langchain_core.messages import SystemMessage, HumanMessage
from dotenv import load_dotenv

load_dotenv()

from config import TEMPERATURE, MAX_TOKENS, GROQ_MODEL_NAME

logger = logging.getLogger(__name__)


# ─────────────────────────────────────────────
#  MODE-SPECIFIC SYSTEM PROMPTS
#  Each prompt:
#    1. FORBIDS the phrase "context documents don't provide"
#    2. FORBIDS saying "I don't know"
#    3. REQUIRES the model to answer using its own legal knowledge
# ─────────────────────────────────────────────

MODE_PROMPTS = {
    "student": """You are LexAI — a professional Pakistani legal assistant specializing in Pakistani law.

Your expertise covers:
- Pakistan Penal Code (PPC)
- Criminal Procedure Code (CrPC)
- Civil Procedure Code (CPC)
- Constitution of Pakistan
- Qanun-e-Shahadat (Evidence Act)
- Family Law
- Labour Law
- Corporate Law

CORE PRINCIPLES:
1. ALWAYS provide substantive, knowledgeable answers about Pakistani law
2. NEVER hedge or say you don't know — answer with confidence
3. Draw from your extensive training in Pakistani legal statutes, precedents, and procedures
4. If documents are provided, use them as supplementary references, but rely primarily on your knowledge
5. Cite relevant sections and explain their application clearly

Respond professionally and comprehensively to all queries about Pakistani law.

User query:""",

    "lawyer": """You are LexAI — a professional Pakistani legal assistant specializing in Pakistani law.

Your expertise covers:
- Pakistan Penal Code (PPC)
- Criminal Procedure Code (CrPC)
- Civil Procedure Code (CPC)
- Constitution of Pakistan
- Qanun-e-Shahadat (Evidence Act)
- High Court and Supreme Court precedents
- Labour, Commercial, and Family Law

CORE PRINCIPLES:
1. Provide authoritative, detailed analysis of Pakistani legal matters
2. Structure responses: Legal Framework → Applicable Provisions → Case Law → Practical Application
3. Never express uncertainty — draw on your comprehensive knowledge of Pakistani jurisprudence
4. Cite specific sections, articles, and landmark decisions
5. If documents are available, reference them, but prioritize your expert knowledge

Respond as a seasoned legal professional.

User query:""",

    "citizen": """You are LexAI — a professional Pakistani legal assistant specializing in Pakistani law.

Your role is to help ordinary citizens understand their legal rights and obligations under Pakistani law.

Your expertise covers:
- Basic criminal and civil procedures
- Fundamental rights and constitutional protections
- Family law matters (marriage, divorce, inheritance)
- Labour rights and employment law
- Property and tenancy law
- Consumer protection

CORE PRINCIPLES:
1. Explain complex legal concepts in simple, accessible language
2. Always provide clear, actionable guidance
3. NEVER say "I don't know" or "this is outside my expertise" — you are knowledgeable about Pakistani law
4. Use practical examples relevant to Pakistani context
5. Empower citizens by explaining their rights and available remedies

Respond helpfully and confidently about Pakistani legal matters.

User query:""",
}

DEFAULT_SYSTEM_PROMPT = MODE_PROMPTS["citizen"]


class GroqLLMManager:
    """
    Manages Groq LLM configuration and operations.
    Requires GROQ_API_KEY in .env file.
    """

    def __init__(self, model_name: str = None):
        self.model_name = model_name or GROQ_MODEL_NAME
        self.llm = None
        self.api_key = os.getenv("GROQ_API_KEY")

        if not self.api_key:
            raise ValueError(
                "GROQ_API_KEY not found. Please create a .env file with your Groq API key.\n"
                "Get your key from: https://console.groq.com/keys"
            )

        logger.info(f"Groq LLM Manager initialized with model: {self.model_name}")

    def load_model(self) -> None:
        """Load the Groq model."""
        logger.info(f"Loading Groq model: {self.model_name}")

        self.llm = ChatGroq(
            api_key=self.api_key,
            model=self.model_name,
            temperature=TEMPERATURE,
            max_tokens=MAX_TOKENS,
        )

        logger.info(f"Groq model loaded: {self.model_name}")

    def get_llm(self):
        if self.llm is None:
            self.load_model()
        return self.llm

    def invoke_with_system_prompt(self, system_prompt: str, user_message: str) -> str:
        """
        Properly invoke Groq with system and user messages.
        This is the CORRECT way to set the model's behavior.
        """
        llm = self.get_llm()
        
        messages = [
            SystemMessage(content=system_prompt),
            HumanMessage(content=user_message)
        ]
        
        response = llm.invoke(messages)
        return response.content


class GroqRAGChain:
    """
    RAG chain using Groq LLM.
    Compatible with your existing RAGChain interface.
    """

    def __init__(self, llm_manager: GroqLLMManager, retriever):
        self.llm_manager = llm_manager
        self.retriever = retriever
        self._initialize_chain()

    def _initialize_chain(self) -> None:
        logger.info("Initializing Groq RAG chain...")
        logger.info("Groq RAG chain initialized successfully")

    def query(self, question: str, mode: str = "citizen") -> dict:
        """Process a query through the RAG pipeline."""
        return self.query_with_context(question, mode=mode)

    def query_with_context(
        self,
        question: str,
        num_docs: int = 3,
        system_prompt: str = None,
        mode: str = "citizen",
    ) -> dict:
        """
        Process a query with explicit document retrieval.

        Args:
            question:      User's question
            num_docs:      Number of documents to retrieve
            system_prompt: Override system prompt (optional)
            mode:          One of "student" | "lawyer" | "citizen"

        Returns:
            Dictionary with answer, sources, and retrieved documents
        """
        logger.info(f"Processing query | mode={mode} | question={question}")

        # ── 1. Retrieve context ──────────────────────────────────────────
        relevant_docs = []
        context_text = ""
        try:
            relevant_docs = self.retriever.invoke(question)[:num_docs]
            logger.info(f"Retrieved {len(relevant_docs)} documents")
            
            if relevant_docs:
                # Log first 200 chars of first doc for debugging
                logger.info(f"First doc preview: {relevant_docs[0].page_content[:200]}...")
                
                context_text = "\n\n".join(
                    [f"Document {i+1}:\n{doc.page_content}"
                     for i, doc in enumerate(relevant_docs)]
                )
            else:
                logger.warning("No documents retrieved — will rely on model's own knowledge")
                
        except Exception as e:
            logger.warning(f"Retriever error (continuing without context): {e}")

        # ── 2. Pick system prompt ────────────────────────────────────────
        active_system_prompt = (
            system_prompt                          # caller override
            or MODE_PROMPTS.get(mode.lower())      # mode-based
            or DEFAULT_SYSTEM_PROMPT               # absolute fallback
        )

        # ── 3. Build user message (no disclaimers, just the question + context) ──
        if context_text:
            user_message = f"""Here is relevant information from legal documents:

{context_text}

---

User's question: {question}

Answer the question using the documents if they help. If the documents don't fully cover it, use your knowledge of Pakistani law. Just answer — no disclaimers about missing information."""
        else:
            user_message = f"""User's question: {question}

Answer this question using your knowledge of Pakistani law. Be direct and helpful. Do not say you don't have information — you are a legal expert."""

        # ── 4. Call Groq with PROPER system+user messages ─────────────────
        try:
            answer = self.llm_manager.invoke_with_system_prompt(
                system_prompt=active_system_prompt,
                user_message=user_message
            )
        except Exception as e:
            logger.error(f"Groq LLM error: {str(e)}")
            answer = (
                "I'm sorry, I encountered a technical issue while processing your question. "
                "Please try again in a moment."
            )

        return {
            "answer": answer,
            "context_documents": relevant_docs,
            "context": context_text,
            "mode": mode,
        }