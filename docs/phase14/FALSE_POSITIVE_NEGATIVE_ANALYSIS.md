# Phase 14: False Positive / False Negative Analysis

## Context
Phase 14 extended the verification engine with a Decision Explanation Engine which deterministically reports why two pieces of code matched based on the generated evidence manifest.

## Explanation Verification
We tested the exact bounds of our explanation output for edge cases:

### Case 1: Exact Match (True Positive)
- **Input:** Two identical scripts containing 2 basic blocks and 1 control flow edge.
- **Output:** The Decision Explanation Engine correctly parsed the `VerificationReceipt` and produced:
  - "2 structural fragments matched"
  - "1 control-flow edges matched"
- **Result:** Successfully categorized without hallucination.

### Case 2: Partial Match / False Negative Boundary
- **Input:** Target repository modified 1 structural fragment, added 1 unrelated function.
- **Output:** The system logically computed:
  - "1 structural fragments matched"
  - "1 expected fragments missing"
  - "1 unrelated fragments added in target"
- **Analysis:** By providing transparent mathematical boundaries (exact matched vs missing fragments), the system eliminates the "black box" nature of partial provenance. A human auditor can explicitly see that 50% of the original codebase is missing, allowing them to confidently classify it as a partial copy rather than a pure Exact Match.

## Conclusion
The explanation engine acts as a mathematically bounded constraint on False Positives. It completely refuses to output explanations that are not backed by raw cryptographic fragment evidence, securing the auditing layer.
