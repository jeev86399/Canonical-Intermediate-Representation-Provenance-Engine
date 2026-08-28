# Phase 12: Deterministic Verification Model

This document outlines the strict, deterministic criteria used by CIPE to evaluate the relationship between two sets of logical fragments. The model deliberately moves away from percentage-based similarity thresholds, relying instead on topological containment and logical exactness.

## Classifications

### 1. `EXACT_MATCH`
- **Definition**: Every fragment in the Target source is found identically in the Suspect source, and the Suspect source contains no additional fragments.
- **Evidence**: Complete topological equivalence.

### 2. `STRUCTURAL_MATCH`
- **Definition**: The Suspect source contains *all* rare fragments of the Target source, but also contains additional fragments.
- **Evidence**: This indicates the Target's exact logical structure was copied and then enclosed in a wrapper, or additional code was appended/prepended. The core algorithm remains structurally identical.

### 3. `EVOLVED_MATCH`
- **Definition**: Substantial overlap of rare fragments (e.g., $\ge 50\%$) indicating modification, but not a perfect structural match.
- **Evidence**: This occurs when dead-code is injected, variables are added, or control-flow is altered (e.g. `for` loop changed to `while` loop), causing basic block hashing cascades that mutate a portion of the fragments.

### 4. `PARTIAL_MATCH`
- **Definition**: A minimum subset of rare logic fragments ($\ge 3$) is shared between the sources.
- **Evidence**: Indicates helper-function extraction, copy-pasting of a small algorithmic block, or merging of multiple functions.

### 5. `INSUFFICIENT_EVIDENCE`
- **Definition**: Matches were found, but they consist entirely of common boilerplate or are too small ($< 3$ fragments) to mathematically rule out independent creation.
- **Evidence**: Shared ubiquitous code (e.g., standard object property checks, `console.log` wrappers).

### 6. `NO_MATCH`
- **Definition**: Zero meaningful intersection of logical fragments.

## Threshold-Free Approach
By relying on the extraction of "rare" fragments and topological structural containment (e.g., "does Suspect contain all of Target?"), CIPE drastically reduces the need for arbitrary similarity thresholds (like "> 80%"). This mathematical strictness is critical for generating reliable provenance evidence.
