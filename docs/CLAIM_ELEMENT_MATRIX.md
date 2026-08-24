# CIPE — Claim Element Matrix

**Date:** 2026-08-21  
**Phase:** 5B  
**Purpose:** Independent prior-art analysis of each discrete technical element of CIPE. Each element is assessed separately against the prior-art record developed in Phase 5A and 5B.

**Classification system:**
- **KNOWN:** Clearly and specifically established by identified prior art. A claim covering only this element would almost certainly fail.
- **POTENTIALLY DIFFERENT:** Based on searched material, the specific form or application does not appear to be directly anticipated by a single document. An examiner may still find obviousness. Requires professional analysis.
- **UNKNOWN:** Cannot be determined without deeper prior-art search or legal analysis. Gaps remain.

> **Critical caveat:** This matrix is not a legal opinion. It is a preliminary engineering analysis based on a non-exhaustive web search. Every "POTENTIALLY DIFFERENT" assessment could be overturned by a single undiscovered document.

---

## Element Matrix

| # | CIPE Element | Prior Art Reference(s) | Earliest Evidence | Overlap Assessment | Potential Distinction | Risk |
|---|---|---|---|---|---|---|
| 1 | JavaScript AST parsing (Babel) | MOSS/Winnowing (A-01), CCFinder (A-02), NiCad (A-03), Deckard (A-04) | 2002 (CCFinder) | **KNOWN** — AST parsing from source code is foundational in all code analysis systems | None — AST parsing is a prerequisite, not a mechanism | NONE |
| 2 | Scope normalization (lexical scope traversal) | CCFinder (A-02), NiCad (A-03), SSA (A-12) | 2002 (CCFinder) | **KNOWN** — Variable/scope normalization before comparison is established | Scope-depth positional encoding (d:N/b:M) may be specific | LOW |
| 3 | Positional canonical binding IDs (d:scopeDepth/b:bindingIndex) | CCFinder (A-02) generic tokens; SSA (A-12) phi-based renaming; NiCad (A-03) generic replacement | 1988 (SSA) | **POTENTIALLY DIFFERENT** — Scope-depth positional encoding is not described in any single found document as a specific scheme | CCFinder replaces with generic VAR; SSA uses phi-functions; CIPE's d:N/b:M encodes hierarchical scope structure specifically | MEDIUM — likely obvious as an implementation choice |
| 4 | Syntax canonicalization — loop form erasure (for→while) | No specific prior art found for source-level IR conversion | N/A | **POTENTIALLY DIFFERENT** — Erasing syntactic sugar forms (for→while, arrow fn→function) at the IR level before fingerprinting not found in prior art | May reduce prior art surface if loop-form erasure is part of the specific claim | LOW-MEDIUM |
| 5 | Syntax canonicalization — commutative operand sorting | No specific prior art found for provenance fingerprinting purpose; compiler GVN/constant folding handles this for optimization | ~1970s compiler optimization | **KNOWN** (concept) / **POTENTIALLY DIFFERENT** (application to provenance fingerprinting) | Applying commutativity normalization specifically for provenance hash determinism is a specific application; concept is not new | MEDIUM |
| 6 | CFG construction from normalized IR | PDG (A-05), BinDiff (A-07), WO2017210005A1 (Gap 1), CPG (A-13) | 1991 (Ferrante PDG) | **KNOWN** — CFG construction is a foundational technique | None at concept level; source-level normalized IR as input is specific context | HIGH |
| 7 | Data dependency (use-def) representation | PDG (A-05), SSA (A-12), GraphCodeBERT (A-15), CPG (A-13) | 1987 (Ferrante PDG) | **KNOWN** — Use-def chains and data dependency graphs are foundational | None at concept level | HIGH |
| 8 | SSA-equivalent normalization | SSA (A-12), Translation Validation (Gap 5) | 1988 (Alpern et al.) | **KNOWN** — SSA-based variable-name-independent representation is established | CIPE does not use phi-functions; uses simpler positional scheme | MEDIUM — CIPE's scheme is weaker than SSA |
| 9 | Fragment extraction (decomposing program into typed units) | Winnowing (A-01) k-grams; PDG (A-05) subgraph extraction; CPG (A-13) node/edge extraction | 2001–2003 | **KNOWN** (general concept) | Three specifically typed fragment categories (Block, CFGEdge, DFGEdge) as the chosen decomposition may be specific | MEDIUM |
| 10 | Block fragments (hash of normalized basic block instruction sequence) | BinDiff (A-07) basic block hashing at binary level; WO2017210005A1 CFG nodes | ~2004 (BinDiff) | **KNOWN** (concept) | Source-level normalized IR block hashing with canonical binding IDs is specific context | MEDIUM |
| 11 | Control-edge fragments (hash of CFG edge type + source/target block ID) | PDG (A-05) control-flow edges; WO2017210005A1 CFG + hash | 2001 (PDG) | **KNOWN** (concept — CFG edges are used in prior art) | Treating each CFG edge as an independently hashed fragment unit (rather than hashing the whole CFG) not found in prior art | MEDIUM |
| 12 | Data-edge fragments (hash of use-def edge: defBlock → useBlock + canonical binding) | PDG (A-05) data-flow edges; GraphCodeBERT (A-15) DFG edges | 1987 (Ferrante PDG) | **KNOWN** (concept — data-flow edges are used in prior art) | Treating each DFG use-def edge as an independently hashed fragment unit not found in prior art | MEDIUM |
| 13 | Independent fragment hashing (SHA-256 of deterministicStringify(fragment)) | Winnowing (A-01), US7503035B2 (A-11), general cryptographic hashing | 2003 (Winnowing) | **KNOWN** — Hashing code representations is foundational | Application to deterministicStringify of normalized IR fragment is specific context | LOW |
| 14 | Order-independent accumulation of fragment hashes (sorted concatenation → SHA-256) | Bellare & Micciancio (A-08) multiset hash; sorted concatenation well-known (Gap 6) | 1997 (Bellare) | **KNOWN** (mathematical construction is known per Gap 6 research) | The specific application to a set of semantically normalized source-code fragment hashes is the specific context | MEDIUM — construction known, application is context |
| 15 | Partial provenance matching (confidence = |A∩B| / min(|A|,|B|)) | Winnowing (A-01) fingerprint overlap; Jaccard similarity (foundational mathematics) | Pre-1900 (Jaccard), 2003 (Winnowing) | **KNOWN** — Set intersection similarity is the basis of Winnowing and Jaccard | Application to semantic graph fragment hash sets is specific context; but the mathematical operation is not novel | LOW |
| 16 | Matched/added/missing fragment evidence sets | No specific prior art found for this specific output format | N/A | **POTENTIALLY DIFFERENT** — No prior-art system found that produces a fragment-level evidence manifest (matched/added/missing as specific named output categories) | Clone detection systems produce clone pairs or scores; not fragment-level evidence manifests | MEDIUM — obvious as an engineering step from the intersection computation |
| 17 | Complete CIPE pipeline (all elements 1–16 in combination) | No single prior-art document covers the full pipeline | N/A | **POTENTIALLY DIFFERENT** (combination) | The specific combination of canonical source IR + three-layer typed fragment taxonomy + sorted-hash multiset accumulation + partial provenance certificate + explainable evidence report has not been found as a single prior-art description | UNKNOWN — combination may still be obvious; requires professional analysis |

