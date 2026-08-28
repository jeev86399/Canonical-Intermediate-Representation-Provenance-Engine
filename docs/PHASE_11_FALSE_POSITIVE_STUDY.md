# Phase 11: False Positive / False Negative Study

## 1. Study Objectives & Methodology

A rigorous benchmark across 8 distinct code modification categories was executed to evaluate the boundary conditions of the CIPE structural fingerprinting pipeline (WLCDH $K=2$). The study measures precision, recall, and isolates the precise root causes behind classification anomalies.

## 2. Benchmark Results & Classification Matrix

Eight distinct test scenarios were classified against an expected ground truth:

| Scenario / Category | Description | Ground Truth | System Decision | Outcome |
| :--- | :--- | :---: | :---: | :---: |
| **1. Exact Duplicate** | Verbatim source replication | Derivative | Derivative | **TP** |
| **2. $\alpha$-Renamed** | Variable/function identifier substitution | Derivative | Derivative | **TP** |
| **3. Control Flow Refactor** | Equivalent `for` $\to$ `while` transformation | Derivative | Derivative | **TP** |
| **4. Independent Algorithm** | Different author writing identical algorithm | Independent | Derivative | **FP** |
| **5. Micro-Utility Function** | Trivial getter/clamp/helper function | Independent | Derivative | **FP** |
| **6. Common Boilerplate** | Standard error handling / logging blocks | Independent | Independent | **TN** |
| **7. Completely Unrelated** | Distinct domain logic & data flow | Independent | Independent | **TN** |
| **8. Dead Code Injection** | Interleaved dummy variables & no-op ops | Derivative | Independent | **FN** |

### Statistical Metrics:
- **True Positives (TP)**: 3
- **False Positives (FP)**: 2
- **True Negatives (TN)**: 2
- **False Negatives (FN)**: 1

$$\text{Precision} = \frac{\text{TP}}{\text{TP} + \text{FP}} = \frac{3}{3 + 2} = \mathbf{0.60} \quad (60.0\%)$$

$$\text{Recall} = \frac{\text{TP}}{\text{TP} + \text{FN}} = \frac{3}{3 + 1} = \mathbf{0.75} \quad (75.0\%)$$

$$\text{F}_1\text{-Score} = 2 \times \frac{\text{Precision} \times \text{Recall}}{\text{Precision} + \text{Recall}} = \mathbf{0.667} \quad (66.7\%)$$

## 3. Root Cause Analysis

### False Positives (FP): Structural vs. Semantic Equivalence
1. **Algorithmic Convergence**: Two developers implementing Dijkstra's algorithm independently will produce structurally identical Control Flow Graphs and Def-Use chains. Because CIPE abstracts lexical identifiers, canonical structural representations inevitably converge.
2. **Small Subgraphs**: Utility functions with $<3$ basic blocks contain insufficient topological entropy, causing identical fragment hashes.
*Mitigation*: Enforce basic block threshold constraints ($\ge 3$ blocks) and minimum fragment count filters.

### False Negatives (FN): Dead Code Injection Cascade
1. **Neighborhood Hash Disruption**: Injecting unused statements (e.g., `let _unused = x * 2;`) modifies the AST node sequence of the enclosing basic block.
2. **WLCDH $K=2$ Propagation**: The updated basic block hash propagates to all 1-hop and 2-hop neighbor blocks during the Weisfeiler-Lehman relabeling iterations, altering the entire fingerprint set.
*Mitigation*: Introduce dead code elimination (DCE) in the Canonical IR pre-pass before CFG generation.
