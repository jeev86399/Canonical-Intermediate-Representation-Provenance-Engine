# Claim Traceability

This document traces potential claim elements back to the technical implementation. For patent counsel preparation only.

## Element 1: Repository File Boundaries
- **Implementation:** `packages/repository-engine/index.js`
- **Experiment:** `tests/phase15/security.test.js`
- **Evidence:** Bounded static parsing without arbitrary source execution.
- **Open Question:** Is skipping symlinks and enforcing a hard 1MB file cap standard practice or a novel combination for secure provenance pipelines?

## Element 2: Multi-File Graph Aggregation
- **Implementation:** `packages/provenance-pipeline/repository-compare.js`
- **Experiment:** `tests/phase15/adversarial.test.js`
- **Evidence:** Structural fragments survive cross-file refactoring via mathematical set intersections.
- **Prior-Art Risk:** Existing tools (e.g., MOSS, JPlag) evaluate similarity. CIPE's usage of explicit cryptographic block hashes (WLCDH) rather than token-stream n-grams separates the methodology.

## Element 3: Deterministic Event Decoupling
- **Implementation:** `packages/verification-engine/receipt.js`
- **Experiment:** `tests/phase15/reproducibility.test.js`
- **Evidence:** Temporal state is isolated from the `evidenceDigest`.
- **Open Question:** Does combining salted receipt IDs with deterministic AST hashes create a uniquely patentable "Audit Layer"?
