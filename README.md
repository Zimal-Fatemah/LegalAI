# ⚖️ LegalAI — Pakistani Legal Research & Study Assistant

![FastAPI](https://img.shields.io/badge/FastAPI-005571?style=for-the-badge&logo=fastapi)
![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Groq](https://img.shields.io/badge/Groq-f37626?style=for-the-badge&logo=groq&logoColor=white)
![Vercel](https://img.shields.io/badge/Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white)
![Railway](https://img.shields.io/badge/Railway-131415?style=for-the-badge&logo=railway&logoColor=white)

> An AI-powered, Retrieval-Augmented Generation (RAG) assistant built to make Pakistani jurisprudence searchable, understandable, and testable. 

**[Live Demo](https://legal-puc60b072-zimalfatemahh-8355s-projects.vercel.app)** | **[Report a Bug](https://github.com/Zimal-Fatemah/LegalAI/issues)**

---

## 📖 Overview

Navigating statutory frameworks and case law is traditionally bottlenecked by the manual review of massive, dense PDF texts. **LegalAI** transforms static legal documents into an interactive knowledge base. 

Designed for Pakistani law students, legal researchers, and citizens, the platform allows users to upload local legal documents, query them via natural language, and generate highly targeted multiple-choice revision quizzes based strictly on the ingested material.

Uploading 2026-05-20 23-24-52.mp4…




## ✨ Key Features

* 📄 **Dynamic Document Ingestion:** Upload any legal PDF; the backend automatically chunks, embeds, and indexes the text into a localized Vector Store.
* 💬 **Persona-Driven RAG Chat:** Ask questions and receive answers grounded *exclusively* in your uploaded texts. Features three distinct response personas:
  * **Student Mode:** Explains concepts with an emphasis on core principles and memorization.
  * **Lawyer Mode:** Generates formal, strictly cited, professional interpretations.
  * **Citizen Mode:** Translates dense legalese into plain, accessible language.
* 🧠 **Automated Quiz Synthesis:** Instantly spin up N-question multiple-choice tests from the uploaded PDFs to test comprehension, complete with automated grading and legal source citations.
* 🛡️ **Production-Ready Guardrails:** Engineered with strict CORS policies, IP-based sliding-window rate limiting (`429`), and internal API header verification.

---

## 🏛️ System Architecture 

The application follows a clean, decoupled **Client-Server Architecture**:

```text
  ┌─────────────────┐             ┌───────────────────┐
  │ React UI        │ ──(HTTPS)──►│ FastAPI Backend   │
  │ (Vercel)        │◄──(REST)────│ (Railway Container)│
  └─────────────────┘             └─────────┬─────────┘
                                            │
                                    (LangChain / Embeddings)
                                            │
                                            ▼
                                  ┌───────────────────┐
                                  │ Local Vector DB   │
                                  └─────────┬─────────┘
                                            │ (Relevant Chunks)
                                            ▼
                                  ┌───────────────────┐
                                  │  Groq Cloud LPU   │
                                  │  (Mixtral/Llama3) │
                                  └───────────────────┘
```

### Tech Stack Matrix

| Layer | Technology | Purpose |
| :--- | :--- | :--- |
| **Frontend** | React, Vite | Responsive Single Page Application (SPA) |
| **Backend** | FastAPI, Python 3.11+ | Async API routing, validation, file management |
| **AI / NLP** | Groq API, LangChain | High-speed LLM inference & Vector similarity search |
| **Persistence**| Custom Vector Store | In-memory/Disk document embedding storage |
| **Deployment** | Vercel & Railway | Edge-rendered client + Containerized Python host |

---

## 🚀 Quickstart (Local Development)

### Prerequisites
* Python 3.10+
* Node.js 18+
* A valid [Groq API Key](https://console.groq.com/)

### 1. Clone the repository
```bash
git clone [https://github.com/Zimal-Fatemah/LegalAI.git](https://github.com/Zimal-Fatemah/LegalAI.git)
cd LegalAI
```

### 2. Backend Setup
Open a terminal and navigate to your backend directory:

```bash
# Create and activate virtual environment
python -m venv .venv
source .venv/bin/activate  # On Windows use: .venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Create environment file
touch .env
```
Inside `.env`, declare the following:
```env
GROQ_API_KEY="gsk_your_actual_api_key_here"
INTERNAL_API_KEY="your_custom_secret_passphrase"
ALLOWED_ORIGINS="http://localhost:5173,http://localhost:3000"
```
Boot the server:
```bash
uvicorn main:app --reload --port 8000
```

### 3. Frontend Setup
Open a *second* terminal window:

```bash
cd frontend # (or your specific React folder name)
npm install
```
Create a `.env.local` file in the frontend root:
```env
VITE_API_BASE_URL="http://localhost:8000"
VITE_INTERNAL_API_KEY="your_custom_secret_passphrase"
```
Start the development server:
```bash
npm run dev
```
*Visit `http://localhost:5173` in your browser.*

---

## ⚡ API Endpoint Reference

The backend exposes an async REST API. *(Requires the `X-API-Key` header for secure routes)*:

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/health` | Diagnostic check; returns RAG and Groq subsystem readiness |
| `POST` | `/api/upload` | Accepts a `.pdf` file (`multipart/form-data`) and re-indexes the Vector Store |
| `GET` | `/api/documents` | Returns a list of currently indexed legal PDF documents |
| `POST` | `/api/chat` | Accepts a prompt + Persona; returns an LLM response and cited source excerpts |
| `POST` | `/api/quiz` | Generates a structured JSON multiple-choice quiz based on active documents |

---

## 🔮 Roadmap

- [ ] **Urdu Language Support:** Native language ingestion and LLM output parsing.
- [ ] **Cloud Vector DB Migration:** Move from local vector storage to persistent Pinecone / Qdrant.
- [ ] **Citation Highlighting:** Auto-scroll the frontend PDF viewer to the exact page referenced by the AI.

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
