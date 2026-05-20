# temp_index.py
from rag_system import RAGSystem
from config import UPLOADS_DIR

# Get only the PPC PDF
pdf_files = list(UPLOADS_DIR.glob("PPC*.pdf"))

if pdf_files:
    print(f"Indexing just: {pdf_files[0].name}")
    rag = RAGSystem(use_groq=True)
    rag.initialize_from_pdfs([str(pdf_files[0])])
    print("✅ Done! You can now ask questions about the Pakistan Penal Code.")
else:
    print("PPC 1860.pdf not found")