# Phase 7: Invention Boundary Definition

To prevent overclaiming during legal review, the technical boundary of the Canonical IR Provenance Engine (CIPE) is strictly delineated based on the experimental results of Phase 7.

## 1. Known Prior Art
- **AST Canonicalization**: Stripping formatting, unifying syntactic sugar (e.g., arrow functions to declarations).
- **Control Flow Graphs (CFG) & Dataflow Graphs (DFG)**: Standard compiler infrastructure (Static Single Assignment, Def-Use chains).
- **Cryptographic File Hashing**: Using SHA-256 for integrity.
- **Weisfeiler-Lehman Graph Kernels**: Iteratively hashing node neighborhoods to establish isomorphism.

## 2. Known Implementation Techniques
- Multiset concatenations with lexicographical sorting for commutative accumulation.
- Fixed-point worklist algorithms for reaching-definitions.

## 3. Combination of Known Techniques
- Extracting a PDG (CFG+DFG), converting it to a set of edges, and hashing the edges independently (This was CIPE v1.0, explicitly rejected as an obvious combination in Phase 5).

## 4. Experimentally Validated Contribution (The Novelty Boundary)
The exact boundaries of the **WLCDH** (Weisfeiler-Lehman Contextual Dataflow Hashing) mechanism:
1. **Identifier Erasure**: The total removal of all lexical identifiers, variable names, and positional scope depth assignments from the graph before hashing.
2. **Shallow Topological Folding**: Aggregating incoming Control-flow and Data-flow edges independently into a flat, sorted cryptographic state update, bypassing full Sub-Graph Isomorphism in favor of multiset element intersection.
3. **Partial Provenance Application**: Establishing a minimum 3-block threshold for topological uniqueness, allowing $O(N)$ partial provenance verification of code fragments across codebases without comparing original token streams.

## 5. Unvalidated Hypothesis
- **Node-level Iteration**: It is hypothesized that pushing the WL aggregation down to the AST Node level (rather than the Basic Block level) will perfectly solve the "Intra-Block Injection" vulnerability. This is unvalidated and must be deferred to Phase 8.
