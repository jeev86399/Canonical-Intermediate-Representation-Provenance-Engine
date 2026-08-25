# Phase 6: Claim Boundary Analysis

**Mechanism:** Weisfeiler-Lehman Contextual Dataflow Hashing (WLCDH)
**Date:** 2026-08-25

## 1. Likely Commodity / Prior Art (DO NOT CLAIM)
The following elements are foundational components of CIPE and WLCDH but are generic, standard industry practices or well-known academic concepts. They must **not** form the core of any independent patent claim:
- **AST Parsing**: Lexing and parsing JavaScript (e.g., Babel).
- **CFG / DFG Generation**: Standard Control Flow and Data Flow graph extraction (including SSA / Reaching Definitions).
- **Lexical Scope Resolution**: Standard depth/index traversal.
- **SHA-256 Hashing**: Generic use of cryptographic hash functions.
- **Multiset Hashing**: Hashing a sorted list of strings to achieve order-independence.
- **Graph Isomorphism (Generic)**: Standard Weisfeiler-Lehman algorithm applied to general node coloring.
- **Token / Block Set Intersection**: Winnowing, MinHash, Jaccard Index, and generic "code clone detection".

## 2. Potential Technical Contribution
The experimental evidence from Phase 6 supports ONE specific technical mechanism that may be patentable.

### **Claim Candidate: Identifier-Scrubbed Iterative Contextual Dataflow Hashing**
**What exactly is being claimed:**
A method for generating a structurally robust, dependency-aware cryptographic fingerprint of a computer program by:
1. Extracting the combined CFG and DFG.
2. Scrubbing all variable identifiers, bindings, and names from the underlying instructions to create an initial state hash for each basic block.
3. Iteratively hashing each block's state by sorting and concatenating the hashes of blocks connected via incoming dataflow edges and control-flow edges from the previous iteration.
4. Exporting the final iteration state hashes as an order-independent multiset.

**What cannot safely be claimed:**
We cannot claim that this mechanism guarantees 100% false-positive immunity. Experiment J (Dependency modification swapping commutative-equivalent origin variables) resulted in an exact match failure. Therefore, we cannot claim "perfect semantic uniqueness." We can only claim "structural topological uniqueness independent of lexical nomenclature."

**Closest known prior art:**
1. **Program Dependence Graph (PDG) Clone Detection (e.g., Krinke 2001):** Uses subgraph isomorphism (NP-Hard) rather than $O(N)$ iterative cryptographic hashing.
2. **Standard Weisfeiler-Lehman Graph Kernels (e.g., Shervashidze 2011):** Applied to chemical or social graphs. Applying it specifically to a unified CFG/DFG with completely scrubbed positional identifiers to generate partial-provenance multiset fingerprints is the novel leap.
3. **BinDiff / BinHunt:** Hashes basic blocks, but generally hashes the edges independently rather than folding the edge topology into the node hash iteratively.

## 3. Why Additional Patent Review is Required
The Indian Patents Act Section 3(k) explicitly excludes "a mathematical method or a business method or a computer programme per se or algorithms." While we have achieved a distinct technical mechanism, the entire mechanism operates mathematically on data structures (AST/CFG/DFG). 

A registered patent attorney must review this to determine whether "cryptographically verifying software provenance" qualifies as a "technical effect" that solves a "technical problem" under local patent guidelines, or if it will be dismissed as a pure algorithmic mathematical method.
