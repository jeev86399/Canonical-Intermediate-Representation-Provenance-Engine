# Phase 9: Canonicalization Attacks

## Objective
To identify if the IR Canonicalizer performs "unsafe normalizations" where two meaningfully different programs produce the exact same topological fingerprint.

## Tested Variants
1. **Operator Changes**: e.g., `a + b` vs `a * b`. 
   - **Result**: Different fingerprints. The `operator` property of the `BinaryExpression` is retained during identifier erasure.
2. **Boolean Logic Short-Circuiting**: `a && b` vs `a || b`. 
   - **Result**: Different fingerprints. The `operator` property differs.
3. **Comparison Direction**: `a < b` vs `b > a`.
   - **Result**: The canonicalizer in Phase 2 explicitly normalizes `b > a` to `a < b` by swapping the operands and flipping the operator. 
   - **Security Implication**: This is a safe and intended normalization to prevent obfuscation. They yield the same fingerprint, as desired.
4. **Loop Conditions**: `while (i < 10)` vs `for (; i < 10;)`.
   - **Result**: Acorn parses these as distinct AST node types (`WhileStatement` vs `ForStatement`), so they currently produce different structural fingerprints.
   - **Security Implication**: An attacker can evade detection by converting `while` to `for`. 
   - **Recommendation**: The canonicalizer should eventually normalize `ForStatement` into `WhileStatement` to improve robustness, but this is a robustness improvement, not a cryptographic weakness.

## Conclusion
No *unsafe* canonicalization vulnerabilities were found. Distinct business logic generates distinct topological hashes. The only variations are known evasion vectors (e.g., `while` vs `for`), which represent False Negatives (evasion), not False Positives (collisions).
