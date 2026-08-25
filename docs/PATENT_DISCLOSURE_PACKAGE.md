# CIPE Patent Disclosure Package

**CONFIDENTIAL - DO NOT PUBLISH**
**FOR PATENT ATTORNEY REVIEW ONLY**

## 1. Title
Method and System for Partial Software Provenance Verification via Cryptographic Multiset Intersection of Identifier-Agnostic Program Dependence Graphs.

## 2. Technical Field
The invention relates generally to static software analysis, and specifically to memory-efficient detection of structural source-code clones and provenance mapping across distributed systems using cryptographic multiset matching.

## 3. Background
Software supply chain security requires verifying the origin (provenance) of code fragments. Modern CI/CD systems process massive volumes of code.

## 4. Technical Problem
Detecting semantic software clones and tracking partial code provenance fails when using token-stream hashing due to trivial syntactic obfuscation. While Sub-graph isomorphism on Program Dependence Graphs (PDGs) solves obfuscation, it is NP-hard and computationally intractable for fast database intersections.

## 5. Limitations of Existing Approaches
- **MOSS/Winnowing (Token Hashing)**: Fast ($O(N)$), but easily defeated by variable renaming or statement reordering.
- **PDG Sub-graph Isomorphism**: Highly accurate and obfuscation-resistant, but computationally explosive ($NP-hard$).

## 6. Technical Solution
The invention (CIPE) projects the intractable PDG into a flat, unordered cryptographic multiset (using a modified Weisfeiler-Lehman Graph Isomorphism kernel). By explicitly erasing all lexical identifiers and segregating control/data flow edges during hash commutativity, CIPE allows graph matching to occur via simple $O(N)$ multiset string intersection.

## 7. System Architecture
A parser module, a canonicalization module, a graph construction module (CFG/DFG), a cryptographic WL-iteration module, and a multiset intersection verification module.

## 8. Detailed Algorithm
See `PHASE_8_FORMAL_ALGORITHM.md` for mathematical proofs.

## 9. Canonical IR
See `PHASE_8_DETERMINISM_SPEC.md` for structural normalization techniques.

## 10. Scope Normalization
All positional variable mapping is explicitly discarded in favor of pure dataflow dependencies.

## 11. Control/Data Dependency Processing
Edges are independently extracted from the SSA AST.

## 12. Fragment Construction
The graph is shattered into discrete Basic Block nodes, rather than extracted edge lists.

## 13. Cryptographic Fingerprinting
Nodes are hashed with their sorted incoming neighbors iteratively using SHA-256. See `PHASE_8_CRYPTOGRAPHIC_SPEC.md`.

## 14. Provenance Verification
$O(N)$ multiset intersection.

## 15. Partial Provenance
A threshold of $\ge 3$ interdependent basic blocks is established to filter generic collisions.

## 16. Experimental Results
Tested against 20 adversarial transformations. Demonstrated $100\%$ detection of variable renaming/relocation. See Phase 7 Walkthrough.

## 17. Technical Effects
- Linear $O(N)$ matching speed (50k lines in <2s).
- Decoupled storage footprint (cryptographic hashes rather than full ASTs).
See `PHASE_8_TECHNICAL_EFFECT.md`.

## 18. Alternative Embodiments
- Multi-language AST support.
- Cloud-scale NoSQL multiset query distributed architecture.
See `PHASE_8_ALTERNATIVE_EMBODIMENTS.md`.

## 19. Limitations
- "Intra-Block Injection" vulnerability due to commutative dataflow sorting.

## 20. Prior-Art Considerations
See `PHASE_8_PRIOR_ART_CLAIM_MAPPING.md` regarding Krinke and Shervashidze.

## 21. Figures Required
See `PHASE_8_FIGURE_SPECIFICATION.md`.

## 22. Questions for Patent Professional
1. Does the specific removal of labels (identifier erasure) provide sufficient novelty over standard WL algorithms?
2. Does the application of WL to PDGs for partial software provenance constitute an "obvious combination", or is the $O(N)$ scalability achievement sufficient to differentiate it?
