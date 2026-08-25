# Phase 10: Git Pipeline Architecture

## Objective
To prove that the Canonical Intermediate Representation Provenance Engine (CIPE) can extract source code from Git, transform it into Canonical IR, and generate valid cryptographic fingerprints representing topological provenance.

## Pipeline Architecture
The Git ingestion pipeline isolates repository access from cryptographic analysis, bridging them through the `provenance-pipeline` module.

### 1. Ingestion Layer (Git-Engine)
The `git-engine` module acts as a secure, local execution wrapper around the Git CLI.
- **Commit Traversal:** Executes `git diff-tree --name-status -r --root <commit>` to identify modified, added, or deleted files.
- **Content Extraction:** Executes `git show <commit>:<file>` to extract raw source code at a specific historical point, irrespective of the current working directory state.
- **Security Constraint:** Local CLI wrappers are prioritized over external API calls (e.g., GitHub API) to maintain zero-knowledge local R&D and prevent data exfiltration.

### 2. Transformation Layer (Provenance Pipeline)
The extracted source code strings are passed to `packages/provenance-pipeline/index.js`, which orchestrates the CIPE core:
1. **Parser:** Validates syntax and generates the Babel AST.
2. **Scope Engine:** Applies lexical scoping data.
3. **Canonical IR Generator:** Scrubs variable names and standardizes logic.
4. **CFG Engine:** Constructs the basic-block graph.
5. **Dataflow Engine:** Overlays reaching definitions.

### 3. Fingerprinting Layer (WLCDH)
The Dataflow CFG is hashed using Weisfeiler-Lehman Contextual Dataflow Hashing (WLCDH):
- Generates localized block hashes (fragments).
- Generates a singular global fingerprint representing the holistic structural state.

## Technical Effect
By successfully ingesting multi-commit histories, the pipeline establishes a deterministic linkage between a Git commit hash (representing arbitrary unstructured bytes) and a CIPE provenance fingerprint (representing semantic logic). This allows tracking logical fragments across time, independently of textual git-diff patches.
