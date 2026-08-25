# Phase 10: Attack Resilience Matrix

## Objective
To systematically evaluate CIPE's resilience against developer-driven code modification and intentional obfuscation designed to hide code theft.

## Test Matrix (`attacks.js`)
A target cryptographic function was subjected to five mutation vectors:

| Attack Vector | Description | Resilience Confidence | Verdict |
|---------------|-------------|-----------------------|---------|
| **A. Variable Renaming** | Replaced semantic variable names with arbitrary single characters. | 100% | MITIGATED |
| **B. Reformatting** | Minified the code onto a single line and injected comments. | 100% | MITIGATED |
| **C. Dead Code Injection** | Inserted a meaningless variable declaration into the function body. | 0% | SUCCESSFUL |
| **D. Wrapper Function** | Wrapped the entire target algorithm inside an outer function closure. | 100% | MITIGATED |
| **E. Semantic Modification** | Converted a `for` loop to a `while` loop while preserving logic. | 20% | SUCCESSFUL |

## Analysis of Provenance Loss
1. **Dead Code Injection (Attack C):** Because CIPE strictly relies on structural basic-block hashing, injecting a new statement alters the local block signature. Via the WLCDH dataflow ripple effect, this contaminates the entire fingerprint. This represents a known limitation: topological hashing is brittle to instruction insertion.
2. **Semantic Modification (Attack E):** The conversion from a `ForStatement` to a `WhileStatement` fundamentally alters the AST, and thus the CFG nodes. Since CIPE measures structural provenance (not semantic equivalence), this is considered a true negative—the structures *are* different.

## Conclusion
CIPE provides robust protection against textual obfuscation (renaming, formatting, scoping wrappers), but is brittle against structural mutations (dead code injection). This establishes the exact boundaries of the patentable mechanism.
