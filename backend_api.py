"""
FastAPI backend for LexAI - Connects frontend to RAG system
Run with: uvicorn backend_api:app --reload --port 8000
"""

from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import shutil
import json
import ast
import re
import os
from pathlib import Path

from groq_llm import GroqLLMManager, GroqRAGChain, MODE_PROMPTS
from config import UPLOADS_DIR
import logging

logger = logging.getLogger(__name__)

# Initialize FastAPI
app = FastAPI(title="LexAI API", description="Pakistani Legal RAG System")

# CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global instances
rag_system = None          # full RAG (with retriever) — set after PDF upload
groq_manager = None        # always available — direct Groq access

# ── Normalize mode string from frontend ─────────────────────
def normalize_mode(mode: str) -> str:
    """Convert any mode variant to lowercase key for MODE_PROMPTS."""
    return mode.lower().replace(" mode", "").strip()   # "Student Mode" → "student"

# Request/Response Models
class ChatRequest(BaseModel):
    message: str
    mode: str = "Student"
    session_id: Optional[str] = None

class ChatResponse(BaseModel):
    answer: str
    sources: List[Dict[str, Any]]
    mode_used: str

class UploadResponse(BaseModel):
    filename: str
    status: str
    message: str

class QuizRequest(BaseModel):
    topic: str
    difficulty: str = "Intermediate"
    num_questions: int = 5
    mode: str = "Student"

class QuizQuestion(BaseModel):
    question: str
    options: List[str]
    answer: str
    explanation: str
    source: str

class QuizResponse(BaseModel):
    topic: str
    difficulty: str
    questions: List[QuizQuestion]


def _extract_json_array(text: str):
    """Extract JSON array from model output with multi-layer fallback and validation."""
    if not text:
        raise ValueError("Empty quiz output from model")
    cleaned = text.strip().replace("```json", "").replace("```", "").strip()
    # normalize smart quotes
    cleaned = cleaned.replace("\u201c", '"').replace("\u201d", '"').replace("\u2018", "'").replace("\u2019", "'")
    # quick sanitation of common LLM artifacts
    cleaned = re.sub(r"\n\s*\n", "\n", cleaned)
    cleaned = cleaned.strip()

    logger.debug("[quiz_parse] raw model output:\n%s", cleaned[:400])

    try:
        parsed = json.loads(cleaned)
        if isinstance(parsed, list) and len(parsed) > 0:
            return _validate_and_fix_questions(parsed)
    except Exception:
        pass

    # Attempt to locate common wrapper keys like {"questions": [...]} or {"quiz": [...]} and extract
    wrapper_match = re.search(r"\b(questions|quiz)\b\s*:\s*(\[)", cleaned, flags=re.IGNORECASE)
    if wrapper_match:
        start = cleaned.find("[", wrapper_match.start(2))
        if start != -1:
            # try to extract balanced array from this position
            depth = 0
            in_string = False
            escape = False
            end = -1
            for idx in range(start, len(cleaned)):
                ch = cleaned[idx]
                if escape:
                    escape = False
                    continue
                if ch == "\\":
                    escape = True
                    continue
                if ch == '"':
                    in_string = not in_string
                    continue
                if in_string:
                    continue
                if ch == "[":
                    depth += 1
                elif ch == "]":
                    depth -= 1
                    if depth == 0:
                        end = idx
                        break
            if end != -1:
                candidate = cleaned[start:end + 1]
                candidate = re.sub(r",\s*([}\]])", r"\1", candidate)
                try:
                    parsed = json.loads(candidate)
                    if isinstance(parsed, list) and len(parsed) > 0:
                        return _validate_and_fix_questions(parsed)
                except Exception:
                    pass

    start = cleaned.find("[")
    if start == -1:
        raise ValueError("No JSON array found in output")

    in_string = False
    escape = False
    depth = 0
    end = -1

    for idx in range(start, len(cleaned)):
        ch = cleaned[idx]
        if escape:
            escape = False
            continue
        if ch == "\\":
            escape = True
            continue
        if ch == '"':
            in_string = not in_string
            continue
        if in_string:
            continue
        if ch == "[":
            depth += 1
        elif ch == "]":
            depth -= 1
            if depth == 0:
                end = idx
                break

    if end == -1:
        raise ValueError("Unbalanced JSON array brackets")

    candidate = cleaned[start:end + 1]
    candidate = re.sub(r",\s*([}\]])", r"\1", candidate)

    try:
        parsed = json.loads(candidate)
        if isinstance(parsed, list) and len(parsed) > 0:
            return _validate_and_fix_questions(parsed)
    except Exception:
        pass

    try:
        parsed = ast.literal_eval(candidate)
        if isinstance(parsed, list) and len(parsed) > 0:
            return _validate_and_fix_questions(parsed)
    except Exception:
        pass

    # If candidate uses single quotes for keys/strings, try converting to double quotes safely
    if "'" in candidate and '"' not in candidate:
        try:
            candidate = candidate.replace("'", '"')
        except Exception:
            pass

    # Last-resort: try to parse as newline-separated question blocks
    lines = [l.strip() for l in re.split(r"\n{1,}", cleaned) if l.strip()]
    blocks = []
    current = []
    for ln in lines:
        # naive split on numbered list markers
        if re.match(r"^\d+\.", ln) and current:
            blocks.append(" ".join(current))
            current = [ln]
        else:
            current.append(ln)
    if current:
        blocks.append(" ".join(current))

    if blocks:
        # transform blocks into simple question objects
        simple = []
        for b in blocks:
            parts = re.split(r"\s+-\s+|\n", b)
            q = parts[0]
            opts = [p for p in parts[1:5]] if len(parts) > 1 else []
            while len(opts) < 4:
                opts.append(f"Option {len(opts)+1}")
            simple.append({"question": q, "options": opts, "answer": opts[0], "explanation": "See materials.", "source": "General Pakistani Law"})
        return _validate_and_fix_questions(simple)

    raise ValueError("Unable to parse quiz JSON after all attempts")


