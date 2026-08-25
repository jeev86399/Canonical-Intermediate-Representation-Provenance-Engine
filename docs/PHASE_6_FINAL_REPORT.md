# Phase 6 Final Report: Novel Technical Mechanism Refinement

**Date:** 2026-08-25
**Project:** Canonical IR Provenance Engine (CIPE)

## 1. Current CIPE Architecture
CIPE v1.0 is built upon a standard compiler pipeline: Lexical Scope Resolution, Canonical IR Generation, CFG, and SSA Dataflow construction. It extracts fragments based on edges (Block, CFG, DFG) and hashes them independently using SHA-256 and a Sorted Concatenation Multiset accumulator.

## 2. Strongest Prior-Art Obstacles
The independent review (Phase 5B) identified that CIPE v1.0 was primarily an "obvious combination" of well-known techniques (Winnowing/Token-hashing + PDG extraction). It also suffered from severe topological context loss (bag of edges) and was fatally vulnerable to Dependency-Order Injection (inserting a dummy variable shifted all `d:N/b:M` identifiers, breaking the entire graph hash).

## 3. Candidate Mechanisms Considered
1. **Subtree-Addressed Binding Identifiers**: Hashing variable derivations rather than lexical position.
2. **IDF-Weighted Fragment Set Intersection**: Applying Inverse Document Frequency to provenance sets to reduce boilerplate false positives.
3. **Weisfeiler-Lehman Contextual Dataflow Hashing (WLCDH)**: Hashing the graph topology iteratively without relying on variable names. *(Selected)*

## 4. Selected Candidate Technical Contribution
**WLCDH** was selected because it uniquely addresses both the context loss and the dependency-order injection vulnerability by defining a variable's identity purely through its structural dataflow neighborhood, stripped entirely of lexical or positional identifiers.

## 5. Formal Algorithm Summary
WLCDH operates by taking a unified CFG/DFG and stringifying each Basic Block ($v$) while intentionally scrubbing all identifier names and positional bindings. This structural skeleton forms the base hash $S^0(v)$. Over $K$ iterations, each block's hash is updated by aggregating the sorted hashes of all blocks supplying incoming dataflow edges and control-flow edges: 
$S^k(v) = SHA256(S^{k-1}(v) \oplus \text{sort}(D_{in}) \oplus \text{sort}(C_{in}))$.

## 6. Experimental Results
A standalone research prototype was built in `tests/phase6/engine.js`. Against 15 adversarial scenarios, WLCDH successfully recognized:
- Variable and Function renaming
- Dead-code dilution
- Partial function copying
- Nested control flow & Recursive functions
- Fragment relocation

## 7. Technical-Effect Measurements
- **Latency**: WLCDH is highly scalable, measuring ~20.1ms per file pair. It operated ~15% faster than CIPE v1.0 in Javascript due to avoiding expensive graph fragmentation extractions.
- **Size**: WLCDH reduces the generated fingerprint size by ~60%, generating exactly $O(V)$ hashes (one per block) instead of $O(V+E)$ hashes.

## 8. Failure Cases
- **Intra-Block Injection**: Because the prototype aggregates at the Block level, injecting a dummy variable *inside* a block alters $S^0$, causing a false negative.
- **Granularity Collision**: Swapping identical dependencies from the same origin block causes a false positive, because WLCDH groups dataflow edges as a commutative set by incoming block identity, ignoring argument ordering within the instruction.

## 9. Remaining Prior-Art Risks
While the mechanism is highly specific, it operates entirely as a "mathematical method." Under Section 3(k) of the Indian Patents Act, algorithms and computer programs per se are excluded from patentability unless they solve a distinct technical hardware problem. WLCDH improves accuracy and payload size, but is fundamentally an information-processing algorithm.

## 10. What Must Be Reviewed By A Patent Professional
A patent attorney must review `docs/PHASE_6_CLAIM_BOUNDARIES.md` and `docs/PHASE_6_FORMAL_SPECIFICATION.md` to evaluate whether the identifier-scrubbed iterative hashing of a combined CFG/DFG for the specific purpose of partial software provenance verification constitutes a patentable "technical effect" in the target jurisdictions (India/US/EU).

## 11. Recommended Phase 7
If the mechanism is cleared by legal counsel, Phase 7 should focus on refactoring the prototype into production:
1. Push WL aggregation down from the Basic Block level to the AST Node level to defeat intra-block injection.
2. Ensure dataflow edges distinguish argument position (e.g., LHS vs RHS) to prevent granularity collisions.
3. Integrate Inverse Document Frequency (IDF) weights into the final set intersection.
