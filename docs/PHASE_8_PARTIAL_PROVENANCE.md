# Phase 8: Partial Provenance Specification

The core technical advantage of CIPE over traditional sub-graph isomorphism is its ability to perform high-speed $O(N)$ partial provenance verification by reducing the graph to an unordered cryptographic multiset.

## 1. Graph to Multiset Projection
Given Program $A$ and Program $B$:
- Program $A \implies \text{Canonicalization} \implies \text{CFG/DFG} \implies \text{WLCDH} \implies F_A = \{h_{A1}, h_{A2}, ..., h_{An}\}$
- Program $B \implies \text{Canonicalization} \implies \text{CFG/DFG} \implies \text{WLCDH} \implies F_B = \{h_{B1}, h_{B2}, ..., h_{Bm}\}$

## 2. Detection of Relocated Fragments
Because the multiset elements ($h$) are bound *strictly* to local topologies via iterative dataflow/control-flow accumulation, they are completely agnostic to global file positions.
- **Copied functions**: Detected perfectly. The internal block hashes match identically, regardless of where they are placed in Program $B$.
- **Renamed fragments**: Detected perfectly. Lexical identifiers are scrubbed.
- **Embedded fragments**: Detected perfectly. If an algorithm from $A$ is pasted inside a massive wrapper function in $B$, the internal nodes of that algorithm still retain identical localized topologies, yielding identical hashes in the multiset $F_B$.

## 3. The Minimum Evidence Threshold
Because generic JavaScript blocks (e.g. `let x = 0;`) share identical topologies naturally across unrelated codebases, a single hash collision is insufficient for provenance.

Based on empirical Phase 7 testing against 50 diverse algorithms (measuring a 4.2% False Positive Rate), CIPE establishes a hard threshold:
**Minimum Interdependent Block Match = 3**

To declare a positive partial provenance match:
$| F_A \cap F_B | \ge 3$

This threshold mathematically filters out generic boilerplate while successfully identifying unique algorithmic topologies.

## 4. Reordered Fragments (Limitation)
If Program $B$ reorders independent fragments (e.g., swapping the execution order of two totally disconnected utility functions), WLCDH detects them perfectly because the functions do not share dataflow edges, thus their topologies remain independent.
However, if statements *within* a single basic block are reordered without altering dataflow dependencies, they currently evade detection (The "Intra-Block Injection" vulnerability), breaking the partial provenance match.