def _validate_and_fix_questions(questions: list) -> list:
    """Validate and fix malformed questions to ensure runtime stability."""
    valid = []
    for q in questions:
        if not isinstance(q, dict):
            continue
        try:
            q_text = str(q.get('question', f'Question {len(valid) + 1}')).strip()
            opts = q.get('options', [])
            if not isinstance(opts, list):
                opts = [str(o).strip() for o in str(opts).split(',')]
            opts = [str(o).strip() for o in opts if o][:4]
            while len(opts) < 4:
                opts.append(f'Option {len(opts) + 1}')
            
            answer = str(q.get('answer', opts[0])).strip()
            if answer not in opts:
                answer = opts[0]
            
            expl = str(q.get('explanation', 'Review the source material.')).strip()
            src = str(q.get('source', 'Uploaded documents')).strip()
            
            valid.append({
                'question': q_text,
                'options': opts,
                'answer': answer,
                'explanation': expl,
                'source': src,
            })
        except Exception:
            continue
    
    return valid if valid else [{'question': 'Default Question', 'options': ['Option A', 'Option B', 'Option C', 'Option D'], 'answer': 'Option A', 'explanation': 'Review the material.', 'source': 'Default'}]


def _direct_groq_query(message: str, mode: str) -> dict:
    """
    Call Groq directly — NO retriever, NO vector store.
    Used when no PDFs are uploaded yet.
    """
    mode_key = normalize_mode(mode)
    system_prompt = MODE_PROMPTS.get(mode_key, MODE_PROMPTS["citizen"])

    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user",   "content": message},
    ]

    llm = groq_manager.get_llm()
    response = llm.invoke(messages)
    return {
        "answer": response.content,
        "context_documents": [],
        "context": "",
        "mode": mode_key,
    }


