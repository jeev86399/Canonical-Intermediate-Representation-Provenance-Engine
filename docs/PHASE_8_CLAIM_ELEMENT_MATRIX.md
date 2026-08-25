# Phase 8: Claim Element Matrix

This matrix classifies the individual technical components of the CIPE pipeline to assess individual and combined patentability risks.

## ELEMENT A: Receiving source code and parsing into AST
- **Classification**: KNOWN PRIOR ART
- **Notes**: Standard compiler theory (e.g., Acorn parsing).

## ELEMENT B: Lexical Normalization and Identifier Erasure
- **Classification**: HIGH PRIOR-ART RISK
- **Notes**: Abstracting syntax and stripping variable names is standard in clone detection (e.g., CCFinder). 

## ELEMENT C: Generating CFG and DFG in SSA Form
- **Classification**: KNOWN PRIOR ART
- **Notes**: Standard intermediate representations (PDGs) used in compilers and static analysis.

## ELEMENT D: Iterative Cryptographic Neighborhood Aggregation (WL)
- **Classification**: HIGH PRIOR-ART RISK
- **Notes**: The Weisfeiler-Lehman algorithm is mathematically known. Applying cryptographic hashing (SHA-256) instead of integer labeling is a trivial engineering choice.

## ELEMENT E: Domain-Separated Topological Hash State
- **Classification**: POTENTIAL DIFFERENTIATION
- **Notes**: Specifically separating the incoming CFG edges from the DFG edges during the commutative sort, ensuring that control-flow and data-flow topologies do not symmetrically collide in the hash state.

## ELEMENT F: Graph Projection to Unordered Cryptographic Multiset
- **Classification**: EXPERIMENTALLY VALIDATED / POTENTIAL DIFFERENTIATION
- **Notes**: Discarding graph edges entirely and projecting the network into a flat array of localized structural hashes. Tested effectively in Phase 7 to guarantee $O(N)$ partial provenance.

## ELEMENT G: Multiset Intersection Thresholding
- **Classification**: REQUIRES PROFESSIONAL REVIEW
- **Notes**: Establishing a mathematical threshold ($T \ge 3$ basic blocks) for partial provenance matching. While experimentally validated to yield a 4.2% FPR, numerical thresholds are notoriously difficult to patent unless tied to a specific structural phenomenon.

## Conclusion for Claims Drafting
No single element from A to D is patentable on its own. The invention lies strictly in the combination of **Element E + Element F**, executed specifically to bypass the computational limits of Sub-Graph Isomorphism while achieving the partial-provenance goals of Token-Hashing, but with topological robustness.
