# Phase 11: Architecture Audit

## 1. System Overview

The Canonical Intermediate Representation Provenance Engine (CIPE) is a multi-package npm workspace monorepo implementing a compiler-inspired source-code provenance verification pipeline. It transforms JavaScript source code into a deterministic Canonical IR, generates cryptographic fingerprints representing topological program structure, and verifies whole or partial code provenance through multiset intersection of fragment hashes.

## 2. Pipeline Data Flow

```
Source Code (JavaScript)
       │
       ▼
[1. packages/parser] ────────────► Babel AST (Validated against 31 allowed node types)
       │
       ▼
[2. packages/scope-engine] ──────► Lexical Environment Graph & Canonical Binding IDs
       │                           (Variable names → d:${depth}/b:${counter})
       ▼
[3. packages/canonical-ir] ──────► Normalized Canonical IR (Commutative ops sorted,
       │                           functions normalized, loops standardized)
       ▼
[4. packages/cfg-engine] ────────► Basic Block Control Flow Graph + Cycle Detection
       │
       ▼
[5. packages/dataflow-engine] ───► Reaching Definitions (Worklist algorithm)
       │                           IN[B] = ∪{P∈pred(B)} OUT[P]
       │                           OUT[B] = gen[B] ∪ (IN[B] \ kill[B])
       ▼
[6. WLCDH Engine] ──────────────► Weisfeiler-Lehman Contextual Dataflow Hashing (K=2)
       │                           S₀(v) = SHA-256(Serialize(scrub(v)))
       │                           Sₖ(v) = SHA-256(Sₖ₋₁(v)|D:[sorted DFG]|C:[sorted CFG])
       ▼
[7. Multiset Accumulator] ──────► F(P) = {Sₖ(v) | v ∈ V}, sorted and hashed
       │
       ▼
[8. Provenance Verification] ───► Set Intersection, Delta Analysis, Confidence Scoring
       │
       ▼
[Output: Cryptographic Provenance Evidence Packet (JSON)]
```

## 3. Package Inventory

| # | Package | LOC | Role | Dependencies |
|---|---------|-----|------|-------------|
| 1 | `packages/parser` | ~85 | Babel AST generation + syntax validation | `@babel/parser`, `@babel/traverse`, `shared` |
| 2 | `packages/scope-engine` | ~113 | Alpha-renaming normalization | `@babel/traverse` |
| 3 | `packages/canonical-ir` | ~235 | Semantic canonicalization (commutative sort, loop/function normalization) | `shared` |
| 4 | `packages/cfg-engine` | ~240 | Basic block CFG + call graph + cycle detection | `shared` |
| 5 | `packages/dataflow-engine` | ~167 | Reaching definitions worklist algorithm | None |
| 6 | `packages/fragment-engine` | ~103 | Block/Control/Data edge fragment extraction | `fingerprint-engine` |
| 7 | `packages/fingerprint-engine` | ~75 | SHA-256 hashing + deterministic JSON stringify | `crypto` |
| 8 | `packages/provenance-engine` | ~73 | Set intersection verification | None |
| 9 | `packages/git-engine` | ~131 | Git CLI wrappers (log, diff-tree, show) | `child_process` |
| 10 | `packages/provenance-pipeline` | ~95 | End-to-end orchestration + WLCDH integration | Packages 1-5 + WLCDH |
| 11 | `packages/shared` | ~22 | Shared error classes | None |
| 12 | `apps/api` | ~249 | Express REST API (analyze, compare) | `express`, `mongoose` |
| 13 | `apps/web` | ~389 | React SPA (Dashboard, CodeEditor, Verification) | `react`, `vite` |

**Total Core Engine LOC**: ~1,339 lines

## 4. Current Bottlenecks

### 4.1 Single-Threaded Execution
The entire pipeline runs synchronously on the Node.js main thread. The `git-engine` uses `execSync`, blocking the event loop during large diffs or log traversals. For 500 synthetic functions, processing takes ~6.6 seconds.

### 4.2 No Fragment Caching
Each call to `analyzeSource()` re-parses, re-scopes, re-canonicalizes, and re-hashes from scratch. There is no memoization of intermediate results or fragment-level caching.

### 4.3 Import from Test Directory
`packages/provenance-pipeline` imports the WLCDH engine from `../../tests/phase9/engine.js` rather than a proper package. This is a structural coupling issue.

### 4.4 Linear-Only Fragment Comparison
Fragment comparison uses linear set intersection. For large corpora (>100K fragments), this requires either pre-indexing or O(N×M) pairwise comparison.

## 5. Current Storage Model

### 5.1 Schema Divergence
Two separate Mongoose schema definitions exist:

**Inline schemas** (`apps/api/index.js`):
- `AnalysisRecord`: sourceCode, metadata, globalFingerprint
- `VerificationReport`: suspectId, targetId, status, confidence

**Domain models** (`apps/api/src/models/index.js`):
- `Project`, `Artifact`, `Fragment`, `Fingerprint`, `Verification`

The domain models are **not wired** to the API routes. Only the inline schemas are actively used.

### 5.2 No Fragment Index
There is no persistent or in-memory reverse index mapping fragment fingerprints to their source repositories/commits/files. Fragment comparison is always computed on-the-fly.

## 6. Current Fingerprint Model

- **Algorithm**: WLCDH (Weisfeiler-Lehman Contextual Dataflow Hashing)
- **Hash Primitive**: SHA-256 (256-bit, 64 hex chars)
- **Iterations**: K=2
- **Domain Separation**: `|D:[...]|C:[...]` delimiters
- **Edge Roles**: Directed AST property prefixes (left:, right:, init:, etc.)
- **Fragment Type**: Basic block hashes (multiset)
- **Global Fingerprint**: SHA-256 of sorted concatenated block hashes
- **Partial Match Threshold**: ≥3 matching basic blocks

## 7. Current API Model

Two endpoints:
- `POST /api/analyze`: Analyzes a single code snippet, returns fingerprint + fragments
- `POST /api/compare`: Compares two code snippets, returns provenance evidence

No repository management, no historical tracking, no fragment indexing endpoints.

## 8. Current Limitations Catalog

1. **Syntax Support**: Only 31 AST node types allowed. No classes, try/catch, async/await, generators, destructuring.
2. **Dead Code Vulnerability**: Injecting unused statements causes 100% provenance loss due to basic-block hash cascade.
3. **Loop Structure Sensitivity**: For→While conversion produces different fingerprints (structural, not semantic, equivalence).
4. **No Cross-File Analysis**: Each file is analyzed independently; no inter-module dependency tracking.
5. **No Incremental Analysis**: Cannot analyze only changed functions; must re-process entire files.
6. **No Fragment Persistence**: Fragments exist only in memory during a single analysis run.
7. **No Boilerplate Detection**: Common patterns (utility functions, framework templates) are treated the same as unique algorithms.
8. **Mock Digital Signatures**: Evidence packets contain hardcoded mock signature strings.
9. **Single Repository Scope**: No mechanism to search fragments across a corpus of repositories.
10. **Unresolved Identifier Leakage**: Global/unresolved identifiers fall back to `"unresolved:${name}"`, preserving variable names for undeclared identifiers.
