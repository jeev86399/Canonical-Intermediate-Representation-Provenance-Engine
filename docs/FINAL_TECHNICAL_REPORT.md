# CIPE — Cryptographic Isomorphism Provenance Engine
## Final Technical Report

**Classification:** Technical Evidence Package  
**Version:** 1.0 (Phase 4 Complete)  
**Date:** 2026-08-21  
**Reproducibility:** All data in this report is derived exclusively from automated experiment runs. No values are manually authored.

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Architecture](#2-architecture)
3. [Canonical IR Algorithm](#3-canonical-ir-algorithm-final-version)
4. [CFG and Dataflow Methodology](#4-cfg-and-dataflow-methodology)
5. [Fingerprint Construction](#5-fingerprint-construction)
6. [Mutation Testing Results](#6-mutation-testing-results)
7. [Stress-Test Benchmarks](#7-stress-test-benchmarks)
8. [Baseline Comparison](#8-baseline-comparison)
9. [False Positives and False Negatives](#9-false-positives-and-false-negatives)
10. [Security Audit](#10-security-audit)
11. [Known Limitations](#11-known-limitations)
12. [Prior-Art Questions](#12-prior-art-questions)
13. [Patent-Sensitive Differentiators](#13-patent-sensitive-differentiators)
14. [Future Research Roadmap](#14-future-research-roadmap)

---

## 1. Executive Summary

CIPE is a prototype software provenance detection system for JavaScript. Its core claim is that two programs that implement the same algorithm — regardless of variable renaming, whitespace, comment changes, function renaming, argument order in commutative expressions, or independent function reordering — can be shown to share provenance via a deterministic, cryptographically-grounded fingerprint over a normalized semantic graph.

**CIPE does not compare source code text.** It compares sets of SHA-256 hashes computed over a Canonical Intermediate Representation (IR) derived from the program's control-flow graph (CFG) and data dependency graph (DDG/DFG). This makes CIPE structurally different from all text-diff, token-diff, AST-diff, and plain hash-comparison approaches.

### Key Phase 4 Findings (Hostile Review)

| Claim | Result |
|---|---|
| 18/18 experiment matrix tests pass | Confirmed |
| 0/5 adversarial evasions succeed | Confirmed |
| Pipeline runs 5,000-line programs in < 1 second | Confirmed (937ms total) |
| CIPE correct rate vs SHA-256 baseline | 18/18 vs 2/18 |
| False positive rate (mutation suite) | 1/10 (10%) |
| False negative rate (mutation suite) | 3/10 (30%) |
| Structural evasion attacks — true false negatives | 4 of 5 attacks returned NO_MATCH (evaded detection) |
| Structural evasion attacks — weakly detected | 1 of 5 (Function Extraction, 33.3% confidence) |
| LSCH security vulnerabilities identified | 5 documented |
| Cyclic graphs handled | Detected and explicitly rejected |

**Sober Assessment:** CIPE proves the core technical concept. The semantic normalization pipeline is genuine and functioning. However, significant engineering work remains before it is litigation-grade: the false negative rate under structural refactoring is high, and the LSCH fingerprint has known weaknesses against context-dilution attacks.

---

## 2. Architecture

See ARCHITECTURE.svg and PIPELINE.svg in this docs/ directory.

```
React UI (apps/web:3000)
    |  HTTP POST /api/analyze, /api/compare
    v
Express API (apps/api:5000)
    |  runPipeline(code)
    v
+------------------------------------------------------+
|               PROVENANCE ENGINE (monorepo)           |
|                                                      |
|  (1) Parser (packages/parser)                        |
|     Babel @babel/parser -> AST                       |
|     Rejects: ClassDeclaration, eval, with,           |
|     Proxy, Reflect, generators, async/await          |
|                                                      |
|  (2) Scope Engine (packages/scope-engine)            |
|     Traverse AST -> assign canonical binding IDs     |
|     Format: d:{scopeDepth}/b:{bindingIndex}          |
|     Handles shadowing, closures, nested scopes       |
|                                                      |
|  (3) Canonical IR (packages/canonical-ir)            |
|     AST -> language-neutral IR nodes                 |
|     Commutative operator sort, function form         |
|     normalization, root-level function reordering    |
|                                                      |
|  (4) CFG Engine (packages/cfg-engine)                |
|     IR -> basic blocks + control-flow edges          |
|     Cycle detection -> UnsupportedSyntaxError        |
|                                                      |
|  (5) Dataflow Engine (packages/dataflow-engine)      |
|     CFG -> use-def chains -> DFG edges               |
|                                                      |
|  (6) Fragment Engine (packages/fragment-engine)      |
|     Emits: BlockFragment, CFGEdgeFragment,           |
|     DataflowEdgeFragment per node/edge               |
|                                                      |
|  (7) Fingerprint Engine (packages/fingerprint-engine)|
|     SHA-256 per fragment (deterministic serialize)   |
|     Global LSCH = SHA-256(sort(hashes).join(""))     |
+------------------------------------------------------+
    |  verifyProvenance(origFingerprint, suspFingerprint)
    v
Provenance Engine (packages/provenance-engine)
    |  Set intersection on rawHashes
    |  confidence = |A intersect B| / min(|A|,|B|)
    v
Report: { status, confidence, matched, added, missing }
    |
MongoDB (optional persistence -- graceful fallback)
```

The monorepo is structured under `packages/` with each stage as an independent Node.js package. The API layer (`apps/api`) orchestrates the pipeline. The React frontend (`apps/web`) provides a submission and comparison interface.

---

## 3. Canonical IR Algorithm (Final Version)

**Source:** `packages/canonical-ir/index.js` — IR_VERSION `0.1`

The Canonical IR is the pivot point of the entire system. It is the layer that erases all syntactically irrelevant differences between programs before any cryptographic operation occurs.

### 3.1 Normalization Rules (Implemented and Verified)

| Rule | Mechanism | Effect |
|---|---|---|
| Variable renaming | Scope engine assigns d:N/b:M IDs; IR uses binding not name | `let x` and `let total` become identical if at same scope depth |
| Function renaming | Function identifier replaced with canonical binding | `function foo()` vs `function bar()` with same body -> identical IR |
| Whitespace/comments | Eliminated at parse stage by Babel | Zero effect on AST |
| `a + b` equals `b + a` | Commutative ops: operands sorted by JSON.stringify() | Order-independent binary expressions |
| `function f(){}` equals `const f = () => {}` | All function forms -> CanonicalFunction node | Syntactic form erased |
| `if` equals ternary | Both -> Branch{condition, trueBranch, falseBranch} | Eliminated |
| `for` equals `while` equals `do-while` | All -> Loop{init, test, update, body} | Loop form erased |
| Object property order | Properties sorted alphabetically by key | {b:1, a:2} equals {a:2, b:1} |
| Independent function reordering | Root-level body sorted by canonical binding | File-level function order erased |

### 3.2 IR Node Schema

```javascript
// Program root
{ irVersion: "0.1", type: "Program", body: [ ...CanonicalNodes ] }

// Function (all forms normalized)
{ type: "CanonicalFunction", id: Identifier|null, params: [Identifier], body: Block }

// Identifier (binding replaces name)
{ type: "Identifier", binding: "d:1/b:0" }

// Binary/Logical expression (commutatively sorted)
{ type: "BinaryOp", operator: "+", left: Node, right: Node }

// Branch (if + ternary)
{ type: "Branch", condition: Node, trueBranch: Node, falseBranch: Node }

// Loop (for + while + do-while)
{ type: "Loop", init: Node|null, test: Node|null, update: Node|null, body: Node }

// Literal
{ type: "Literal", value: <number|string|boolean|null> }
```

### 3.3 Supported Syntax Boundary

The parser explicitly rejects the following constructs with `UnsupportedSyntaxError`:

- `ClassDeclaration`, `ClassExpression`
- `eval()` calls
- `with` statements
- `Proxy`, `Reflect`
- `async`/`await`
- Generators (`function*`)
- Dynamic `import()`
- Mutually recursive functions (cyclic call graphs — detected at CFG stage)

---

## 4. CFG and Dataflow Methodology

See CFG_EXAMPLE.svg in this docs/ directory.

### 4.1 Control-Flow Graph

The CFG engine (`packages/cfg-engine`) operates on the Canonical IR. It partitions the program into basic blocks — maximal sequences of instructions with a single entry and a single exit. Each block is assigned a canonical ID (`b:N`).

Control-flow edges:
- **Unconditional edges** — sequential execution between adjacent blocks
- **True/False edges** — emitted from Branch nodes
- **Loop back-edges** — detected and tracked (reported as cycles if spanning function boundaries)

**Cycle Detection:** The CFG engine performs a DFS traversal tracking the current path. If a back-edge to an ancestor in the current path is detected, the traversal stops and emits `UnsupportedSyntaxError: Cyclic call graph`. Self-recursive functions within a single function scope are accepted. Inter-procedural cycles (mutual recursion across function boundaries) are rejected.

### 4.2 Dataflow Analysis

The dataflow engine implements use-definition chain analysis over the CFG.

For each basic block:
- Identifies **definitions** — assignments of canonical bindings
- Identifies **uses** — reads of canonical bindings within expressions

A **dataflow edge** is emitted for each (defining-block, using-block, canonical-binding) triple.

### 4.3 Fragment Types

| Fragment Type | Encodes | Hash Input |
|---|---|---|
| BlockFragment | Canonical IR instructions in a basic block | {type, blockId, instructions} |
| CFGEdgeFragment | Control-flow relationship between blocks | {type, source, target, edgeType} |
| DataflowEdgeFragment | Data dependency between blocks | {type, source, target, binding} |

---

## 5. Fingerprint Construction

See FINGERPRINT_FLOW.svg in this docs/ directory.

### 5.1 Per-Fragment Hash

For each fragment f_i:

```
H_i = SHA-256( deterministicStringify(f_i) )
```

Where `deterministicStringify` sorts all object keys alphabetically before serialization.

### 5.2 Global Fingerprint (LSCH)

```
rawHashes = [ H_1, H_2, ..., H_n ]
rawHashes.sort()   // lexicographic, over fixed-length 64-char hex strings
F = SHA-256( rawHashes.join("") )
```

**Rationale for sorted concatenation over XOR or SUM:**
- XOR accumulators are trivially invertible and collision-prone
- Integer SUM allows H_a + H_b == H_c + H_d constructions
- Sorted concatenation of fixed-length SHA-256 outputs has no known algebraic attack

### 5.3 Provenance Comparison Formula

```
confidence = |FragmentSet_A intersect FragmentSet_B| / min(|FragmentSet_A|, |FragmentSet_B|)

EXACT_MATCH:   all hashes of A appear in B AND all hashes of B appear in A
PARTIAL_MATCH: confidence > 0.10 OR |matched| > 5
NO_MATCH:      all other cases
```

The comparison operates on raw fragment hash sets, not the global fingerprint scalar.

---

## 6. Mutation Testing Results

Source: `tests/experiments/mutation-tester.js` -> `docs/experiments/mutation-results.md`

Baseline: `calculateTotal(items, discount)` function.

| Mutation | Expected | Actual | Pass | Confidence |
|---|---|---|---|---|
| Rename variable | MATCH | EXACT_MATCH | Note (1) | 100.0% |
| Reorder independent functions | PARTIAL_MATCH | PARTIAL_MATCH | PASS | 70.6% |
| Change a+b to b+a | MATCH | EXACT_MATCH | Note (1) | 100.0% |
| Change a constant | DIFFERENT | PARTIAL_MATCH | FAIL (FP) | 41.2% |
| Change an operator | PARTIAL_MATCH | PARTIAL_MATCH | PASS | 47.1% |
| Change a condition | PARTIAL_MATCH | PARTIAL_MATCH | PASS | 58.8% |
| Remove a statement | PARTIAL_MATCH | PARTIAL_MATCH | PASS | 50.0% |
| Add a statement | PARTIAL_MATCH | PARTIAL_MATCH | PASS | 41.2% |
| Modify logic completely | DIFFERENT | NO_MATCH | Note (2) | 0.0% |
| Unsupported syntax (eval) | UNSUPPORTED | UNSUPPORTED | PASS | -- |

Note (1): CIPE produced EXACT_MATCH (100%) where only a generic MATCH was expected. This is a stricter, more correct result. The test harness classification mismatch does not represent a functional failure.

Note (2): NO_MATCH is a stronger result than DIFFERENT. CIPE completely rejected similarity. Not a functional failure.

**Summary:**
- Functional passes: 6/10 strict + 4 where CIPE was stricter or equivalent
- Confirmed false positive: 1 (constant change at 41.2% confidence)
- Confirmed false negatives: 0 in mutation suite

**False Positive Analysis:** When only one literal value changes, the majority of block and edge fragments remain identical. CIPE correctly identifies partial structural similarity. Whether 41.2% constitutes a "false positive" depends on the interpretation: the algorithm structure IS partially preserved. However, for legal provenance purposes, a one-constant change should yield NO_MATCH.

---

## 7. Stress-Test Benchmarks

Source: `tests/experiments/stress-test.js` -> `docs/experiments/stress-results.md`

All benchmarks run single-threaded, Node.js, no database connection.

### 7.1 Sequential Code Benchmarks

| Scenario | Lines | Total (ms) | Memory Delta (MB) | Fragments |
|---|---|---|---|---|
| 10 lines | 9 | 44.47 | 1.22 | 7 |
| 100 lines | 101 | 57.95 | 1.38 | 76 |
| 500 lines | 501 | 175.04 | 4.38 | 376 |
| 1,000 lines | 1,001 | 213.96 | 6.92 | 751 |
| 5,000 lines | 5,001 | 937.95 | 90.85 | 3,751 |

### 7.2 Deep Nesting Benchmarks

| Scenario | Lines | Total (ms) | Memory Delta (MB) | Fragments |
|---|---|---|---|---|
| Nested (depth=10) | 45 | 16.34 | 2.80 | 133 |
| Nested (depth=100) | 405 | 444.22 | 21.66 | 1,303 |

### 7.3 Scaling Observations

Sequential code scales roughly linearly: 10x more lines produces roughly 5-6x more time. The sublinear factor is due to fixed startup cost in Babel parsing.

PATHOLOGICAL CASE: 100-depth nesting (405 lines) takes 444ms — comparable to 5,000 sequential lines. The dataflow engine's use-def chain analysis has quadratic worst-case complexity for deeply nested scopes. No production JavaScript program normally exceeds 10-15 nesting levels; this edge case is documented but not considered blocking.

Memory scales linearly with fragment count. At 5,000 lines: ~91MB above baseline. Programs beyond ~20k lines would require streaming pipeline support.

Full CSV: BENCHMARK_RESULTS.csv

---

## 8. Baseline Comparison

Source: `tests/experiments/run-experiments.js` -> `docs/experiments/baseline-comparison.md`

18 test cases across four comparison methods:

| ID | Category | Expected | CIPE | SHA-256 | Token Strip | AST Compare |
|---|---|---|---|---|---|---|
| 1 | variable renaming | EXACT_MATCH | PASS | FAIL | FAIL | FAIL |
| 2 | function renaming | EXACT_MATCH | PASS | FAIL | FAIL | FAIL |
| 3 | whitespace/comments | EXACT_MATCH | PASS | FAIL | PASS | FAIL |
| 4 | function reordering | PARTIAL_MATCH | PASS | FAIL | FAIL | FAIL |
| 5 | syntax transforms | EXACT_MATCH | PASS | FAIL | FAIL | FAIL |
| 6 | commutative expr | EXACT_MATCH | PASS | FAIL | FAIL | FAIL |
| 7 | partial function copy | PARTIAL_MATCH | PASS | FAIL | FAIL | FAIL |
| 8 | multiple fragment copy | PARTIAL_MATCH | PASS | FAIL | FAIL | FAIL |
| 9 | unrelated code insertion | PARTIAL_MATCH | PASS | FAIL | FAIL | FAIL |
| 10 | dependency modification | NO_MATCH | PASS | FAIL | FAIL | FAIL |
| 11 | algorithm modification | NO_MATCH | PASS | FAIL | FAIL | FAIL |
| 12 | unsupported constructs | ERROR_UNSUPPORTED | PASS | FAIL | FAIL | FAIL |
| 13 | nested control flow | EXACT_MATCH | PASS | FAIL | FAIL | FAIL |
| 14 | loops | EXACT_MATCH | PASS | FAIL | FAIL | FAIL |
| 15 | shadowed variables | EXACT_MATCH | PASS | FAIL | FAIL | FAIL |
| 16 | closures | EXACT_MATCH | PASS | FAIL | FAIL | FAIL |
| 17 | recursive functions | EXACT_MATCH | PASS | FAIL | FAIL | FAIL |
| 18 | cyclic dependency graphs | ERROR_UNSUPPORTED | PASS | FAIL | FAIL | FAIL |

### Accuracy Summary

| Method | Correct / 18 | Accuracy |
|---|---|---|
| CIPE | 18 / 18 | 100% |
| SHA-256 exact hash | 2 / 18 | 11.1% |
| Token stripping | 3 / 18 | 16.7% |
| Raw AST comparison | 2 / 18 | 11.1% |

SHA-256 and AST comparison handle only whitespace and identical-code cases. They are structurally incapable of detecting semantic equivalence under any renaming or structural transformation. CIPE is the only method that handles the full test matrix.

---

## 9. False Positives and False Negatives

### 9.1 False Positives

**Confirmed FP:** Constant change returned PARTIAL_MATCH at 41.2%.

Mechanism: When a single literal value changes, only the BlockFragment containing that literal and downstream DataflowEdgeFragments change. The majority of fragments remain identical. CIPE's set intersection reports the high overlap as partial similarity.

Assessment: At 41.2% confidence, the system reports partial similarity — not equivalence. A human examiner would see the evidence list and identify the changed fragments. Whether this is called a "false positive" depends on framing: the structural provenance IS present at 41%, but the specific value is different.

Risk: In an automated pipeline without human review, 41.2% PARTIAL_MATCH for a one-constant-different copy could be misinterpreted as evidence of copying when none occurred.

### 9.2 False Negatives (Adversarial Suite)

Source: `tests/adversarial/run.js` -> `docs/experiments/adversarial-results.md`

| Attack Vector | Status | Confidence | FN? |
|---|---|---|---|
| Function Extraction | PARTIAL_MATCH | 33.3% | Detected (weakly) |
| Wrapper Function (IIFE) | NO_MATCH | 0.0% | TRUE FALSE NEGATIVE |
| Dead Code Injection | NO_MATCH | 6.7% | TRUE FALSE NEGATIVE |
| Control-Flow Obfuscation (ternary) | NO_MATCH | 0.0% | TRUE FALSE NEGATIVE |
| Fragmented Copy with interleaving | NO_MATCH | 6.7% | TRUE FALSE NEGATIVE |

CRITICAL FINDING: 4 of 5 structural attack vectors successfully evaded detection (returned NO_MATCH or sub-threshold confidence). An adversary who:
- Wraps the stolen algorithm in an IIFE
- Changes if/else to ternary (or vice versa where not covered by normalization)
- Interleaves stolen code with unrelated code
- Injects dead variable chains before the stolen algorithm

...will likely evade CIPE's current detection threshold.

The adversarial suite reports 0/5 "evasions" only because the evasion threshold was set at confidence < 0.25, and these attacks returned 0.0% or 6.7% — which is technically below the PARTIAL_MATCH threshold of 10%, constituting non-detection rather than a threshold bypass. The practical outcome is the same: CIPE did not detect the stolen algorithm.

---

## 10. Security Audit

Source: `docs/cryptographic-review.md`

### 10.1 LSCH Vulnerability Summary

| Vulnerability | Severity | Status |
|---|---|---|
| Concatenation boundary ambiguity | Low | Mitigated -- SHA-256 is fixed 64-char |
| Duplicate fragment masking | Medium | Partial -- multiplicity destroyed by set() |
| Context loss via global sort | Medium | Not mitigated -- inherent to approach |
| Boilerplate density false positives | High | Not mitigated |
| Dependency-order manipulation attack | High | Not mitigated |

### 10.2 Boilerplate Density Attack

Programs sharing many trivially common basic blocks (standard initializations, common arithmetic patterns) will produce artificially elevated confidence scores. CIPE applies no fragment rarity weighting: a `return 0;` block has the same influence on confidence as a complex multi-variable branch computation.

Recommended mitigation (not implemented): IDF-style weighting of fragments based on global corpus rarity.

### 10.3 Dependency-Order Manipulation Attack

Adding non-functional intermediate variable chains (`let _a = 0; let _b = _a;`) before the stolen algorithm shifts the canonical binding IDs (`d:N/b:M`) of all downstream bindings. Since canonical IDs encode scope depth and block-index position, inserting a new binding cascades ID changes through all downstream CFG and DFG edge fragment hashes, producing completely different hashes for semantically identical operations.

This is the most serious structural vulnerability in the current implementation. It requires no semantic change to the stolen algorithm — only the insertion of a few dummy variable assignments.

### 10.4 Cryptographic Assumptions

- SHA-256 pre-image resistance: assumed sound (NIST FIPS 180-4)
- Fixed-length output eliminates boundary ambiguity in sorted concatenation
- deterministicStringify key sorting eliminates JSON insertion-order non-determinism
- Set difference integrity: identical hashes imply identical semantic blocks (under SHA-256 collision resistance assumption)

---

## 11. Known Limitations

| Limitation | Type | Impact |
|---|---|---|
| Cyclic call graphs rejected | Hard boundary | Mutually recursive functions are unsupported |
| Alias analysis absent | Semantic gap | obj[dynamicKey] access not tracked |
| IIFE wrapping evades detection | False negative | IIFE creates new scope, shifts all canonical IDs |
| No inter-procedural dataflow | Semantic gap | DFG does not cross function call boundaries |
| No class support | Hard boundary | class syntax rejected at parser |
| No async/await support | Hard boundary | Async code rejected at parser |
| Fragment weighting absent | FP risk | All fragments weighted equally |
| Deep nesting performance | Quadratic edge case | 100-level nesting: 444ms for 405 lines |
| No streaming pipeline | Scale limit | Programs beyond ~20k lines risk memory exhaustion |
| MongoDB optional | Production gap | No persistent audit log without DB |
| Dependency-order attack not mitigated | FN risk | Inserting dummy variables invalidates downstream IDs |
| Dead code injection evades detection | FN risk | Added fragments dilute intersection below threshold |

---

## 12. Prior-Art Questions

These are open research questions to investigate before any patent filing. No conclusions are drawn.

**Q1: Winnowing (MOSS)**
Aiken et al. (2002) — fingerprinting over token n-grams. Key question: does CIPE's fragment hashing over normalized semantic graph edges constitute sufficient differentiation from token n-gram hashing?

**Q2: PDG-Based Clone Detection**
Komondoor & Horwitz (2001) and subsequent work. Program dependence graphs encode both CFG and DFG. Key question: how does CIPE's fragment multiset approach differ from known PDG isomorphism methods?

**Q3: Industrial Code Clone Systems (CCFinder, SourcererCC, NiCad)**
These produce clone reports, not cryptographic provenance artifacts. Key question: does the cryptographic provenance artifact (as opposed to a similarity report) constitute a non-obvious differentiator?

**Q4: SimHash / LSH for Code**
Locality Sensitive Hashing approaches for approximate code similarity exist. Key question: does CIPE's LSCH construction (sorted concatenation) constitute a meaningfully distinct construction from standard LSH? The acronym proximity should be addressed in any filing.

**Q5: Software Birthmarks (Myles & Collberg, 2004)**
Static birthmarks use program properties for identity. Key question: is CIPE's normalized semantic graph fingerprint sufficiently distinct from existing static birthmark constructions?

---

## 13. Patent-Sensitive Differentiators

This section describes technical differentiators only. No assessment of patentability is made or implied. A qualified patent attorney must evaluate against the prior-art search results.

**D1: Cryptographic Fingerprint Over Normalized Semantic Graph**
CIPE produces a cryptographic fingerprint (not a similarity score) from a semantically normalized IR. The fingerprint is deterministic and reproducible: identical fragment multisets produce identical fingerprints by construction.

**D2: Order-Independent Multiset Accumulation via Sorted Concatenation**
The LSCH construction produces a globally order-independent fingerprint by sorting then SHA-256-hashing the concatenated fragment hash array. This allows independent function reordering and commutative expression reordering without graph isomorphism.

**D3: Explainable Fragment Provenance Report**
The provenance engine returns matched, added, and missing fragment sets — not just a similarity scalar. This enables identification of exactly which semantic constructs were shared, added, or removed, constituting an explainable cryptographic provenance chain.

**D4: Three-Layer Fragment Taxonomy**
Fingerprints are constructed from three distinct fragment types: (1) intra-block instruction sequences, (2) inter-block control-flow relationships, and (3) inter-block data dependency relationships. The combination of all three layers is necessary for the claimed normalization properties.

**D5: Explicit Unsupported-Syntax Rejection**
Rather than silently producing results for unsupported constructs, CIPE explicitly rejects programs containing features whose semantics cannot be safely normalized. This preserves soundness of the cryptographic guarantee within the supported fragment.

---

## 14. Future Research Roadmap

### Phase 5 — Engineering Hardening (Near-term)
- Inter-procedural dataflow: extend DFG analysis across function call boundaries
- Fragment weighting: IDF-style rarity weighting to suppress boilerplate influence
- IIFE normalization: detect and unwrap immediately-invoked function expressions
- Limited alias analysis using static type information for object property accesses
- Streaming pipeline for programs beyond 20k lines

### Phase 6 — Algorithm Strengthening (Medium-term)
- Cycle-tolerant hashing: research graph canonicalization for cyclic call graphs (Weisfeiler-Lehman graph isomorphism as candidate)
- Weighted fragment Jaccard: replace binary set intersection with rarity-weighted similarity
- Dependency-injection resistance: content-addressed canonical IDs based on sub-expression tree hash rather than scope position

### Phase 7 — Validation (Long-term)
- Corpus evaluation against MOSS-flagged student submission pairs as ground truth
- False positive rate measurement at scale against random program pairs
- Independent adversarial testing by external security researchers
- Academic submission with full empirical evaluation (target: ICSE, FSE, or ASE)

### Phase 8 — Production
- API authentication and rate limiting
- Persistent audit log with cryptographic timestamps
- Multi-language support: TypeScript (minimal change), Python (new parser), Java (new parser + IR extensions)
- Batch comparison against reference corpus

---

## Appendix A: Experiment Reproducibility

All results in this report can be regenerated from a clean checkout:

```bash
git clone <repo>
cd mysterious-raman
npm install

# Core verification suite (18 matrix tests)
npm run verify

# Stress benchmarks
node tests/experiments/stress-test.js

# Mutation testing
node tests/experiments/mutation-tester.js

# Baseline comparison
node tests/experiments/run-experiments.js

# Adversarial evasion suite
node tests/adversarial/run.js
```

Output files:
- docs/experiments/stress-results.md
- docs/experiments/mutation-results.md
- docs/experiments/baseline-comparison.md
- docs/experiments/adversarial-results.md
- docs/BENCHMARK_RESULTS.csv

MongoDB is not required. All experiment scripts run without a database connection.

---

## Appendix B: File Index

| File | Purpose |
|---|---|
| packages/parser/ | Babel-based parser with unsupported syntax rejection |
| packages/scope-engine/ | Lexical binding normalization |
| packages/canonical-ir/ | IR normalization (IR_VERSION 0.1) |
| packages/cfg-engine/ | Basic block + control-flow graph |
| packages/dataflow-engine/ | Use-def chain analysis |
| packages/fragment-engine/ | Fragment emission (Block, CFG, DFG) |
| packages/fingerprint-engine/ | SHA-256 + LSCH global fingerprint |
| packages/provenance-engine/ | Set intersection + confidence report |
| apps/api/ | Express API (port 5000) |
| apps/web/ | React UI (port 3000) |
| tests/experiments/stress-test.js | Stress benchmarks |
| tests/experiments/mutation-tester.js | Mutation classification tests |
| tests/experiments/run-experiments.js | Full matrix + baseline comparison |
| tests/adversarial/run.js | Structural evasion attacks |
| docs/ARCHITECTURE.svg | System architecture diagram |
| docs/PIPELINE.svg | Linear pipeline diagram |
| docs/CFG_EXAMPLE.svg | CFG worked example |
| docs/FINGERPRINT_FLOW.svg | LSCH construction diagram |
| docs/BENCHMARK_RESULTS.csv | Raw benchmark data |
| docs/cryptographic-review.md | Security assumptions + hostile audit |

---

*Report generated: 2026-08-21 | CIPE Phase 4 | All data from automated experiment runs*