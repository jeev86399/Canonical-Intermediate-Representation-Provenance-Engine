# Phase 8: Technical Invention Boundary

This document delineates the exact technical boundaries of the CIPE mechanism, explaining what is explicitly covered and what is rejected, to avoid overclaiming.

## 1. Supported Operations (Invention Coverage)

| Feature | Technical Reason |
|---------|------------------|
| **JavaScript Parser Integration** | The system currently maps Acorn AST structures to the WLCDH graph. |
| **Variable Renaming Robustness** | All lexical identifiers are explicitly scrubbed and replaced with unified topological hashes. |
| **Code Relocation / Function Moving** | WLCDH relies on local block topologies (dataflow links) rather than global line-number offsets. |
| **Syntactic Sugar Normalization** | Acorn AST variants (e.g., BlockStatement omission in conditionals) are normalized to canonical block states. |
| **$O(N)$ Partial Provenance Matching** | Graph matching is abandoned for cryptographic multiset intersection, allowing linear time checks of fragmented subsets (minimum 3 interdependent blocks). |
| **Deterministic Cryptographic Serialization** | Nodes and sorted neighbor hashes are serialized to SHA-256 securely using deterministic JSON iteration. |

## 2. Unsupported Operations (Out of Bounds)

| Feature | Technical Reason |
|---------|------------------|
| **Arbitrary Semantic Equivalence** | CIPE does not evaluate if two *different* algorithms achieve the same mathematical result (e.g., QuickSort vs MergeSort). It tracks structural topology. |
| **Unrestricted JavaScript (e.g. \`eval\`)** | Dynamic execution paths cannot be resolved into a static CFG/DFG reliably. |
| **Generic Plagiarism Detection** | The system does not use NLP, fuzzy string matching, or Winnowing. It strictly requires syntactic validity. |
| **Cross-Language Provenance** | The mechanism currently operates strictly on the parsed AST layout of the target language. Translating Python to JS changes the internal AST nodes and Dataflow structures fundamentally. |
| **Intra-Block Statement Commutativity** | (Identified in Phase 7). WLCDH currently hashes edges commutatively, causing granularity collisions if independent mathematical operations are reordered within the exact same AST Basic Block depth. |

## 3. Disclaimed Prior-Art Technologies
CIPE expressly does NOT claim:
- The invention of Program Dependence Graphs (PDGs).
- The invention of the Weisfeiler-Lehman Graph Isomorphism algorithm.
- The use of SHA-256 for cryptographic verification.
- Static Single Assignment (SSA) transformations.
