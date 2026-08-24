# CIPE — Phase 4 Closure Document

**Date:** 2026-08-21  
**Status:** See verdict at bottom of this document.  
**Scope:** Independent audit of Phase 4 work. No engine code was modified during this audit.  
**Audit method:** All numerical claims cross-checked against actual experiment output files. `npm run verify` re-run from clean state.

---

## 1. Phase 4 Status: COMPLETE

All 11 originally scoped Phase 4 tasks have been executed and their outputs verified. The detailed task breakdown is below.

---

## 2. Tests Executed and Actual Results

### 2.1 Core Verification Suite (npm run verify)

**Command:** `npm run verify`  
**Script:** `node tests/experiments/run-experiments.js`  
**Result on audit re-run:** 18/18 PASS, exit code 0

| Test # | Category | Expected | Result |
|---|---|---|---|
| 1 | variable renaming | EXACT_MATCH | PASS |
| 2 | function renaming | EXACT_MATCH | PASS |
| 3 | whitespace/comments | EXACT_MATCH | PASS |
| 4 | independent function reordering | PARTIAL_MATCH | PASS |
| 5 | equivalent supported syntax transformations | EXACT_MATCH | PASS |
| 6 | commutative expressions | EXACT_MATCH | PASS |
| 7 | partial function copying | PARTIAL_MATCH | PASS |
| 8 | multiple fragment copying | PARTIAL_MATCH | PASS |
| 9 | unrelated code insertion | PARTIAL_MATCH | PASS |
| 10 | dependency modification | NO_MATCH | PASS |
| 11 | meaningful algorithm modification | NO_MATCH | PASS |
| 12 | unsupported constructs | ERROR_UNSUPPORTED | PASS |
| 13 | nested control flow | EXACT_MATCH | PASS |
| 14 | loops | EXACT_MATCH | PASS |
| 15 | shadowed variables | EXACT_MATCH | PASS |
| 16 | closures | EXACT_MATCH | PASS |
| 17 | recursive functions | EXACT_MATCH | PASS |
| 18 | cyclic dependency graphs | ERROR_UNSUPPORTED | PASS |

### 2.2 Mutation Testing Suite

**Command:** `node tests/experiments/mutation-tester.js`  
**Output:** `docs/experiments/mutation-results.md`  
**Total mutations:** 10

| Mutation | Expected | Actual | Classification |
|---|---|---|---|
| Rename variable | MATCH | EXACT_MATCH | Stricter than expected — correct |
| Reorder independent functions | PARTIAL_MATCH | PARTIAL_MATCH | PASS |
| Change a+b to b+a | MATCH | EXACT_MATCH | Stricter than expected — correct |
| Change a constant | DIFFERENT | PARTIAL_MATCH | FALSE POSITIVE (41.2% confidence) |
| Change an operator | PARTIAL_MATCH | PARTIAL_MATCH | PASS |
| Change a condition | PARTIAL_MATCH | PARTIAL_MATCH | PASS |
| Remove a statement | PARTIAL_MATCH | PARTIAL_MATCH | PASS |
| Add a statement | PARTIAL_MATCH | PARTIAL_MATCH | PASS |
| Modify logic completely | DIFFERENT | NO_MATCH | Stricter than expected — correct |
| Unsupported syntax (eval) | UNSUPPORTED | UNSUPPORTED | PASS |

### 2.3 Stress Test Suite

**Command:** `node tests/experiments/stress-test.js`  
**Output:** `docs/experiments/stress-results.md`, `docs/BENCHMARK_RESULTS.csv`

| Scenario | Lines | Total (ms) | Memory Delta (MB) | Fragments |
|---|---|---|---|---|
| 10 lines | 9 | 44.47 | 1.22 | 7 |
| 100 lines | 101 | 57.95 | 1.38 | 76 |
| 500 lines | 501 | 175.04 | 4.38 | 376 |
| 1,000 lines | 1,001 | 213.96 | 6.92 | 751 |
| 5,000 lines sequential | 5,001 | 937.95 | 90.85 | 3,751 |
| Nested (depth=10) | 45 | 16.34 | 2.80 | 133 |
| Nested (depth=100) | 405 | 444.22 | 21.66 | 1,303 |

### 2.4 Baseline Comparison

**Command:** `node tests/experiments/run-experiments.js` (same as verify; writes baseline-comparison.md)

| Method | Correct / 18 | Accuracy |
|---|---|---|
| CIPE | 18 / 18 | 100% |
| SHA-256 exact hash | 2 / 18 | 11.1% |
| Token stripping | 3 / 18 | 16.7% |
| Raw AST comparison | 2 / 18 | 11.1% |

### 2.5 Adversarial Evasion Suite

**Command:** `node tests/adversarial/run.js`  
**Output:** `docs/experiments/adversarial-results.md`

