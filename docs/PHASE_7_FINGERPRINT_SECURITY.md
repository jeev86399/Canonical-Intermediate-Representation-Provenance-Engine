# Phase 7: Fingerprint Security & Collision Robustness

An independent clean-room mathematical verifier was built in `tests/phase7/reference-verifier/` to validate the cryptographic assumptions.

## Fingerprint Robustness

1. **Canonical Fragment Collisions**: 
   - **Result**: Identical instructions natively yield identical hashes. The multiset accumulator correctly registers multiple instances without collision negation (unlike XOR accumulators).
2. **Duplicate Fragment Effects**:
   - **Result**: Safe.
3. **Hash-Domain Separation**:
   - **Result**: Dataflow and Control-flow edges are isolated into distinct sorted lists before hashing, preventing symmetric graph collisions.
4. **Serialization Ambiguity**:
   - **Result**: Safe. JSON.stringify guarantees deterministic key iteration in modern V8.

## Identified Fingerprint Weaknesses
- **Commutative Edge Overlap (Granularity Collision)**: As verified in the WLCDH implementation, swapping inputs to a basic block yields an identical hash because the incoming edges are commutatively sorted.
- **Correction**: The mathematical accumulator must incorporate Edge Role (e.g. `LeftOperand`, `RightOperand`) into the hash before sorting, breaking commutativity where mathematically inappropriate.