# Initialize Groq on startup (always runs, no PDFs needed)
@app.on_event("startup")
async def startup_event():
    global rag_system, groq_manager
    logger.info("Initializing LexAI...")

    # Always initialize Groq — this never fails without PDFs
    try:
        groq_manager = GroqLLMManager()
        logger.info("Groq LLM ready!")
    except Exception as e:
        logger.error("Groq init failed: %s", e)
        groq_manager = None

    # Try loading vector store if it exists
    try:
        from rag_system import RAGSystem
        from config import VECTOR_STORE_PATH
        if VECTOR_STORE_PATH.exists():
            logger.info("Loading existing vector store...")
            rag_system = RAGSystem(use_groq=True)
            rag_system.initialize_from_saved_vector_store()
            logger.info("Vector store loaded!")
        else:
            logger.warning("No vector store — running in direct Groq mode.")
    except Exception as e:
        logger.warning("Vector store load failed (direct Groq mode active): %s", e)
        rag_system = None


# Health check
@app.get("/api/health")
async def health_check():
    return {
        "status": "healthy",
        "rag_ready": rag_system is not None,
        "groq_ready": groq_manager is not None,
    }

# Get available modes
@app.get("/api/modes")
async def get_modes():
    return {"modes": ["Student", "Lawyer", "Citizen"]}

# Upload PDF endpoint
@app.post("/api/upload")
async def upload_pdf(file: UploadFile = File(...)):
    global rag_system

    if not file.filename:
        raise HTTPException(400, "Missing file name")

    safe_filename = Path(file.filename).name
    if not safe_filename.lower().endswith('.pdf'):
        raise HTTPException(400, "Only PDF files are supported")

    file_path = UPLOADS_DIR / safe_filename
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    pdf_files = list(UPLOADS_DIR.glob("*.pdf"))
    previous_rag_system = rag_system

    try:
        from rag_system import RAGSystem
        new_rag_system = RAGSystem(use_groq=True)
        new_rag_system.initialize_from_pdfs([str(p) for p in pdf_files])
        rag_system = new_rag_system
        return UploadResponse(
            filename=safe_filename,
            status="success",
            message=f"File uploaded and {len(pdf_files)} PDF(s) indexed successfully!"
        )
    except Exception as e:
        rag_system = previous_rag_system
        return UploadResponse(
            filename=safe_filename,
            status="error",
            message=f"File saved but indexing failed: {str(e)}"
        )

# Get list of uploaded PDFs
@app.get("/api/documents")
async def get_documents():
    pdf_files = list(UPLOADS_DIR.glob("*.pdf"))
    return {
        "documents": [
            {"name": f.name, "size_mb": f.stat().st_size / (1024 * 1024)}
            for f in pdf_files
        ]
    }

