# Canonical IR Provenance Engine: Invention Record

**WARNING: DO NOT FILE AS PATENT WITHOUT PROFESSIONAL REVIEW.**
*This document contains technical mechanisms that may or may not constitute patentable subject matter. It is explicitly stated that no claims of novelty or non-obviousness are currently made. This document serves as an internal record for future legal evaluation.*

## 1. Problem Statement
Detecting software plagiarism and tracking code provenance across decoupled systems (e.g., microservices, monorepos, open-source compliance) is technically difficult. Current state-of-the-art tools (like MOSS or JPlag) rely primarily on token-stream matching or direct Abstract Syntax Tree (AST) comparison. 

These approaches are highly vulnerable to trivial semantic-preserving obfuscations:
1. Identifier renaming (changing variables and function names).
2. Statement reordering (moving independent logic blocks around).
3. Syntactic substitution (replacing `function() {}` with `const fn = () => {}`).

## 2. Implemented Technical Mechanism
The Canonical IR Provenance Engine (CIPE) mitigates these vulnerabilities by extracting the mathematical graph structure of the code, independent of text, tokens, or sequence.

### Pipeline Stages
1. **Strict Parser**: Rejects unsupported constructs explicitly.
2. **Lexical Normalizer**: Erases variable names, replacing them with deterministic `Scope:Depth` bindings (e.g., `global/fn:0/var:1`). Shadowing is deterministically mapped.
3. **Canonical IR**: Normalizes commutative expressions (e.g., `a+b` becomes identical to `b+a` by lexicographic sort) and unifies syntactic sugar (e.g., arrow functions to normal functions).
4. **CFG & SSA Dataflow Generator**: Extracts true Basic Blocks and computes explicit Def-Use chains using a fixed-point Reaching Definitions worklist.
5. **Graph Fragmentation**: The graph is decomposed into three edge/node classes:
   - **Block Fragments**: The instructions inside a block. Assigned a deterministic ID based on the hash of their contents.
   - **Control Edge Fragments**: Branching/loop transitions between Block IDs.
   - **Data Edge Fragments**: SSA Def-Use chains linking Block IDs.

### Cryptographic Fingerprinting (The Accumulator)
To achieve position-independence (solving the statement reordering vulnerability), the extracted fragments must be combined in an order-agnostic manner.

**Selected Formula**: Lexicographically Sorted Concatenation Hash (LSCH) using SHA-256.
$H_{global} = \text{SHA256}( \text{Join}( \text{Sort}( [ \text{SHA256}(F_1), \text{SHA256}(F_2), \dots, \text{SHA256}(F_n) ] ) ) )$

*Why LSCH over alternatives?*
- **XOR Accumulators**: Extremely fast, but highly vulnerable to multi-set collisions (e.g., $A \oplus A = 0$).
- **RSA / Elliptic Curve Accumulators**: Mathematically elegant homomorphic properties, but computationally expensive for high-throughput CI/CD pipelines.
- **LSCH**: Guarantees zero collisions from duplicate elements while remaining strictly order-independent. It operates in $O(N \log N)$ time, suitable for our 50KB payload constraints.

## 3. Experimental Results
As of the current implementation (Version 0.1), the adversarial test suite proves the engine correctly standardizes:
- Exact matches despite variable renaming, commutative swaps, whitespace, and arrow-function transformation.
- Partial matches despite independent function reordering, unrelated code insertion, and partial cloning.

## 4. Prior Art & Differences
*Requires formal legal search.*
- **JPlag / MOSS**: Compare $n$-grams of token streams. *Difference*: CIPE compares dependency graphs independent of sequence.
- **Weisfeiler-Lehman Graph Hashing**: Iteratively hashes graph neighborhoods to test isomorphism. *Difference*: CIPE uses a shallow multiset accumulator over specifically crafted Data/Control edges, enabling fast partial intersection matching rather than strict full-graph isomorphism.

## 5. Known Limitations
1. **Hash Size Limits**: For extremely large files (millions of AST nodes), the multiset cardinality could cause performance degradation in sorting. (Mitigated by 50KB API payload limit).
2. **Unsupported Semantics**: `ClassDeclarations`, `eval()`, and `with` statements bypass static dataflow analysis and are intentionally rejected by the parser boundary.
3. **Domain Separation**: The current SHA-256 implementation uses a fixed stringification schema. Minor changes to the AST serializer version will invalidate all previous hashes (Versioning is tracked via `irVersion: "0.1"` to mitigate this).
