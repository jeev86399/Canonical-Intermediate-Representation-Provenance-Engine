# Phase 8: Demonstrated Technical Effects

This document logs the explicit technical advantages of the CIPE mechanism as experimentally verified in Phase 7.

## 1. Algorithmic Scalability
- **TECHNICAL PROBLEM**: Sub-graph isomorphism (the standard method for detecting structural graph clones) is NP-hard, making it impossible to run on large codebases in real-time CI/CD pipelines.
- **BASELINE**: Standard subgraph matching algorithms (VF2) degrade exponentially as AST nodes exceed $10^3$.
- **CIPE**: Reduces graph matching to multiset string hashing intersection.
- **MEASUREMENT**: Scalability test (Phase 7).
- **RESULT**: Proven $O(N)$ linear time complexity. A 50,000-line AST processed in ~1.6 seconds.
- **LIMITATION**: Slower than raw string hashing (e.g., Winnowing) due to initial fixed-point graph construction.

## 2. Robustness to Identifier Obfuscation
- **TECHNICAL PROBLEM**: Attackers or developers rename variables and functions, breaking token-stream hashes and standard plagiarism checkers.
- **BASELINE**: Token hash misses 100% of renamed files.
- **CIPE**: Erases all lexical identifiers and hashes purely on topological dependencies.
- **MEASUREMENT**: Differential Test (Phase 7).
- **RESULT**: 100% equivalence match despite global variable/function renaming.
- **LIMITATION**: Cannot survive logic-altering structural obfuscation (e.g., swapping a `for` loop to a `while` loop, unless the Canonicalizer is specifically programmed to normalize it).

## 3. High-Speed Partial Provenance
- **TECHNICAL PROBLEM**: Determining if *part* of Codebase A exists in Codebase B normally requires sliding-window token hashing, which is highly sensitive to block reordering or syntactic changes.
- **BASELINE**: Winnowing (MOSS) creates rolling n-gram hashes, breaking if statements are reordered or variables renamed.
- **CIPE**: Generates an unordered multiset of block hashes.
- **MEASUREMENT**: Partial Provenance Test (Phase 7).
- **RESULT**: Achieved partial provenance matching with a 4.2% False Positive Rate using a minimum threshold of 3 interconnected basic blocks.
- **LIMITATION**: Reordering statements *within* a single basic block currently evades detection due to commutative hashing rules.

## 4. Storage Reduction
- **TECHNICAL PROBLEM**: Storing massive ASTs for comparison requires significant database space.
- **BASELINE**: Storing full serialized PDGs.
- **CIPE**: Stores only the cryptographic multiset strings (the Fingerprint).
- **MEASUREMENT**: Phase 4 Benchmarking.
- **RESULT**: Provenance state size is decoupled from source code size; fingerprint payload is reduced to a flat array of SHA-256 strings.
- **LIMITATION**: Reversing the fingerprint to show *which* specific lines matched is impossible without the original source, as the graph is fully one-way hashed.
