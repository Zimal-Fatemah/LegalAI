"""
Setup script for the RAG system.
Helps with initial configuration and dependency installation.
"""

import os
import sys
import subprocess
from pathlib import Path


def print_header(text):
    """Print formatted header."""
    print("\n" + "="*60)
    print(text.center(60))
    print("="*60 + "\n")


def print_step(step_num, text):
    """Print formatted step."""
    print(f"\n[Step {step_num}] {text}")
    print("-" * 60)


def check_python_version():
    """Check if Python version is compatible."""
    print_step(1, "Checking Python Version")

    version = sys.version_info
    print(f"Python version: {version.major}.{version.minor}.{version.micro}")

    if version.major < 3 or (version.major == 3 and version.minor < 9):
        print("❌ Python 3.9+ required!")
        return False

    print("✓ Python version OK")
    return True


def install_dependencies():
    """Install required packages."""
    print_step(2, "Installing Dependencies")

    try:
        print("Installing dependencies from requirements.txt...")
        subprocess.check_call(
            [sys.executable, "-m", "pip", "install", "-r", "requirements.txt"],
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
        )
        print("✓ Dependencies installed successfully")
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ Error installing dependencies: {e}")
        return False


def create_directories():
    """Create necessary directories."""
    print_step(3, "Creating Directories")

    dirs = [
        "data/uploads",
        "data/vector_store",
        "models",
    ]

    for dir_path in dirs:
        Path(dir_path).mkdir(parents=True, exist_ok=True)
        print(f"✓ Created: {dir_path}")

    return True


def check_ollama():
    """Check if Ollama is installed and running."""
    print_step(4, "Checking Ollama (Optional)")

    try:
        result = subprocess.run(
            ["ollama", "--version"],
            capture_output=True,
            text=True,
            timeout=5,
        )
        if result.returncode == 0:
            print(f"✓ Ollama found: {result.stdout.strip()}")
            
            # Check if server is running
            try:
                import urllib.request
                urllib.request.urlopen("http://localhost:11434", timeout=2)
                print("✓ Ollama server is running")
                return True
            except:
                print("⚠ Ollama is installed but server not running")
                print("  Run 'ollama serve' in another terminal")
                return False
        else:
            print("⚠ Ollama not installed on this system")
            return False
    except FileNotFoundError:
        print("⚠ Ollama not found in PATH")
        print("  To use Ollama: https://ollama.ai")
        return False
    except Exception as e:
        print(f"⚠ Error checking Ollama: {e}")
        return False


def check_local_model():
    """Check for local model file."""
    print_step(5, "Checking Local Model File")

    model_dir = Path("models")
    model_files = list(model_dir.glob("*.gguf"))

    if model_files:
        print(f"Found {len(model_files)} model file(s):")
        for model_file in model_files:
            size_mb = model_file.stat().st_size / (1024 * 1024)
            print(f"  - {model_file.name} ({size_mb:.2f} MB)")
        return True
    else:
        print("⚠ No GGUF model file found in models/ directory")
        print("  Place your .gguf model file there to use local LLM")
        return False


def test_imports():
    """Test if all imports work."""
    print_step(6, "Testing Imports")

    test_imports = [
        ("langchain", "LangChain"),
        ("transformers", "Transformers"),
        ("torch", "PyTorch"),
        ("pypdf", "PyPDF"),
        ("faiss", "FAISS"),
    ]

    all_ok = True
    for module_name, display_name in test_imports:
        try:
            __import__(module_name)
            print(f"✓ {display_name}")
        except ImportError:
            print(f"❌ {display_name} - not installed")
            all_ok = False

    return all_ok


def print_setup_options():
    """Print setup options."""
    print_header("Setup Options")

    print("Choose your LLM setup:\n")
    print("1. OLLAMA (Recommended for beginners)")
    print("   - Easy installation")
    print("   - Multiple models available")
    print("   - Setup: https://ollama.ai/\n")

    print("2. LOCAL MODEL FILE (Advanced)")
    print("   - Download GGUF model file")
    print("   - Place in models/ directory")
    print("   - Requires more VRAM\n")

    print("3. BOTH (Flexible)")
    print("   - Have both options available")
    print("   - Switch in config.py as needed\n")


def setup_wizard():
    """Main setup wizard."""
    print_header("LOCAL RAG SYSTEM - SETUP WIZARD")

    # Check Python
    if not check_python_version():
        print("\n❌ Setup failed: Python version not compatible")
        return False

    # Install dependencies
    if not install_dependencies():
        print("\n❌ Setup failed: Could not install dependencies")
        print("Try: pip install -r requirements.txt")
        return False

    # Create directories
    if not create_directories():
        print("\n❌ Setup failed: Could not create directories")
        return False

    # Check LLM setup
    print_step(4, "Checking Language Model Setup")

    ollama_ok = check_ollama()
    local_ok = check_local_model()

    if not ollama_ok and not local_ok:
        print("\n⚠ WARNING: No LLM setup detected!")
        print("\nYou need one of:")
        print("  A) Ollama: https://ollama.ai/")
        print("  B) Local model file (.gguf) in models/ directory")

    # Test imports
    if not test_imports():
        print("\n⚠ Some imports failed. Try: pip install -r requirements.txt")

    # Setup complete
    print_header("Setup Complete!")

    print("Next steps:\n")
    print("1. Place your PDF files in: data/uploads/\n")

    if not ollama_ok:
        print("2. Set up an LLM:")
        print("   a) Ollama: https://ollama.ai/")
        print("   b) Or place a .gguf model file in models/\n")
    else:
        print("2. Run: ollama serve\n")

    print("3. Run the RAG system: python main.py\n")

    print("For more help, see README.md\n")

    return True


def verify_setup():
    """Verify setup is working."""
    print_header("Verifying Setup")

    # Check directories
    print("Checking directories...")
    required_dirs = ["data/uploads", "data/vector_store", "models"]
    for dir_path in required_dirs:
        if Path(dir_path).exists():
            print(f"✓ {dir_path}/")
        else:
            print(f"❌ {dir_path}/ not found")

    # Check requirements
    print("\nChecking dependencies...")
    try:
        import langchain
        from langchain_huggingface import HuggingFaceEmbeddings
        from langchain_community.vectorstores import FAISS
        print("✓ Core dependencies OK")
    except ImportError as e:
        print(f"❌ Missing dependency: {e}")
        return False

    # Try to import our modules
    print("\nChecking RAG modules...")
    try:
        import config
        from config import PDF_UPLOADS_PATH, VECTOR_STORE_PATH, MODELS_DIR, DATA_DIR
        from document_loader import DocumentLoader
        from embeddings import EmbeddingManager
        from llm_chain import LLMManager
        from rag_system import RAGSystem
        print("✓ All modules OK")
    except ImportError as e:
        print(f"❌ Module import error: {e}")
        return False

    print("\n✓ Setup verification passed!")
    return True


if __name__ == "__main__":
    if len(sys.argv) > 1 and sys.argv[1] == "--verify":
        verify_setup()
    else:
        try:
            setup_wizard()
        except KeyboardInterrupt:
            print("\n\nSetup cancelled.")
            sys.exit(1)
        except Exception as e:
            print(f"\n❌ Setup error: {e}")
            import traceback
            traceback.print_exc()
            sys.exit(1)