---

## Consolidated Three-Category Conclusions

### KNOWN — Clearly Established by Prior Art

These elements are clearly anticipated. Claims covering only these elements individually would almost certainly fail. Do not attempt to claim these as standalone inventions.

| Element | Established by | Earliest date |
|---|---|---|
| AST parsing of source code | Every code analysis tool | 2002+ |
| Variable/identifier normalization before comparison | CCFinder, NiCad, MOSS | 2002 |
| CFG construction for code analysis | PDG (Ferrante 1987), BinDiff (~2004) | 1987 |
| Data dependency (use-def) tracking | PDG (Ferrante 1987), SSA (1988) | 1987 |
| Cryptographic hashing of code representations | Winnowing (2003), Rabin (1981), general | 1981 |
| Set intersection similarity metric | Jaccard (pre-1900), Winnowing (2003) | 2003 (applied to code) |
| Order-independent set/multiset hashing (concept) | Bellare & Micciancio (1997) | 1997 |
| SSA-form variable-name-independent representation | Cytron et al. (1991) | 1988 |
| Combined CFG + data-flow graph representation | Program Dependence Graph (Ferrante 1987) | 1987 |
| Source-level unified AST+CFG+DFG representation | Code Property Graph (Yamaguchi 2014) | 2014 |
| "Sort → concatenate → hash" construction | Well-known technique (see Gap 6) | Pre-2010 (informal) |

