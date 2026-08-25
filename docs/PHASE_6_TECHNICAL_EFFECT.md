# Phase 6: Technical Effect Measurements

**Mechanism:** Weisfeiler-Lehman Contextual Dataflow Hashing (WLCDH)
**Date:** 2026-08-25

## 1. Experimental Results Summary
The WLCDH mechanism was tested against the baseline CIPE v1.0 pipeline across 15 adversarial scenarios. 

| Scenario | Expected | WLCDH Result | CIPE v1.0 Result |
|----------|----------|--------------|------------------|
| A. Variable renaming | EXACT_MATCH | PASS | PASS |
| B. Function renaming | EXACT_MATCH | PASS | PASS |
| C. Independent function reordering | EXACT_MATCH | FAIL (Partial) | FAIL (Partial) |
| D. Syntax transformation | EXACT_MATCH | FAIL (No Match)| FAIL (No Match)|
| E. IIFE wrapping | EXACT_MATCH | FAIL (No Match)| FAIL (No Match)|
| F. Dummy Variable Injection | EXACT_MATCH | FAIL (No Match)| FAIL (No Match)|
| G. Dead-code dilution | PARTIAL_MATCH | PASS | PASS |
| H. Partial function copying| PARTIAL_MATCH | PASS | PASS |
| I. Multiple-fragment copying| PARTIAL_MATCH | FAIL (No Match)| FAIL (No Match)|
| J. Dependency modification | NO_MATCH | FAIL (Exact Match) | PASS (No Match) |
| K. Algorithm modification | NO_MATCH | PASS | PASS |
| L. Nested control flow | EXACT_MATCH | PASS | PASS |
| M. Recursive functions | EXACT_MATCH | PASS | PASS |
| N. Large code insertion | PARTIAL_MATCH | PASS | PASS |
| O. Fragment relocation | EXACT_MATCH | PASS | PASS |

## 2. Technical Effect & Performance Metrics

### 2.1 Verification Latency
WLCDH introduces a small computational overhead due to the iterative sorting and hashing of neighborhood contexts.
- **CIPE Average Verification:** ~23.4 ms per file pair.
- **WLCDH Average Verification:** ~20.1 ms per file pair.
*Surprisingly, WLCDH performed slightly faster in Javascript execution due to avoiding the heavy set-extraction logic of the Tri-partite fragment engine.*

### 2.2 Fingerprint Size
- CIPE v1.0 generated $O(E + V)$ hashes (hashing every block, CFG edge, and DFG edge separately).
- WLCDH generates exactly $O(V)$ hashes (one hash per basic block).
**Effect:** WLCDH reduces the cryptographic footprint size by roughly 60% while theoretically encoding more structural information.

## 3. Failure Analysis & Known Limitations

### 3.1 Intra-Block Dummy Injection (Scenario F)
WLCDH was designed to resist dummy variable injection by relying purely on dataflow. However, the prototype aggregates at the **Basic Block** level. Therefore, if a dummy variable is injected *inside* an existing block, the base signature $S^0$ of that block changes entirely, causing the hash to fail. 
**Solution for Phase 7:** The WL-iteration must be applied at the *Instruction/AST-Node level*, not the block level.

### 3.2 Granularity Collision (Scenario J)
In Scenario J, the dependency was changed from `y = x + 1` to `y = a + 1`. Both `x` and `a` were defined in the same basic block. Because WLCDH tracks incoming dataflow *by block*, the set of incoming block signatures $D_{in}$ remained identical. Furthermore, since variable names are scrubbed, the internal instruction looked identical. 
**Effect:** WLCDH yielded a False Positive (Exact Match). 
**Solution for Phase 7:** The dataflow edges must be strictly ordered by argument position (e.g., Left-Hand vs Right-Hand of a binary operator) rather than treated as a commutative multiset of incoming blocks.
