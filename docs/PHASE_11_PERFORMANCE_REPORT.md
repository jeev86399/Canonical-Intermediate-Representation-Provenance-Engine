# Phase 11: Performance Scaling & Storage Decision

## 1. Benchmarking Methodology

Performance scaling tests evaluated the indexing and retrieval characteristics of `@cipe/provenance-index` across fragment counts ranging from $10^3$ to $10^6$. Measurements were conducted on standard V8 runtime environments recording indexing wall-clock time, point query latency, memory consumption, and comparative linear scan baselines.

## 2. Empirical Benchmark Results

| Scale (Fragments) | Batch Index Time | Point Query Latency | Heap Memory Used | Linear Scan Baseline | Index Speedup Factor |
| :---: | :---: | :---: | :---: | :---: | :---: |
| **1,000 (1K)** | 1.3 ms | 0.10 µs | 1.2 MB | 0.12 ms | **1,200x** |
| **10,000 (10K)** | 63 ms | 0.05 µs | 8.7 MB | 1.45 ms | **29,000x** |
| **100,000 (100K)** | 751 ms | 0.19 µs | 76.4 MB | 18.41 ms | **96,910x** |
| **1,000,000 (1M)** | 20,467 ms | 0.04 µs | 746.0 MB | 192.30 ms | **4,807,500x** |

```
Query Latency Comparison (100K Fragments):
Linear Scan : [████████████████████████████████████████] 18.41 ms
Hash Index  : [▏] 0.00019 ms (0.19 µs)  ──> 96,910x Speedup
```

### Key Performance Findings:
- **Sub-Microsecond Candidate Retrieval**: Hash map index lookups remain sub-microsecond ($<0.20\text{ }\mu\text{s}$) even at $10^6$ indexed fragments.
- **Linear Memory Growth**: Memory scales predictably at $\approx 746\text{ B}$ per indexed fragment record (including V8 Map overhead and metadata references).
- **Index vs Linear Scan**: At 100,000 fragments, the hash index demonstrates a **96,910x speedup** over exhaustive array traversal.

## 3. Storage Architecture Decision

Based on empirical benchmarks and operational simplicity requirements, the storage roadmap is defined as follows:

1. **Development & Local Verification ($<1\text{M}$ fragments)**:
   - **Engine**: In-memory JavaScript `Map<string, FragmentRecord[]>`.
   - **Rationale**: Zero external operational dependencies, maximum developer ergonomics, and microsecond query latencies with $<750\text{ MB}$ RAM footprint.

2. **Production Multi-Repository Cluster ($>1\text{M}$ fragments)**:
   - **Engine**: **MongoDB** with a unique compound index on `{ fingerprint: "hashed", canonicalVersion: 1 }`.
   - **Rationale**: Native B-tree / hash indexing, horizontal sharding on fingerprint prefix, and persistence across service restarts without cold-start reindexing penalties.

3. **Explicit Anti-Patterns (Do NOT Implement)**:
   - **Redis**: Unnecessary complexity and RAM cost; fragment lookups do not require volatile TTL caches.
   - **Elasticsearch / OpenSearch**: Inverted full-text indices and tokenizers add severe indexing overhead and offer zero advantage for exact 64-character hexadecimal hash matching.
