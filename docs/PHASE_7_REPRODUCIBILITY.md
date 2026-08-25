# Phase 7: Reproducibility Report

## 1. Environment & Setup
A complete clean installation was performed to verify system reproducibility from scratch.
- **Node Version**: v24.16.0
- **NPM Version**: 11.13.0
- **Dependency Installation**: Success (462 packages added, 0 vulnerabilities)

## 2. Baseline Verification (Phase 3 tests)
The original project verification suite was executed against the repository to ensure Phase 6 changes did not corrupt the original pipeline.

- **Status**: PASS
- **Execution Time**: ~45ms
- **Tests Executed**: 15 standard mutation scenarios.
- **Result**: Identical Canonical IR, fragment identifiers, and fingerprints were generated successfully across all tests. No regressions.

## 3. Phase 6 Experimental Reproducibility
The WLCDH (Weisfeiler-Lehman Contextual Dataflow Hashing) prototype in \`tests/phase6\` was executed multiple times against identical and mutated inputs.

- **Determinism**: 100% deterministic output on identical inputs across runs. The fingerprint generation relies purely on cryptographic SHA-256 and lexicographic sorts. 
- **Topology Integrity**: The dependency-order injection vulnerability discovered in Phase 5 remains fully mitigated, confirming the experimental claims from Phase 6.

All inputs produce identical, reproducible graphs and hashes.
