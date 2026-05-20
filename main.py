"""
Main entry point for the RAG system.
Example usage and interactive query interface.
"""

import sys
import logging
from pathlib import Path

from rag_system import RAGSystem
from config import PDF_UPLOADS_PATH, VECTOR_STORE_PATH

logger = logging.getLogger(__name__)


def main_interactive():
    """Run the RAG system in interactive mode."""
    print("\n" + "="*60)
    print("LOCAL RAG SYSTEM")
    print("="*60 + "\n")

    # Check if vector store exists
    if Path(VECTOR_STORE_PATH).exists():
        print("Existing vector store found!")
        choice = input("Do you want to:\n1. Load existing vector store\n2. Create new from PDFs\nChoice (1/2): ").strip()

        if choice == "1":
            print("\nInitializing from saved vector store...")
            rag_system = RAGSystem(use_local_model=False)  # Change to True if using local model
            rag_system.initialize_from_saved_vector_store()
        else:
            print("\nSelect PDFs to process...")
            pdf_paths = select_pdfs()
            if not pdf_paths:
                print("No PDFs selected!")
                return
            
            rag_system = RAGSystem(use_local_model=False)  # Change to True if using local model
            rag_system.initialize_from_pdfs(pdf_paths)
    else:
        print("No existing vector store found.")
        print("\nSelect PDFs to process...")
        pdf_paths = select_pdfs()

        if not pdf_paths:
            print("No PDFs selected!")
            return

        rag_system = RAGSystem(use_local_model=False)  # Change to True if using local model
        rag_system.initialize_from_pdfs(pdf_paths)

    # Interactive query loop
    print("\n" + "="*60)
    print("RAG System Ready! Ask your questions.")
    print("Type 'exit' to quit, 'new' to add new PDFs")
    print("="*60 + "\n")

    while True:
        try:
            question = input("\nYour question: ").strip()

            if not question:
                continue

            if question.lower() == "exit":
                print("Goodbye!")
                break

            if question.lower() == "new":
                new_pdfs = select_pdfs()
                if new_pdfs:
                    print(f"\nAdding {len(new_pdfs)} PDF(s)...")
                    rag_system.add_documents(new_pdfs)
                    print("PDFs added successfully!")
                continue

            # Process query
            print("\nProcessing query...")
            result = rag_system.query(question, show_sources=True)

            print("\n" + "-"*60)
            print("ANSWER:")
            print("-"*60)
            print(result["answer"])
            print("-"*60)

        except KeyboardInterrupt:
            print("\n\nGoodbye!")
            break
        except Exception as e:
            print(f"\nError: {str(e)}")
            logger.exception("Error during query processing")


def select_pdfs():
    """Allow user to select PDF files."""
    pdf_files = Path(PDF_UPLOADS_PATH).glob("*.pdf")
    pdf_list = list(pdf_files)

    if not pdf_list:
        print(f"No PDF files found in {PDF_UPLOADS_PATH}")
        print("Please upload PDF files there first!")
        return []

    print(f"\nFound {len(pdf_list)} PDF file(s) in {PDF_UPLOADS_PATH}:")
    for i, pdf in enumerate(pdf_list, 1):
        print(f"{i}. {pdf.name} ({pdf.stat().st_size / (1024*1024):.2f} MB)")

    # Auto-select all PDFs if stdin is not interactive
    import sys
    if not sys.stdin.isatty():
        print("Auto-selecting all PDFs (non-interactive mode)...")
        return [str(pdf) for pdf in pdf_list]

    selection = input("\nUse all PDFs? (y/n): ").strip().lower()

    if selection == "y" or selection == "":
        return [str(pdf) for pdf in pdf_list]
    else:
        print("Enter PDF numbers (comma-separated): ", end="")
        try:
            indices = [int(x.strip()) - 1 for x in input().split(",")]
            selected = [str(pdf_list[i]) for i in indices if 0 <= i < len(pdf_list)]
            return selected
        except (ValueError, IndexError):
            print("Invalid selection!")
            return []


def main_programmatic_example():
    """Example of using RAG system programmatically."""
    print("\n" + "="*60)
    print("RAG SYSTEM - PROGRAMMATIC EXAMPLE")
    print("="*60 + "\n")

    # Set PDFs path (update this with your actual PDF paths)
    pdf_files = [
        str(Path(PDF_UPLOADS_PATH) / "document1.pdf"),
        str(Path(PDF_UPLOADS_PATH) / "document2.pdf"),
    ]

    # Initialize RAG system (use_local_model=False uses Ollama)
    print("Initializing RAG system...")
    rag = RAGSystem(use_local_model=False)

    # Initialize with PDFs
    print("Loading and processing PDFs...")
    rag.initialize_from_pdfs(pdf_files)

    # Example queries
    questions = [
        "What is the main topic of the document?",
        "Can you summarize the key points?",
        "What are the recommendations?",
    ]

    # Process queries
    print("\nProcessing queries...\n")
    results = rag.batch_query(questions, show_sources=True)

    # Print results
    for i, result in enumerate(results, 1):
        print(f"\n{'='*60}")
        print(f"Q{i}: {questions[i-1]}")
        print(f"{'='*60}")
        print(f"Answer: {result['answer']}\n")


if __name__ == "__main__":
    # Choose mode: interactive or programmatic
    if len(sys.argv) > 1 and sys.argv[1] == "--example":
        main_programmatic_example()
    else:
        main_interactive()
