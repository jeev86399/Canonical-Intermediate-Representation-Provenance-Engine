# Phase 8: Red-Line Disclosure Audit

To prevent premature public disclosure that could invalidate future patent claims, the following information classifications must be enforced across the CIPE project.

## 1. PUBLIC-SAFE
This information may be discussed publicly, on GitHub, or in generic technical blogs:
- The general goal of detecting code provenance in CI/CD.
- The use of ASTs and generic PDGs.
- The use of SHA-256 for basic file integrity.
- General benchmarks regarding parser speeds.

## 2. PATENT-SENSITIVE
This information should be restricted to NDA-bound parties or the Patent Attorney:
- The exact combination of Weisfeiler-Lehman algorithms with compiler PDGs.
- The explicit 3-block numerical threshold used for Partial Provenance matching.
- The $O(N)$ linear scalability metrics achieved via multiset projection.
- The specific Phase 7 adversarial test results and False Positive Rates.

## 3. HIGHLY PATENT-SENSITIVE
This information constitutes the core differentiating mechanism and must **never** be published until a patent application is formally filed:
- **Identifier Erasure Mechanism**: The explicit stripping of all variable names and positional constraints prior to graph generation.
- **Domain-Separated Topological Folding**: The specific commutative hashing logic (Step 4 of the Formal Algorithm) that segregates Control-Flow edges from Data-Flow edges during sorting.
- The exact cryptographic string formatting (e.g., `hash:CFG[...]:DFG[...]`).
- The `tests/phase6/engine.js` source code implementation of the WLCDH algorithm.

## Audit Requirement
Do NOT push `tests/phase6/engine.js`, `PHASE_8_FORMAL_ALGORITHM.md`, or `PHASE_8_CRYPTOGRAPHIC_SPEC.md` to public repositories. Maintain them locally.
