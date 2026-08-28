# Phase 11: CI/CD Verification Pipeline Design

## 1. Pipeline Overview & Automation

The CIPE CI/CD Verification Engine integrates semantic provenance auditing directly into automated Git workflows and pull request pipelines. Unlike standard textual diffing tools (e.g., `git diff`), the verification pipeline identifies logical structural modifications, detecting undetected regressions, unlicensed copy-pastes, and unintended semantic drift.

```
[ Git Commit (HEAD vs HEAD~1) ] ──> [ Extract Modified .js Files ]
                                               │
                                               ▼
                              [ CIPE Pipeline (analyzeSource) ]
                                               │
                                               ▼
                           [ compareFragments() Logical Diff ]
                                               │
                       ┌───────────────────────┴───────────────────────┐
                       ▼                                               ▼
            Exit Code 0: PASS / WARNING                    Exit Code 1: REVIEW / FAIL
            (Preserved logic / Minor edits)                (Drastic structural anomaly)
```

## 2. CLI Tool: `scripts/verify-repository.js`

The core command-line utility executes differential analysis across commit boundaries:

1. **Git Change Extraction**: Uses `packages/git-engine/index.js` to inspect `HEAD` versus `HEAD~1` (or arbitrary commit ranges) to extract added and modified JavaScript files.
2. **Dual-Version Analysis**: Executes `analyzeSource(oldSource)` and `analyzeSource(newSource)` across each modified file.
3. **Differential Provenance**: Calls `compareFragments(oldFragments, newFragments)` to isolate matched, added, and removed structural fragments.
4. **Deterministic Exit Codes**:
   - `0 (PASS / WARNING)`: Normal evolution, minor edits, clean refactoring, or additions within expected confidence thresholds.
   - `1 (REVIEW_REQUIRED / FAIL)`: Sudden disappearance of verified proprietary subgraphs, unexpected massive foreign fragment introduction, or validation errors.

## 3. Logical Diff vs. Textual Line Diff

Standard line diffs fail when code is reformatted, variables are renamed, or statements are rearranged. CIPE outputs **logical fragment diffs**:

| Scenario Tested in `diff-mode.js` | Textual Diff Behavior | CIPE Fragment Diff Behavior |
| :--- | :--- | :--- |
| **1. Minor Comment/Formatting Edit** | 100% lines changed (whitespace/lint) | **0 fragments changed** (100% structural preservation) |
| **2. New Function Addition** | Green lines inserted | $+N$ new basic block fragments indexed; zero existing disruption |
| **3. Dead/Removed Code** | Red lines deleted | $-M$ fragments removed; remaining control-flow graph verified |
| **4. Major Control Refactor** | Massive unstructured diff | Pinpoints exact mutated CFG nodes and unaffected sub-blocks |

The test suite in `tests/phase11/diff-mode.js` exercises these 4 scenarios, validating that CI/CD pipelines receive deterministic structural evidence rather than noise from formatting artifacts.
