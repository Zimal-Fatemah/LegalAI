# Architectural Decisions

## ADR-1: Why Groq instead of OpenAI
- **Context:** Needed fast inference for Pakistani legal queries
- **Decision:** Used Groq Llama 3.3 70B at $0.59/1M tokens vs GPT-4 at $30/1M
- **Tradeoff:** Lower reasoning quality on complex constitutional questions, but 50x cheaper and 10x faster
- **Outcome:** Average response time &lt; 2s, acceptable for student/citizen modes

## ADR-2: Chunk size 500, overlap 50
- **Context:** Legal documents have dense, cross-referenced sections
- **Decision:** 500-character chunks with 50-character overlap
- **Tradeoff:** Smaller chunks = more precise retrieval but lose context. Larger chunks = better context but noisier retrieval.
- **Outcome:** [TO DO: Run benchmark with 500 vs 1000 vs 1500, measure answer relevance score]

## ADR-3: Why Chroma over FAISS
- **Context:** Needed persistent vector storage between server restarts
- **Decision:** Chroma with disk persistence vs FAISS in-memory
- **Tradeoff:** Chroma is slower on large datasets but easier to manage
- **Outcome:** [TO DO: Benchmark retrieval latency at 100, 500, 1000 documents]
