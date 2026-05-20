"""
Fast PDF indexing script.
Reduces chunk size and uses batch processing.
"""

from rag_system import RAGSystem
from config import UPLOADS_DIR
import time

print("🚀 Fast Indexing PDFs...")

# Get all PDFs in uploads folder
pdf_files = list(UPLOADS_DIR.glob("*.pdf"))

if not pdf_files:
    print(f"❌ No PDFs found in {UPLOADS_DIR}")
    exit(1)

print(f"📄 Found {len(pdf_files)} PDF(s):")
for pdf in pdf_files:
    size_mb = pdf.stat().st_size / (1024 * 1024)
    print(f"   - {pdf.name} ({size_mb:.1f} MB)")

# Start timing
start_time = time.time()

print("\n📚 Creating vector store (this may take a few minutes)...")

# Initialize RAG system
rag = RAGSystem(use_groq=True)

# Process PDFs one by one (instead of all at once)
all_pdfs = [str(p) for p in pdf_files]
rag.initialize_from_pdfs(all_pdfs)

elapsed = time.time() - start_time
print(f"\n✅ Vector store created in {elapsed:.1f} seconds!")
print(f"📊 Total chunks: check the logs above")