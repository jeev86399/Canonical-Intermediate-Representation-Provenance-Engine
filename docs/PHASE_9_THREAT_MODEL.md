# Phase 9: Threat Model

## 1. Attacker Profile
We assume an active, highly capable attacker.
- **Knowledge**: The attacker has complete, white-box access to the CIPE source code, canonicalization rules, WLCDH fingerprint mathematics, and fragment structures.
- **Capabilities**: The attacker can arbitrarily modify source code (insertions, deletions, syntax transformations, code reordering).

## 2. Attacker Goals
1. **Evade Provenance Detection**: Successfully copy a tracked algorithm into a new codebase without CIPE generating a multiset intersection $\ge 3$.
2. **Create a False Provenance Match (Collision)**: Manufacture code that produces a fingerprint colliding with an unrelated target fingerprint, implicating an innocent developer in copyright infringement.
3. **Exploit Canonicalization**: Utilize unsupported or loosely defined JavaScript syntax that canonicalizes destructively, causing fingerprints to collapse.
4. **Dilute Evidence**: Wrap a stolen fragment in massive amounts of dummy code to statistically lower the "confidence" percentage below reporting thresholds.
5. **Hash Aggregation Attack (Intra-Block Injection)**: Reorder independent statements within the exact same Basic Block to alter the linear byte sequence while maintaining the exact same commutative DFG hash, exploiting the known Phase 8 vulnerability.