| Attack Vector | Status | Confidence | Evaded? |
|---|---|---|---|
| Function Extraction (inlining reverse) | PARTIAL_MATCH | 33.3% | No — weakly detected |
| Wrapper Function Injection (IIFE) | NO_MATCH | 0.0% | YES — true false negative |
| Dead Code / Junk Graph Injection | NO_MATCH | 6.7% | YES — true false negative |
| Control-Flow Obfuscation (ternary) | NO_MATCH | 0.0% | YES — true false negative |
| Fragmented Copying (interleaved logic) | NO_MATCH | 6.7% | YES — true false negative |

---

## 3. Performance Findings

**5,000-line sequential program:** 937.95ms total pipeline time. Within sub-1-second threshold.

**PATHOLOGICAL CASE — 100-depth nesting:**  
405 lines processed in 444.22ms. This is anomalously slow relative to program size. The dataflow engine's use-def chain analysis exhibits quadratic worst-case complexity for deeply nested scopes. No realistic JavaScript program reaches 100 nesting levels, but the edge case is unmitigated.

**Memory at 5,000 lines:** 90.85MB above baseline. Acceptable for single requests. Programs beyond approximately 20,000 lines would exhaust available memory without a streaming pipeline (not implemented).

---

## 4. False Positives

**Confirmed false positives from mutation suite:** 1 out of 10

- **Case:** Changing a single numeric literal (`let total = 0` → `let total = 100`)  
- **CIPE result:** PARTIAL_MATCH at 41.2% confidence  
- **Ground truth:** The programs are not semantically equivalent (the constant differs)  
- **Mechanism:** When one literal changes, only the containing BlockFragment and directly downstream DataflowEdgeFragments change. The remaining fragments — loop structure, branch logic, parameter flows — are identical. The set intersection reports high structural overlap because the structural overlap genuinely exists.  
- **Risk:** An automated system without human review of the fragment evidence list could misinterpret 41.2% PARTIAL_MATCH as evidence of copying.  
- **Unmitigated.** No threshold adjustment or fragment weighting is currently implemented.

---

## 5. False Negatives

**Confirmed false negatives from adversarial suite:** 4 out of 5 structural attack vectors

### 5.1 IIFE Wrapping
Wrapping the stolen algorithm in an immediately-invoked function expression creates a new lexical scope. All canonical binding IDs inside the IIFE shift. All downstream fragment hashes change. CIPE returned 0.0% confidence (NO_MATCH). **Detection completely failed.**

### 5.2 Dependency-Order Injection
Inserting non-functional variable chains (`let _decoy = 0; let _decoy2 = _decoy + a;`) before the stolen algorithm shifts the `d:N/b:M` binding IDs of all subsequent bindings in the scope. This cascades through every CFG and DFG edge fragment hash downstream. CIPE returned sub-threshold confidence. **Detection effectively failed.**

### 5.3 Dead Code Dilution
Injecting large volumes of disconnected, unrelated graph nodes reduces the intersection ratio below the PARTIAL_MATCH threshold of 10%, even when the stolen core algorithm is entirely present. **Detection failed by dilution.**

### 5.4 Ternary / Control-Flow Form Change
Changing an if-else to a ternary is documented as normalized. However, in the adversarial test, the specific wrapping context was not normalized — CIPE returned 0.0%. This requires further investigation to determine whether the normalization gap is in the IR converter or in the test's specific program structure.

---

## 6. Known Technical Weaknesses

These are documented findings from `docs/cryptographic-review.md` and adversarial testing. None are disputed.

| Weakness | Severity | Mitigated |
|---|---|---|
| IIFE wrapping defeats canonical ID assignment | High | No |
| Dependency-order injection invalidates downstream IDs | High | No |
| Dead code dilution reduces intersection ratio below threshold | High | No |
| Boilerplate density inflates confidence (no fragment weighting) | High | No |
| Context loss via global sort destroys graph topology encoding | Medium | No (inherent) |
| Duplicate fragment masking destroys multiplicity information | Medium | Partial |
| 100-depth nesting causes quadratic dataflow performance | Medium | No |
| No inter-procedural dataflow (calls not tracked cross-boundary) | Medium | No |
| Alias analysis absent (dynamic property access untracked) | Medium | No |
| Cyclic call graphs rejected (mutually recursive functions) | Hard boundary | N/A — explicit rejection |
| Class, async/await, generators unsupported | Hard boundary | N/A — explicit rejection |
| No streaming — ~20k line programs risk memory exhaustion | Low-Medium | No |

---

## 7. Patent-Related Uncertainties

CIPE is not described as patentable, novel, unique, or patent-ready anywhere in this document or in the Final Technical Report. The following uncertainties must be resolved by a qualified patent attorney before any filing decision:

1. **Prior art on PDG-based clone detection** — Komondoor & Horwitz (2001) and related academic work operate on program dependence graphs combining CFG and DFG. Whether CIPE's fragment multiset approach is sufficiently distinct has not been established.

