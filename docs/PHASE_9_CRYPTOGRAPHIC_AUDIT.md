# Phase 9: Cryptographic Construction Audit

## 1. Hash Primitive
- **Algorithm**: SHA-256 (via Node.js `crypto`).
- **Why**: Standard cryptographic primitive providing $2^{128}$ collision resistance, securely preventing pre-image reversal of AST fragments.

## 2. Iteration 0 (Initialization)
- **What is hashed**: `JSON.stringify` of the identifier-scrubbed Basic Block instructions.
- **Is encoding unambiguous?**: Modern V8 guarantees property iteration order based on creation. However, cross-engine serialization is risky. CIPE explicitly sorts object keys alphabetically during the `scrubIdentifiers` function to guarantee deterministic JSON output regardless of the parser version.
- **Can inputs produce same serialized string?**: Yes. `const a = 1;` and `let b = 1;` (if normalized to identical internal types) will yield identical hashes. This is the intended topological behavior.

## 3. Iteration $K$ (Neighborhood Aggregation)
- **What is hashed**: `${PrevHash}|D:[${SortedDFG}]|C:[${SortedCFG}]`
- **Domain Separation**: The explicit `D:[...]` and `C:[...]` delimiters ensure that a CFG edge hash cannot be confused with a DFG edge hash, resolving the Phase 8 domain separation requirement.
- **Duplicate Handling**: Sorting retains duplicate hashes (`hash1,hash1,hash2`). The array is joined by commas.
- **Edge Role Enhancement (Phase 9)**: DFG hashes are now prefixed with their AST relationship path (e.g., `init:hash`, `left:hash`). This solves the Phase 8 "Intra-Block Injection" commutativity vulnerability by securely binding the dataflow edge to its exact mathematical operand role.

## 4. Fingerprint Generation
- **What is hashed**: The final array of all $K$-iterated Basic Block hashes, sorted lexicographically, and joined.
- **Can attacker reorder components?**: No. Lexicographical sorting entirely negates positional file-reordering attacks.
- **Can an attacker add components without detection?**: Yes, inserting dummy blocks adds new hashes to the multiset without altering the existing block hashes. This is the fundamental requirement for $O(N)$ Partial Provenance matching (detecting subsets).
