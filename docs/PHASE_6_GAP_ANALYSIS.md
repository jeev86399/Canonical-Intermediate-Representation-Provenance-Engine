# Phase 6: Prior-Art Gap Analysis

**Date:** 2026-08-25
**Objective:** Deconstruct the existing Canonical IR Provenance Engine (CIPE) and classify every major component against the strongest identified prior art to identify the true technical gap.

## Component Classification

| Component | Description | Prior Art Classification | Closest Prior Art / Justification |
|-----------|-------------|--------------------------|------------------------------------|
| **AST Parsing** | Converting source string to Abstract Syntax Tree via Babel. | Clearly known prior art | Standard compiler theory; Babel is an open-source commodity. |
| **Lexical Scope Traversal** | Walking the AST to map variable declarations and uses. | Clearly known prior art | Standard compiler theory. |
| **Canonical Binding IDs** | Replacing variable names with depth/index identifiers (`d:N/b:M`). | Likely known / obvious combination | Variation of De Bruijn indices (1972) adapted for block scopes. |
| **Syntax Canonicalization** | Merging structural equivalents (e.g., `if`/`ternary`, sorting commutative `+`). | Clearly known prior art | Global Value Numbering (GVN) and standard compiler normalization passes. |
| **CFG Construction** | Emitting basic blocks and control flow edges. | Clearly known prior art | Foundational compiler theory. |
| **DFG Construction (Use-Def)**| Emitting data dependency edges from variable definitions to uses. | Clearly known prior art | Static Single Assignment (SSA, 1988), Program Dependence Graph (PDG, 1987). |
| **Fragment Extraction** | Decomposing the graph into independent Block, CFG, and DFG pieces. | Likely known / obvious combination | Code Property Graphs (CPG, Yamaguchi 2014) combine AST, CFG, DFG. Fragmenting graphs for comparison is standard. |
| **Per-Fragment Hashing** | Running SHA-256 over stringified fragments. | Clearly known prior art | BinDiff (2004) hashes basic blocks. |
| **Sorted Concatenation** | Accumulating fragment hashes by sorting them to ensure order-independence. | Clearly known prior art | Standard cryptographic workaround for deterministic multiset hashing (textbook). |
| **Set Intersection Verification** | Using subset/Jaccard overlap to determine partial provenance. | Clearly known prior art | Winnowing (MOSS, 2003), SourcererCC (2016). |

## Summary of the Technical Gap

The gap analysis demonstrates that the current CIPE v1.0 pipeline contains **no fundamentally new technical mechanisms**. It is a clean engineering orchestration of Program Dependence Graph (PDG) clone detection combined with token-hashing set-intersection techniques (Winnowing). 

Furthermore, the existing fingerprint mechanism suffers from severe contextual information loss (the "bag of edges" problem) and is highly vulnerable to trivial adversarial injection (dependency-order injection via dummy variables). 

**The Open Space (The Gap):**
The strongest prior art handles semantic code similarity via NP-hard subgraph isomorphism (which doesn't scale) or token-level hashing (which is easily evaded by refactoring). CIPE attempts to solve this via "edge hashing," but loses structural integrity. 

A true differentiating technical mechanism must bridge this gap: **It must capture the structural topology of the dependency graph (unlike Winnowing) in a scalable, deterministic cryptographic footprint (unlike Subgraph Isomorphism), while resisting linear scope-shifting attacks (unlike De Bruijn indexing).**
