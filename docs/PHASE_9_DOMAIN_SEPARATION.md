# Phase 9: Domain Separation Audit

## Objective
To ensure that identical byte sequences occurring in different semantic contexts (e.g., a CFG edge vs a DFG edge) do not yield identical fingerprints.

## Mechanism Tested
The WLCDH payload format: `${BlockHash}|D:[${SortedDFG}]|C:[${SortedCFG}]`

## Scenarios
1. **CFG vs DFG Hash Swap**:
   - If an attacker magically alters the program such that a CFG edge produces the exact hash previously produced by a DFG edge.
   - **Result**: The string serialization strictly binds the arrays: `|D:[hash1]|C:[hash2]` is distinct from `|D:[hash2]|C:[hash1]`. The final SHA-256 state update diverges completely.
   
2. **Edge Role Hash Swap**:
   - Swapping operands (Left vs Right).
   - **Result**: Because DFG edges are prefixed with their AST role (`left:hash1` vs `right:hash1`), the sorted array will be structurally different, causing the state hash to diverge.

## Conclusion
Domain Separation in Phase 9 is cryptographically enforced via explicit string delimiters (`|D:[` and `|C:[`) and Edge-Role prefixes. Collisions across domains are mathematically impossible without a SHA-256 pre-image break.
