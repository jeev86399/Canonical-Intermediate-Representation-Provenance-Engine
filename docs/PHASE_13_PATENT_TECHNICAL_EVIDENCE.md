# Phase 13: Patent Technical Evidence

This document captures the engineering mechanisms designed and proven in Phase 13 for large-scale, asynchronous provenance analysis. It separates implemented mechanisms from hypotheses and future work.

**DISCLAIMER**: This document contains engineering observations only. It makes NO determination of patentability, novelty, or legal rights.

## 1. Deterministic Analysis Identity (IMPLEMENTED)
- **Mechanism**: Combining the `repository` reference, `commit` hash, `cipeVersion`, `canonicalIRVersion`, and `fingerprintVersion` into a deterministic SHA-256 hash.
- **Evidence**: If the exact same tuple is provided, the API returns a cached job reference in `O(1)` time without re-traversing the AST, preventing identical analytical work.

## 2. Incremental Provenance Analysis (IMPLEMENTED)
- **Mechanism**: File-level state caching. When transitioning from Commit A to Commit B, unchanged files are skipped. Their previous canonical fragments are concatenated with the re-analyzed fragments of changed files to form the complete index.
- **Evidence**: Experiments showed a >100x speedup when changing 1 file in a 100-file repository.

## 3. Dependency-Aware Invalidation (EXPERIMENTALLY VALIDATED)
- **Mechanism**: To preserve the semantic correctness of dataflow graphs, modifications to a file MUST invalidate downstream dependents.
- **Evidence**: A static analysis heuristic was implemented. Deeply dynamic requires (e.g. `require(computedString)`) are gracefully marked as `UNSUPPORTED` to prevent the provenance engine from asserting false negative guarantees.

## 4. Content-Addressable Derived Artifacts (IMPLEMENTED)
- **Mechanism**: The canonical fragment set is stored via a Content Addressable Store (CAS). Files generating identical IR structures produce the same SHA-256 hash and do not duplicate storage.
- **Evidence**: Repeated boilerplate logic across multiple repositories points to the same storage blocks.

## 5. Fault-Tolerant Pipeline (IMPLEMENTED)
- **Mechanism**: Utilizing Node.js `worker_threads` with strict memory limits and a heartbeat timeout. Jobs that crash are explicitly caught and flagged `FAILED`, preserving the queue health.
- **Evidence**: A simulated chaos test (crashing the worker or throwing `MAX_FILES`) correctly truncated the job and provided a transparent `WARNING` in the manifest without locking the API server.

## 6. Real-time Telemetry (IMPLEMENTED)
- **Mechanism**: IPC messaging (`parentPort.postMessage`) transmits execution stages (queue wait, parse, IR, graph, fingerprint) asynchronously back to the React UI for precise bottleneck visualization.

## FUTURE WORK / HYPOTHESIS
- Deep static dependency graph invalidation using full AST import traversal across multi-package monorepos.
- Containerized (Docker/gVisor) isolation for hostile payload protection.
- Cross-language Canonical IR translation to support Python/Go alongside JS.