---

### POTENTIALLY DIFFERENT — Appears Technically Different Based on Searched Material

These elements do not appear to be directly anticipated by a single prior-art document. However, each could be found obvious under § 103, and undiscovered prior art may exist. These are the mechanisms worth discussing with a patent professional.

| Element | Why it may be different | Key risk |
|---|---|---|
| Scope-depth positional canonical binding IDs (d:N/b:M) | Generic-token replacement (CCFinder) loses scope structure; SSA uses phi-functions; CIPE's hierarchical positional encoding is a distinct scheme | May be obvious as implementation choice; not formally published |
| Three-layer typed fragment taxonomy (Block + CFGEdge + DFGEdge) as independent hash inputs | PDG uses whole-graph isomorphism; CPG uses GNN embeddings; treating each graph element as an independently hashed multiset member enabling partial matching without isomorphism is not found in a single document | PDG + Winnowing combination may be found obvious |
| Individual CFG edge as independently hashed fragment unit | BinDiff and WO2017210005A1 hash entire CFG/MSA structures, not individual edges | Narrow distinction |
| Individual DFG use-def edge as independently hashed fragment unit | PDG literature tracks DFG edges but does not hash each edge independently for multiset accumulation | Narrow distinction |
| Loop-form/syntax erasure as explicit IR normalization step for provenance | Common in compilers for optimization; specific application to provenance fingerprinting not found | Likely obvious |
| Fragment-level evidence report (matched/added/missing sets) | No prior-art system produces this exact output format | Likely obvious extension of intersection computation |
| Complete pipeline combination | No single document covers all elements together | Combination may still be obvious |

---

### UNKNOWN — Cannot Be Determined Without Deeper Analysis

| Element | Why unknown | Required action |
|---|---|---|
| Whether d:N/b:M binding scheme is formally published anywhere | Only informal normalization schemes found; formal positional encoding for provenance not found but may exist in obscure academic work | Full text search of IEEE Xplore and ACM DL |
| Whether WO2017210005A1 claims cover source-level analysis | Full text of claims not examined; abstract only | Obtain and analyze full claim set |
| Whether US20150363197A1 was ever issued, and if so, what the issued claims cover | Application status unknown; may have been abandoned | Check USPTO PAIR for prosecution history |
| Whether any Google/Microsoft/Amazon/IBM internal patent covers CIPE's normalized fragment approach | Internal patent portfolios not fully searchable via web | FTO search by a patent attorney |
| Whether the specific combination is obvious under § 103 given PDG + Winnowing as the two primary references | Requires legal reasoning, not engineering analysis | Patent attorney opinion |
| Whether CIPE's weaker (non-SSA) normalization is a feature or a liability for claiming | CIPE does not handle phi-function equivalence; may have narrower scope than SSA-based claims | Patent attorney analysis |

---

## Summary Risk Assessment

**Highest risk elements (clearly in prior art):**
- CFG construction, DFG/use-def, AST parsing, cryptographic hashing, set intersection, combined CFG+DFG representation

**Moderate risk elements (potentially different, but obviousness likely argued):**
- Scope-depth binding IDs, typed fragment taxonomy, individual edge hashing, evidence report format

**Lowest risk elements (most specific combination):**
- The full pipeline as a system — if characterized precisely enough that it cannot be read as a simple combination of PDG + Winnowing + SHA-256

**Overall assessment:** The individual components are all established. If patentability exists, it is in the specific combination and its specific implementation details — not in any single mechanism. A patent professional must evaluate whether this combination is non-obvious under § 103 given the primary references of PDG (Komondoor & Horwitz 2001, Ferrante 1987), Winnowing (Schleimer et al. 2003), and multiset hashing (Bellare & Micciancio 1997).

---

*Matrix constructed: 2026-08-21 | Phase 5B | No core CIPE code was modified.*  
*This document does NOT constitute a legal opinion, patentability opinion, or prior-art search opinion.*  
*All assessments are engineering observations based on a non-exhaustive web search.*