# ── CHAT ENDPOINT ────────────────────────────────────────────
@app.post("/api/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    """
    Send a message. Works in two modes:
    - No PDFs uploaded → calls Groq directly (fast, ~2-3s)
    - PDFs uploaded    → RAG retrieval + Groq
    """
    if groq_manager is None:
        raise HTTPException(503, "Groq not initialized. Check your GROQ_API_KEY.")

    mode_key = normalize_mode(request.mode)

    try:
        if rag_system is None:
            # ── Direct Groq (no docs) ────────────────────────
            result = _direct_groq_query(request.message, request.mode)
        else:
            # ── RAG + Groq ───────────────────────────────────
            result = rag_system.query(
                question=request.message,
                mode=mode_key,
                show_sources=True,
            )

        # Format sources
        sources = []
        for doc in result.get("context_documents", []):
            sources.append({
                "title": doc.metadata.get("source", "Unknown"),
                "page": doc.metadata.get("page", 0) + 1,
                "excerpt": doc.page_content[:200] + "...",
                "source_url": doc.metadata.get("source", ""),
            })

        return ChatResponse(
            answer=result["answer"],
            sources=sources,
            mode_used=request.mode,
        )

    except Exception as e:
        logger.error("Chat error: %s", e)
        raise HTTPException(500, f"Error processing query: {str(e)}")


# ── QUIZ ENDPOINT ────────────────────────────────────────────
@app.post("/api/quiz", response_model=QuizResponse)
async def generate_quiz(request: QuizRequest):
    """Generate quiz — uses RAG if docs available, else Groq direct."""
    if groq_manager is None:
        raise HTTPException(503, "Groq not initialized. Check your GROQ_API_KEY.")

    mode_key = normalize_mode(request.mode)
    num_questions = max(1, min(request.num_questions, 20))

    prompt = f"""Create a {num_questions}-question multiple-choice quiz on: {request.topic}
Difficulty: {request.difficulty}

Return ONLY a valid JSON array, no prose or markdown. Each item must have exactly:
- question (string)
- options (array of exactly 4 strings)
- answer (must exactly match one of the options)
- explanation (short string)
- source (string, use "General Pakistani Law" if no document source)
\n
IMPORTANT: Append the exact marker <<END_OF_QUIZ>> after the JSON array and nothing else.
"""

    try:
        if rag_system is None:
            result = _direct_groq_query(prompt, request.mode)
        else:
            result = rag_system.query(
                question=prompt,
                mode=mode_key,
                show_sources=False,
            )

        raw_answer = result.get("answer", "")
        # If the model appended our end marker, only parse up to it to avoid truncated tail garbage
        if isinstance(raw_answer, str) and '<<END_OF_QUIZ>>' in raw_answer:
            raw_answer = raw_answer.split('<<END_OF_QUIZ>>')[0]
        logger.debug("[quiz_generate] raw answer preview:\n%s", raw_answer[:600])

        try:
            items = _extract_json_array(raw_answer)
        except Exception:
            logger.debug("[quiz_generate] initial parse failed, attempting repair...")
            repair_prompt = f"""Reformat into ONLY a valid JSON array. Each item needs:
- question, options (4 strings), answer (matches one option), explanation, source
No markdown, no commentary.

Content: {raw_answer}"""
            # Ask the model to append our end marker so we can safely trim responses
            repair_prompt = repair_prompt + "\n\nIMPORTANT: Append the exact marker <<END_OF_QUIZ>> after the JSON array and nothing else."
            if rag_system is None:
                repaired = _direct_groq_query(repair_prompt, request.mode)
            else:
                repaired = rag_system.query(question=repair_prompt, mode=mode_key, show_sources=False)
            repaired_ans = repaired.get("answer", "")
            if isinstance(repaired_ans, str) and '<<END_OF_QUIZ>>' in repaired_ans:
                repaired_ans = repaired_ans.split('<<END_OF_QUIZ>>')[0]
            logger.debug("[quiz_generate] repaired answer preview:\n%s", repaired_ans[:600])
            try:
                items = _extract_json_array(repaired_ans)
            except Exception as e:
                logger.warning("[quiz_generate] repair parse failed: %s", e)
                # fallback to safe default question(s)
                items = _validate_and_fix_questions([])

        questions = []
        for item in items[:num_questions]:
            if not isinstance(item, dict):
                continue
            options = item.get("options", [])
            answer = item.get("answer", "")
            if not isinstance(options, list) or len(options) != 4:
                continue
            if answer not in options:
                continue
            questions.append(QuizQuestion(
                question=str(item.get("question", "")).strip(),
                options=[str(opt) for opt in options],
                answer=str(answer),
                explanation=str(item.get("explanation", "")).strip() or "Based on Pakistani law.",
                source=str(item.get("source", "")).strip() or "General Pakistani Law",
            ))

        if not questions:
            raise ValueError("Model did not return valid quiz questions")

        return QuizResponse(topic=request.topic, difficulty=request.difficulty, questions=questions)

    except Exception as e:
        raise HTTPException(500, f"Quiz generation failed: {str(e)}")


# Delete document endpoint
@app.delete("/api/documents/{filename}")
async def delete_document(filename: str):
    global rag_system
    file_path = UPLOADS_DIR / filename
    if file_path.exists():
        file_path.unlink()

    pdf_files = list(UPLOADS_DIR.glob("*.pdf"))

    if pdf_files:
        from rag_system import RAGSystem
        rag_system = RAGSystem(use_groq=True)
        rag_system.initialize_from_pdfs([str(p) for p in pdf_files])
    else:
        rag_system = None
        logger.warning("All PDFs deleted — back to direct Groq mode.")

    return {"status": "deleted", "remaining": len(pdf_files)}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)