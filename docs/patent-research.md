# Canonical IR Provenance Engine: Technical Patent Strategy

## 1. The Core Innovation
Current provenance detection systems in software engineering (e.g., MOSS, JPlag) operate primarily on Token Streams or raw Abstract Syntax Trees (ASTs). These representations are inherently fragile to trivial obfuscation techniques:
- **Variable Renaming**: Defeats token-based similarity.
- **Statement Reordering**: Defeats simple structural hashing.
- **Syntactic Sugar**: (e.g., replacing `function` with arrow functions) Defeats direct AST comparators.

The **Canonical IR Provenance Engine (CIPE)** resolves these vulnerabilities by compiling the source code into a true **Control Flow Graph (CFG)** enriched with a strict **Static Single Assignment (SSA) / Reaching Definitions** dataflow map, which is then lowered into position-independent cryptographic fragments.

## 2. Canonicalization Pipeline

### 2.1 Lexical Scope Normalization
CIPE implements a custom `LexicalEnvironment` stack. Rather than using the variable name provided by the developer, each identifier is converted into a deterministic string representing its lexical origin (e.g., `s:0/b:0`). This mathematical identity tracks shadowing deterministically, defeating variable renaming completely.

### 2.2 Syntactic Normalization
Prior to CFG extraction, CIPE standardizes equivalent syntactic constructs.
- **Functions**: `FunctionDeclaration`, `FunctionExpression`, and `ArrowFunctionExpression` are unified into a `CanonicalFunction`.
- **Commutativity**: Operands for commutative operators (`+`, `*`, `==`) are lexicographically sorted based on their stringified JSON representation, meaning `a + b` and `b + a` generate identical hashes.

## 3. The Cryptographic Multiset Accumulator

To achieve true position independence (i.e., verifying the existence of logic regardless of where it appears in the file), CIPE breaks the CFG and Dataflow Graph into fragments:
1. **Block Fragments**: The contents of basic blocks, scrubbed of specific node identifiers.
2. **Control Edge Fragments**: Representations of branches and loops.
3. **Data Edge Fragments**: Direct representations of variable definitions reaching variable usage.

### 3.1 Hash Algorithm Selection
To combine these unordered fragments into a single verifiable **Fingerprint**, CIPE requires a **Multiset Hash Accumulator** $H(M)$ such that $H(\{A, B\}) = H(\{B, A\})$.

**Rejected Approaches:**
- **XOR Accumulator**: $hash(A) \oplus hash(B)$. Highly vulnerable to collision attacks (e.g., $hash(A) \oplus hash(A) = 0$).

**CIPE's Implementation:**
CIPE utilizes a **Lexicographically Sorted Concatenation Hash**. 
1. Compute the SHA-256 hash for every serialized fragment.
2. Sort the array of resulting hashes lexicographically.
3. Concatenate the sorted hashes.
4. Compute the final SHA-256 hash of the concatenated string.

*Why this matters for patentability:* This approach guarantees strict order-independence and cryptographic resistance to multi-set collision without the severe computational overhead of asymmetric multiset accumulators (like RSA-based accumulators or MuHash). It allows $O(N \log N)$ fingerprint generation perfectly suited for realtime CI/CD pipelines.

## 4. Partial Verification
Because the fragments are generated independently, CIPE allows for **Set Intersection verification**. Even if a malicious actor copies only a single function (a subset of the original fragments) and embeds it inside a larger, completely different application, CIPE's multiset intersection will detect the structural overlap of those specific blocks and data-edges, reporting a quantifiable `PARTIAL_MATCH` confidence score.
