# Local RAG System

A clean, modular Python implementation of a Retrieval-Augmented Generation (RAG) system with local LLM support.

## 📋 Project Structure

```
LOCAL RAG/
├── config.py                 # Configuration settings
├── document_loader.py        # PDF loading and preprocessing
├── embeddings.py             # Vector embeddings and storage
├── llm_chain.py              # LLM integration and RAG chain
├── rag_system.py             # Main RAG orchestrator
├── main.py                   # Entry point
├── requirements.txt          # Dependencies
└── data/
    ├── uploads/              # Place your PDFs here
    └── vector_store/         # Cached vector embeddings
```

## 🚀 Quick Start

### 1. **Install Dependencies**

```bash
pip install -r requirements.txt
```

### 2. **Prepare Your Documents**

**⚠️ Step 1: Upload Your PDF Files**

Place your PDF files in the `data/uploads/` directory:

```
LOCAL RAG/
└── data/
    └── uploads/
        ├── document1.pdf
        ├── document2.pdf
        └── ...
```

### 3. **Configure LLM**

Choose your LLM setup in `config.py`:

#### Option A: Using Ollama (Recommended for ease)

1. Download and install [Ollama](https://ollama.ai/)
2. Run Ollama server: `ollama serve`
3. Pull a model: `ollama pull mistral`
4. In `main.py`, set: `rag_system = RAGSystem(use_local_model=False)`

#### Option B: Using Local Model File

**⚠️ Step 2: Upload Your Local Model**

1. Place your GGUF model file in `models/` directory:
```
LOCAL RAG/
└── models/
    └── model.gguf  (or your model name)
```

2. Update `config.py`:
```python
LLM_MODEL_PATH = MODELS_DIR / "your_model.gguf"
```

3. In `main.py`, set: `rag_system = RAGSystem(use_local_model=True)`

### 4. **Run the System**

```bash
# Interactive mode
python main.py

# Programmatic mode
python main.py --example
```

## 📖 Usage

### Interactive Mode

```bash
python main.py
```

The system will:
1. Check for existing vector store, or ask you to select PDFs
2. Load documents and create embeddings
3. Launch interactive query interface

**Commands:**
- Ask questions naturally
- Type `new` to add more PDFs
- Type `exit` to quit

### Programmatic Mode

```python
from rag_system import RAGSystem
from config import PDF_UPLOADS_PATH

# Initialize system (False = use Ollama, True = use local model file)
rag = RAGSystem(use_local_model=False)

# Load PDFs
pdf_files = [
    str(PDF_UPLOADS_PATH / "document1.pdf"),
    str(PDF_UPLOADS_PATH / "document2.pdf"),
]
rag.initialize_from_pdfs(pdf_files)

# Query
result = rag.query("What is the main topic?", show_sources=True)
print(result["answer"])

# Batch queries
questions = ["What is X?", "Explain Y?", "How to Z?"]
results = rag.batch_query(questions)
```

## ⚙️ Configuration

Edit `config.py` to customize:

```python
# LLM Settings
LLM_MODEL_NAME = "mistral"           # For Ollama
LLM_MODEL_PATH = MODELS_DIR / "..."  # For local model file
TEMPERATURE = 0.7                     # 0=deterministic, 1=creative
MAX_TOKENS = 512                      # Max response length

# Embedding Settings
EMBEDDING_MODEL_NAME = "sentence-transformers/all-MiniLM-L6-v2"

# Document Processing
CHUNK_SIZE = 500          # Characters per chunk
CHUNK_OVERLAP = 50        # Overlap between chunks

# Retrieval
TOP_K_DOCUMENTS = 3       # Documents retrieved per query
```

## 📦 How It Works

### 1. **Document Loading** (`document_loader.py`)
   - Loads PDF files using PyPDF
   - Splits documents into overlapping chunks
   - Preserves context across pages

### 2. **Embeddings** (`embeddings.py`)
   - Converts text chunks to vector embeddings
   - Stores in FAISS or Chroma vector database
   - Enables semantic similarity search

### 3. **Retrieval** (in chain)
   - Converts user query to embedding
   - Finds most similar document chunks
   - Returns top-K relevant documents

### 4. **Generation** (`llm_chain.py`)
   - Combines retrieved context with query
   - Sends to local LLM
   - LLM generates answer grounded in context

### 5. **RAG Chain** (`rag_system.py`)
   - Orchestrates all components
   - Handles batch processing
   - Manages vector store persistence

## 🔧 Troubleshooting

### Issue: "Model not found"
- For Ollama: Ensure server is running (`ollama serve`)
- For local: Verify model path in `config.py`

### Issue: "No documents found in uploads"
- Place PDFs in `data/uploads/` directory
- Restart the script

### Issue: Memory/Speed issues
- Reduce `CHUNK_SIZE` in config.py
- Use `TOP_K_DOCUMENTS = 1 or 2`
- Use smaller embedding model

### Issue: Vectorstore not loading
- Delete `data/vector_store/` directory
- Reinitialize with PDFs

## 📝 Models to Try

### Ollama Models
- `mistral` - Fast, good quality
- `llama2` - Versatile
- `neural-chat` - Optimized for Q&A

### Local GGUF Models
Download from [HuggingFace](https://huggingface.co/):
- `mistral-7b.gguf`
- `llama-2-7b.gguf`
- `neural-chat-7b.gguf`

## 📌 Next Steps After Initial Setup

1. Test with your PDFs
2. Fine-tune `CHUNK_SIZE` based on document length
3. Experiment with different embedding models
4. Try different LLM models for quality
5. Adjust `TOP_K_DOCUMENTS` based on results

## 🆘 Getting Help

Check the logs for detailed error information:
```python
import logging
logging.basicConfig(level=logging.DEBUG)  # In main.py
```

## 📚 Resources

- [LangChain Documentation](https://python.langchain.com/)
- [FAISS Documentation](https://github.com/facebookresearch/faiss)
- [Ollama](https://ollama.ai/)
- [HuggingFace Models](https://huggingface.co/models)

---

**Ready to get started? Place your PDFs in `data/uploads/` and run `python main.py`!**
