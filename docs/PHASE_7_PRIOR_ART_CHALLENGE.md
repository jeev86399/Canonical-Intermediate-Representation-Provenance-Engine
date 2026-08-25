# Phase 7: Prior-Art Challenge

Using the prior-art documents from Phase 5, we challenged the WLCDH mechanism to see if a skilled person could reasonably combine existing mechanisms to create it.

## 1. Weisfeiler-Lehman Graph Isomorphism (Shervashidze 2011) + Program Dependence Graphs (Krinke 2001)
- **Challenge**: Could an engineer combine WL graph hashing with a PDG to arrive at WLCDH?
- **Analysis**: WL algorithms are standard for graph isomorphism. PDGs are standard for code representation. Applying WL to a PDG is an obvious combination. 
- **Risk**: HIGH RISK. The combination itself is not novel.

## 2. Identifier Scrubbing + Partial Intersection
- **Challenge**: Could an engineer combine identifier-scrubbed block hashing with multiset intersection?
- **Analysis**: Standard clone detection (like MOSS) relies on token hashing (winnowing), which maintains sequence. Sub-graph isomorphism algorithms (like VF2) are typically used for structural matching. WLCDH deliberately *abandons* sub-graph isomorphism in favor of shallow, iterative, commutative edge hashing (folding incoming Data and Control edges without positional argument distinction) to generate a multiset of hashes that can be intersected in $O(N)$ time.
- **Risk**: MEDIUM RISK. Using shallow iterative hashing as a proxy for expensive subgraph isomorphism in the specific domain of software provenance is non-standard, but requires careful patent drafting to distinguish from generic WL fingerprinting.

## Conclusion
The exact application of WLCDH—discarding all lexical identifiers, mapping unified CFG/DFG dataflow structures, folding commutative incoming edges, and projecting to a flat multiset for partial intersection—represents a distinct technical execution. However, it sits precariously close to an "obvious combination" of WL graph hashing and compiler PDGs.
