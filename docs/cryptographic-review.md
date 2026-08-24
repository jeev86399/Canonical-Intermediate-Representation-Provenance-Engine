# CIPE: Cryptographic Isomorphism Provenance Engine
## Cryptographic Review & Security Assumptions

This document outlines the cryptographic constructions, security assumptions, and limitations of the CIPE architecture, suitable for patent review and technical auditing.

### 1. Core Cryptographic Construction
CIPE operates on the principle of Locality-Sensitive Cryptographic Hashing (LSCH) applied to directed acyclic graphs representing dataflow and control flow semantics.

**Hashing Algorithm**: SHA-256 (NIST FIPS 180-4)
**Hashing Target**: The system does NOT hash raw source code. It hashes the deterministic string representation of `CanonicalFragment` nodes, which are derived from a normalized Intermediate Representation (IR).

A block fragment hash is computed as:
`H_block = SHA-256( serialize( Canonical_IR_Instructions ) )`

A dataflow edge fragment hash is computed as:
`H_edge = SHA-256( serialize( sourceBlockId, targetBlockId, canonicalBinding ) )`

A control flow edge fragment hash is computed as:
`H_cfg = SHA-256( serialize( sourceBlockId, targetBlockId, branchCondition ) )`

### 2. Isomorphism and Order Independence
To ensure that isomorphic (structurally equivalent) programs yield the same sets of fragment hashes regardless of superficial obfuscation, CIPE enforces the following normalization steps before hashing:

* **Lexical Binding Normalization**: Variables are renamed to deterministic depth-based IDs (e.g., `d:1/b:0`). This ensures that `let a = 1; a + 2` and `let x = 1; x + 2` produce the identical graph.
* **Commutative Expression Sorting**: Binary expressions with commutative operators (e.g., `+`, `*`, `==`) have their operands sorted lexicographically by their canonical IR strings. `a + b` becomes indistinguishable from `b + a`.
* **Structural Determinism**: Object properties and other unordered structural elements are sorted alphabetically.

### 3. Security Assumptions and Threat Model

* **Pre-Image Resistance**: We assume that it is computationally infeasible for an adversary to construct a colliding fragment `F_fake` such that `SHA-256(F_fake) == SHA-256(F_real)` unless `F_fake` is functionally identical to `F_real` within the normalized canonical domain.
* **Semantic Preservation**: We assume the Babel parser and the normalization engine accurately preserve the mathematical semantics of the program. An adversary could attempt to exploit parsing disparities, but the engine strictly rejects unsupported syntax (e.g., `ClassDeclaration`, `eval`), significantly reducing the attack surface.
* **Set Difference Integrity**: The provenance verification relies on cryptographic set differences (`Set_Suspect \ Set_Original`). We assume that identical hashes imply identical semantic blocks.

### 4. Known Limitations & MVP Boundaries

* **Cyclic Dependency Graphs**: The current engine explicitly rejects mutually recursive functions and inter-procedural cyclic dependencies (`UnsupportedSyntaxError`). Hashing a cycle deterministically requires a full graph isomorphism pass to establish a canonical traversal order. Without this, cyclic references would cause infinite loops during serialization or non-deterministic hashes.
* **Alias Analysis**: The current engine relies on lexical scope bindings. Deep pointer aliasing or dynamic property access (`obj[dynamicKey]`) is beyond the MVP boundary and could theoretically be used to obfuscate dataflow dependencies.
* **Hash Collisions on Trivial Blocks**: A basic block containing only `return 1;` will hash to the same value across any program in the world. CIPE mitigates this by analyzing the interconnected CFG and Dataflow edge hashes, which encode the block's contextual relationships, rather than just the isolated block hash.

### 5. Hostile LSCH Algorithm Review (Phase 4 Audit)

Treating the Lexicographically Sorted Concatenation Hash (LSCH) not as an invention, but strictly as an engineering choice, reveals several structural vulnerabilities:

* **Concatenation Boundary Ambiguity**: If hashes $H_1, H_2$ are concatenated as strings without delimiters, an adversary could theoretically manipulate fragment definitions such that $H_a || H_b == H_x || H_y$. CIPE mitigates this by ensuring SHA-256 outputs are fixed-length (64 hex characters). However, if the hashing function were ever altered to a variable-length output, this would become a critical collision vector.
* **Duplicate Fragment Masking**: A multiset may contain duplicate fragments (e.g., three instances of $H_A$). LSCH sorts these as $H_A, H_A, H_A$. If an adversary adds a fourth $H_A$, the global fingerprint changes. However, calculating *partial intersection* on global fingerprints is impossible; intersections can only be calculated on the raw underlying fragment arrays. LSCH destroys the multiplicity mapping required for advanced subgraph comparisons.
* **Context Loss**: Sorting completely destroys the temporal and spatial relationship between fragments. While Dataflow/CFG edges maintain *local* context (e.g., Block A flows to Block B), the *global* fingerprint treats the application as an unordered bag of graphs. An adversary can insert massive amounts of dead, disconnected graphs to drastically alter the global fingerprint, hiding a stolen algorithm in the noise.
* **Misleading Similarity via Graph Isomorphism Density**: Two different graphs might share a large number of identical foundational basic blocks (e.g., heavy use of standard library assignments). Because LSCH treats all fragments with equal weight, two programs that share boilerplate but have entirely different core business logic might return an artificially high `PARTIAL_MATCH` confidence, acting as a false positive.
* **Dependency-Order Manipulation Attack**: LSCH relies on the canonical IDs assigned to basic blocks. If an adversary introduces a series of non-functional variable dependencies (`let decoy = 1; let decoy2 = decoy + a;`), they shift the dataflow graph topology. Because canonical IDs rely on structural hashes, changing the topology cascades canonical ID changes downstream, completely invalidating the dependent Control Edge and Data Edge fragments, even if the core algorithm is mathematically identical.
