# Phase 3 Experiment Results

| ID | Category | Expected | CIPE | Exact Hash | Token Match |
|---|---|---|---|---|---|
| 1 | variable renaming | EXACT_MATCH | EXACT_MATCH ✅ | NO_MATCH ❌ | NO_MATCH ❌ |
| 2 | function renaming | EXACT_MATCH | EXACT_MATCH ✅ | NO_MATCH ❌ | NO_MATCH ❌ |
| 3 | whitespace/comments | EXACT_MATCH | EXACT_MATCH ✅ | NO_MATCH ❌ | MATCH ✅ |
| 4 | independent function reordering | PARTIAL_MATCH | PARTIAL_MATCH ✅ | NO_MATCH ❌ | NO_MATCH ❌ |
| 5 | equivalent supported syntax transformations | EXACT_MATCH | EXACT_MATCH ✅ | NO_MATCH ❌ | NO_MATCH ❌ |
| 6 | commutative expressions | EXACT_MATCH | EXACT_MATCH ✅ | NO_MATCH ❌ | NO_MATCH ❌ |
| 7 | partial function copying | PARTIAL_MATCH | PARTIAL_MATCH ✅ | NO_MATCH ❌ | NO_MATCH ❌ |
| 8 | multiple fragment copying | PARTIAL_MATCH | PARTIAL_MATCH ✅ | NO_MATCH ❌ | NO_MATCH ❌ |
| 9 | unrelated code insertion | PARTIAL_MATCH | PARTIAL_MATCH ✅ | NO_MATCH ❌ | NO_MATCH ❌ |
| 10 | dependency modification | NO_MATCH | NO_MATCH ✅ | NO_MATCH ❌ | NO_MATCH ❌ |
| 11 | meaningful algorithm modification | NO_MATCH | NO_MATCH ✅ | NO_MATCH ❌ | NO_MATCH ❌ |
| 12 | unsupported constructs | ERROR_UNSUPPORTED | ERROR_UNSUPPORTED ✅ | MATCH ❌ | MATCH ❌ |
| 13 | nested control flow | EXACT_MATCH | EXACT_MATCH ✅ | NO_MATCH ❌ | NO_MATCH ❌ |
| 14 | loops | EXACT_MATCH | EXACT_MATCH ✅ | NO_MATCH ❌ | NO_MATCH ❌ |
| 15 | shadowed variables | EXACT_MATCH | EXACT_MATCH ✅ | NO_MATCH ❌ | NO_MATCH ❌ |
| 16 | closures | EXACT_MATCH | EXACT_MATCH ✅ | NO_MATCH ❌ | NO_MATCH ❌ |
| 17 | recursive functions | EXACT_MATCH | EXACT_MATCH ✅ | NO_MATCH ❌ | NO_MATCH ❌ |
| 18 | cyclic dependency graphs | ERROR_UNSUPPORTED | ERROR_UNSUPPORTED ✅ | MATCH ❌ | MATCH ❌ |
