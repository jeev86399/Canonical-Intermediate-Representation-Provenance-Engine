# Phase 6 Experimental Results (WLCDH)

The following matrix compares the new Weisfeiler-Lehman Contextual Dataflow Hashing (WLCDH) mechanism against the original CIPE implementation and standard baselines.

| ID | Category | Expected | WLCDH | CIPE | Exact Hash | Token Hash | AST Hash |
|---|---|---|---|---|---|---|---|
| 1 | A. Variable renaming | EXACT_MATCH | **EXACT_MATCH** ✅ | EXACT_MATCH ✅ | NO_MATCH ❌ | NO_MATCH ❌ | NO_MATCH ❌ |
| 2 | B. Function renaming | EXACT_MATCH | **EXACT_MATCH** ✅ | EXACT_MATCH ✅ | NO_MATCH ❌ | NO_MATCH ❌ | NO_MATCH ❌ |
| 3 | C. Independent function reordering | EXACT_MATCH | **PARTIAL_MATCH** ❌ | PARTIAL_MATCH ❌ | NO_MATCH ❌ | NO_MATCH ❌ | NO_MATCH ❌ |
| 4 | D. Supported syntax transformation | EXACT_MATCH | **NO_MATCH** ❌ | NO_MATCH ❌ | NO_MATCH ❌ | NO_MATCH ❌ | NO_MATCH ❌ |
| 5 | E. IIFE wrapping | EXACT_MATCH | **NO_MATCH** ❌ | NO_MATCH ❌ | NO_MATCH ❌ | NO_MATCH ❌ | NO_MATCH ❌ |
| 6 | F. Dependency-order injection (Dummy Variable) | EXACT_MATCH | **NO_MATCH** ❌ | NO_MATCH ❌ | NO_MATCH ❌ | NO_MATCH ❌ | NO_MATCH ❌ |
| 7 | G. Dead-code dilution | PARTIAL_MATCH | **PARTIAL_MATCH** ✅ | PARTIAL_MATCH ✅ | NO_MATCH ❌ | NO_MATCH ❌ | NO_MATCH ❌ |
| 8 | H. Partial function copying | PARTIAL_MATCH | **PARTIAL_MATCH** ✅ | PARTIAL_MATCH ✅ | NO_MATCH ❌ | NO_MATCH ❌ | NO_MATCH ❌ |
| 9 | I. Multiple-fragment copying | PARTIAL_MATCH | **NO_MATCH** ❌ | NO_MATCH ❌ | NO_MATCH ❌ | NO_MATCH ❌ | NO_MATCH ❌ |
| 10 | J. Dependency modification | NO_MATCH | **EXACT_MATCH** ❌ | NO_MATCH ✅ | NO_MATCH ❌ | NO_MATCH ❌ | NO_MATCH ❌ |
| 11 | K. Algorithm modification | NO_MATCH | **NO_MATCH** ✅ | NO_MATCH ✅ | NO_MATCH ❌ | NO_MATCH ❌ | NO_MATCH ❌ |
| 12 | L. Nested control flow | EXACT_MATCH | **EXACT_MATCH** ✅ | EXACT_MATCH ✅ | NO_MATCH ❌ | NO_MATCH ❌ | NO_MATCH ❌ |
| 13 | M. Recursive functions | EXACT_MATCH | **EXACT_MATCH** ✅ | EXACT_MATCH ✅ | NO_MATCH ❌ | NO_MATCH ❌ | NO_MATCH ❌ |
| 14 | N. Large unrelated code insertion | PARTIAL_MATCH | **PARTIAL_MATCH** ✅ | PARTIAL_MATCH ✅ | NO_MATCH ❌ | NO_MATCH ❌ | NO_MATCH ❌ |
| 15 | O. Fragment relocation | EXACT_MATCH | **EXACT_MATCH** ✅ | EXACT_MATCH ✅ | NO_MATCH ❌ | NO_MATCH ❌ | NO_MATCH ❌ |
