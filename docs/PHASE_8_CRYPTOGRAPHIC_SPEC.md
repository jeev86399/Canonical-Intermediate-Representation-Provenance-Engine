# Phase 8: Cryptographic Specification

## 1. Hash Primitive
CIPE utilizes **SHA-256** (Secure Hash Algorithm 2) exclusively for all state generation.
- Output space: 256 bits (encoded as 64 hex characters).

## 2. Input Encoding
- All JSON AST nodes are stringified using `UTF-8` encoding prior to hashing.
- Array concatenations of neighbor hashes utilize a strict pipe delimiter `|` to prevent length-extension ambiguities (e.g., `hash1|hash2|hash3`).

## 3. Domain Separation
To prevent symmetric graph attacks (where control flow and data flow are indistinguishable), WLCDH explicitly segregates edge types in the state update function:
```javascript
const stateStr = `${prevHash}:CFG[${sortedCfg.join('|')}]:DFG[${sortedDfg.join('|')}]`;
```
This guarantees that a node with CFG neighbors $\{A\}$ and DFG neighbors $\{B\}$ will hash entirely differently than a node with CFG neighbors $\{B\}$ and DFG neighbors $\{A\}$.

## 4. Duplicate Handling
Multisets are preserved. If a node has three identical incoming dataflows (e.g., $x + x + x$), the hashes will be sorted as `hashX|hashX|hashX`. CIPE does NOT deduplicate multiset entries (unlike a strict `Set`), ensuring that operand arity is cryptographically locked into the topology.

## 5. Known Vulnerabilities & Collision Assumptions
- **Pre-image Resistance**: Safe. It is computationally infeasible to reverse a Block Hash back into an AST node.
- **Granularity Collisions**: (Documented in Phase 7). Because CIPE currently sorts all incoming Dataflow edges lexicographically, it inadvertently establishes mathematical commutativity for *all* operations. Thus, `a / b` hashes identically to `b / a` if `a` and `b` share identical topological histories. 
  - *Correction Needed for Production*: Append Edge-Role prefixes (e.g., `LHS:hash`, `RHS:hash`) prior to sorting to destroy commutativity on non-commutative operators.
