# Phase 8: Prior-Art Claim Mapping

This document maps the explicitly validated CIPE mechanism against the closest known prior art identified in Phase 5 to determine exact overlaps and novelties.

## 1. Weisfeiler-Lehman Graph Isomorphism (Shervashidze, 2011)
- **WHAT IT DISCLOSES**: A method for fast graph isomorphism testing by iteratively hashing the labels of a node's immediate neighbors to generate a multiset of structural signatures.
- **WHAT CIPE ALSO USES**: Iterative neighborhood hashing; multiset accumulation; node-state updating.
- **WHAT CIPE ADDS**: Explicit domain-separation between Control-Flow edges and Data-Flow edges during the multiset sort. The removal of initial node labels (identifiers) entirely, starting the algorithm from structurally scrubbed AST subsets rather than labeled graph nodes.
- **WHAT REMAINS UNCERTAIN**: Whether applying WL to a compiler PDG without labels is sufficiently non-obvious.

## 2. Program Dependence Graphs (Krinke, 2001)
- **WHAT IT DISCLOSES**: Using CFG and DFG combinations to identify similar code (clone detection) via sub-graph isomorphism techniques.
- **WHAT CIPE ALSO USES**: Extracting CFG and DFG from ASTs in Static Single Assignment form to represent software behavior.
- **WHAT CIPE ADDS**: Replacing the intractable NP-hard sub-graph isomorphism with a linear-time cryptographic multiset intersection (via WL).
- **WHAT REMAINS UNCERTAIN**: Krinke explicitly notes the computational expense of PDG matching. CIPE solves this, but utilizing WL for this exact purpose may be deemed obvious to try.

## 3. Winnowing / Token Hashing (MOSS)
- **WHAT IT DISCLOSES**: Rolling hashes (n-grams) over token streams, retaining the lowest hash in a window to generate a document fingerprint.
- **WHAT CIPE ALSO USES**: Generating subsets of hashes to represent partial documents.
- **WHAT CIPE ADDS**: Abandoning linear token streams completely. CIPE hashes are purely topological, based on execution logic and variable dependencies, making them immune to statement reordering across distinct blocks.
- **WHAT OVERLAPS**: The ultimate goal of $O(N)$ partial provenance verification.

## 4. AST-Based Clone Detection (Deckard)
- **WHAT IT DISCLOSES**: Computing characteristic vectors for AST subtrees and clustering them to find clones, avoiding exact graph matching.
- **WHAT CIPE ALSO USES**: Operating on canonicalized AST forms.
- **WHAT CIPE ADDS**: Using precise cryptographic multiset hashes of dependency structures (PDGs) rather than statistical/geometric clustering of syntax trees. CIPE guarantees zero false positives for identical structural topologies, whereas clustering is probabilistic.

## Conclusion for Patent Professional
The primary defense against a 103 Obviousness rejection will require combining:
1. The explicit **erasure** of all lexical identifiers (modifying standard WL which relies on initial labels).
2. The specific **domain separation** of edges (CFG vs DFG) during neighborhood sorting.
3. The application to **partial provenance verification** via flat multiset intersection (rather than whole-graph isomorphism).