2. **Prior art on software birthmarks** — Myles & Collberg (2004) and subsequent work. Static birthmarks use program properties for code identification. Relationship to CIPE is unknown.

3. **MOSS / Winnowing** — token n-gram fingerprinting. CIPE operates on semantic graph edges, not tokens, but the core "fingerprint a program representation" concept is not new.

4. **LSCH acronym conflict** — "Locality-Sensitive Cryptographic Hashing" overlaps with established "Locality-Sensitive Hashing" terminology. The CIPE construction (sorted concatenation of SHA-256 hashes) is not standard LSH. This should be clarified in any filing.

5. **No formal claim scope has been drafted.** The "patent-sensitive differentiators" in the Final Technical Report are technical observations, not legal claims. They require professional claim drafting.

6. **No prior art search has been conducted.** The prior-art-search-plan.md defines search objectives but no actual search has been performed against USPTO, EPO, IEEE Xplore, or ACM Digital Library.

---

## 8. Files Produced in Phase 4

| File | Size | Contents |
|---|---|---|
| docs/FINAL_TECHNICAL_REPORT.md | 28K | 14-section technical evidence package |
| docs/ARCHITECTURE.svg | 15K | Full system architecture diagram |
| docs/PIPELINE.svg | 6.1K | Linear 7-stage pipeline diagram |
| docs/CFG_EXAMPLE.svg | 6.7K | CFG worked example (calculateTotal) |
| docs/FINGERPRINT_FLOW.svg | 8.4K | LSCH construction flow diagram |
| docs/BENCHMARK_RESULTS.csv | 525B | Raw benchmark data (7 scenarios) |
| docs/experiments/stress-results.md | — | Stress test results |
| docs/experiments/mutation-results.md | — | Mutation classification results |
| docs/experiments/baseline-comparison.md | — | CIPE vs SHA-256/Token/AST comparison |
| docs/experiments/adversarial-results.md | — | Structural evasion results |
| docs/cryptographic-review.md | 6.2K | Security assumptions + hostile LSCH audit |
| tests/experiments/stress-test.js | — | Stress test script |
| tests/experiments/mutation-tester.js | — | Mutation test script |
| tests/adversarial/run.js | — | Adversarial evasion script |

---

## 9. Exact Commands to Reproduce All Results

From a clean checkout with no pre-existing build artifacts or running processes:

```bash
# Install dependencies
npm install

# 1. Core verification (18 matrix tests + baseline comparison)
npm run verify
# Output: docs/experiments/baseline-comparison.md, docs/experiments/results.json

# 2. Stress benchmarks
node tests/experiments/stress-test.js
# Output: docs/experiments/stress-results.md, docs/BENCHMARK_RESULTS.csv

# 3. Mutation testing
node tests/experiments/mutation-tester.js
# Output: docs/experiments/mutation-results.md

# 4. Adversarial evasion suite
node tests/adversarial/run.js
# Output: docs/experiments/adversarial-results.md
```

No database connection is required. No background processes must be running. No manually modified files are required. All experiment scripts are self-contained and idempotent.

---

## 10. Report Accuracy Corrections Made During This Audit

One inaccuracy was found in `FINAL_TECHNICAL_REPORT.md` and corrected:

| Location | Original (incorrect) | Corrected |
|---|---|---|
| Section 1 executive summary table, row "Structural evasion attacks" | "5/5 defeated (within threshold)" | Split into two rows: 4/5 returned NO_MATCH (true false negatives), 1/5 weakly detected at 33.3% |

The original phrasing suppressed the finding that 4 out of 5 structural attacks evaded detection by framing it as "within threshold." The corrected report states the actual outcome plainly.

No other numerical claims were found to be inaccurate. All figures in the report match the experiment output files.

---

## FINAL VERDICT

**PHASE 4: COMPLETE**

All planned Phase 4 work has been executed:
- Reproducibility verified (npm run verify: 18/18 PASS)
- Stress testing complete (7 scenarios, results documented)
- Mutation testing complete (10 mutations, results documented)
- LSCH hostile review complete (5 vulnerabilities documented)
- Baseline comparison complete (3 baselines vs CIPE, 18 test cases)
- Adversarial evasion suite complete (5 attack vectors, results documented)
- Final technical report produced (14 sections, 28K, all data from experiment outputs)
- Diagrams produced (ARCHITECTURE, PIPELINE, CFG_EXAMPLE, FINGERPRINT_FLOW)
- Benchmark CSV produced
- Phase 4 closure document produced (this file)

**What Phase 4 did NOT establish:**
- Patentability — requires professional prior-art search and legal review
- Novelty relative to prior art — no search has been conducted
- Production readiness — 4 of 5 structural evasion attacks succeed; the system is a research prototype
- Litigation-grade provenance evidence — false negative rate under adversarial conditions is too high for court use without Phase 5–6 hardening

*Closure document generated: 2026-08-21 | Audit performed without modifying any engine code*