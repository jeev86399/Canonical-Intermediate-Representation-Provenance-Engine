# CIPE Mutation Testing Results

| Mutation | Expected Classification | Actual Classification | Result | Confidence |
|---|---|---|---|---|
| Rename variable | MATCH | EXACT_MATCH | ❌ | 100.0% |
| Reorder independent functions (wrapped) | PARTIAL_MATCH | PARTIAL_MATCH | ✅ | 70.6% |
| Change a+b to b+a | MATCH | EXACT_MATCH | ❌ | 100.0% |
| Change a constant | DIFFERENT | PARTIAL_MATCH | ❌ | 41.2% |
| Change an operator | PARTIAL_MATCH | PARTIAL_MATCH | ✅ | 47.1% |
| Change a condition | PARTIAL_MATCH | PARTIAL_MATCH | ✅ | 58.8% |
| Remove a statement | PARTIAL_MATCH | PARTIAL_MATCH | ✅ | 50.0% |
| Add a statement | PARTIAL_MATCH | PARTIAL_MATCH | ✅ | 41.2% |
| Modify function logic completely | DIFFERENT | NO_MATCH | ❌ | 0.0% |
| Unsupported Syntax (eval) | UNSUPPORTED | UNSUPPORTED | ✅ | 0.0% |

## Summary
- Total Mutations: 10
- False Positives: 1
- False Negatives: 3
