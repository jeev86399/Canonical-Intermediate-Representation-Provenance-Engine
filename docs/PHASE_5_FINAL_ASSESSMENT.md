# CIPE — Phase 5 Final Assessment

**Date:** 2026-08-21  
**Phase:** 5 — Prior-Art Research  
**Tone:** Hostile technical reviewer. No patentability conclusions. Every statement is a conditional engineering observation, not a legal opinion.  
**Scope:** Answers only the five questions explicitly requested.

---

## A. Is There Enough Technical Differentiation to Justify Speaking with a Patent Professional?

**Answer: Conditionally yes — with serious reservations that must be disclosed.**

The Phase 5 investigation found that:
1. Every individual CIPE component (AST parsing, CFG construction, DFG/use-def tracking, variable normalization, cryptographic hashing, set intersection) is clearly established in the prior art, some dating to 1987–2003.
2. The combination of PDG-based semantic graph analysis (Komondoor & Horwitz 2001) + fingerprint set comparison (Winnowing 2003) + cryptographic hash functions is a reasonable characterization of CIPE at a conceptual level. An examiner aware of these three references would likely raise an obviousness rejection.
3. No single prior-art document was found that covers CIPE's complete pipeline: canonical source-level IR with scope-depth positional binding normalization + three-layer typed fragment taxonomy (Block, CFGEdge, DFGEdge) as independently hashed multiset elements + sorted-concatenation SHA-256 accumulator + partial provenance certificate with matched/added/missing evidence.

The conditional justification for speaking with a patent professional is:
- The combination has enough specific implementation detail that its non-obviousness is not immediately clear from the searched material alone.
- The found prior art does not contain a single "smoking gun" document that covers the complete pipeline.
- The value of a professional opinion is to determine whether the combination survives a § 103 (obviousness) analysis in a specific jurisdiction, which this investigation cannot answer.

**The reservations that must be disclosed to any patent professional:**
- PDG (Ferrante 1987; Komondoor & Horwitz 2001) is the closest prior-art conceptual analog. It combines CFG and DFG for semantic code analysis. The examiner will cite it.
- WO2017210005A1 establishes "CFG + cryptographic hash = program signature" as a combination. It will be cited.
- The "sorted concatenation hash" mathematical construction (LSCH) is a known technique, not an original invention. It should not be claimed as such.
- 4 of 5 structural adversarial attacks evade CIPE (documented in Phase 4). This weakens the technical contribution claim in any prosecution argument about practical utility.
- Full-text claims of WO2017210005A1, US20150363197A1, and major industry internal portfolios (Google, Microsoft, IBM) were not examined. Unknown prior art remains.

---

## B. Which Exact Mechanisms Should Be Discussed with a Patent Professional?

The following mechanisms warrant professional review. They are listed in decreasing order of plausibility as distinguishing technical details:

### B-1: Three-Layer Typed Fragment Taxonomy as Independently Hashed Multiset Elements

**What it is:** CIPE decomposes a semantically normalized program into three distinct fragment types — BlockFragment (intra-block instruction hash), CFGEdgeFragment (per edge: type + source block ID + target block ID), DataflowEdgeFragment (per edge: definition block + use block + canonical binding ID) — and treats each as an independently hashed element in a multiset.

**Why it may matter:** Prior PDG systems (Komondoor & Horwitz) perform graph isomorphism on the whole graph. BinDiff hashes whole basic blocks or whole functions. WO2017210005A1 hashes the MSA (spanning tree of the CFG). No prior-art document found treats each individual graph edge — both CFG edges and DFG edges — as independently hashed, typed fragments accumulated into a multiset. This decomposition is what enables partial matching without graph isomorphism.

**What to ask the attorney:** Does this specific three-layer fragment decomposition (and the independence of each fragment as a hash unit) constitute a non-obvious alternative to PDG isomorphism? Can this be written as a narrow, specific claim?

---

### B-2: Scope-Depth Positional Canonical Binding IDs (d:scopeDepth/b:bindingIndex)

**What it is:** CIPE normalizes all variable names by replacing them with canonical IDs that encode their lexical scope depth and their positional index within that scope. This is deterministic, hierarchical, and scope-preserving without requiring value equivalence computation (as SSA value numbering would).

**Why it may matter:** CCFinder replaces all identifiers with a single generic token (loses scope structure). SSA renames using phi-functions (different algorithm, different semantic properties). NiCad uses TXL text-level renaming. CIPE's d:N/b:M scheme is a specific positional encoding that preserves scope hierarchy while erasing programmer names. No exact prior-art match found.

**What to ask the attorney:** Is this specific encoding scheme novel relative to the CCFinder/SSA/NiCad normalization approaches? Is it obvious given those prior art references?

---

### B-3: Partial Provenance Certificate with Matched / Added / Missing Fragment Sets

**What it is:** CIPE's provenance engine outputs three explicit sets: fragments present in both programs (matched), fragments in the reference but not the query (missing), fragments in the query but not the reference (added). This is the "explainable cryptographic provenance report."

**Why it may matter:** No prior-art clone detection system found outputs this specific format. Systems output similarity scores, clone location pairs, or similarity reports — not fragment-level evidence sets.

**What to ask the attorney:** Is the specific output format (three named sets: matched/added/missing) a protectable element, or is it an obvious engineering step from the intersection computation? Is there value in claiming the output format specifically?

---

### B-4: The Complete Pipeline as a System Claim

**What it is:** The full seven-stage pipeline: Source → Parser (AST) → Scope Engine (canonical binding IDs) → Canonical IR (syntax normalization) → CFG Engine → Dataflow Engine → Fragment Engine (three-layer fragments) → Fingerprint Engine (sorted-hash accumulator) → Provenance Engine (partial matching + evidence sets).

**Why it may matter:** No single prior-art document describes this complete pipeline. The value of a system claim is that it captures the combination even if each individual component is obvious alone.

**What to ask the attorney:** Can a system claim be written that specifically enough characterizes this pipeline to survive both anticipation (§ 102) and obviousness (§ 103) challenges?

---

## C. Which Mechanisms Should NOT Be Claimed Because They Are Clearly Prior Art?

The following mechanisms are clearly established in prior art. Attempting to claim these as standalone inventions would waste prosecution resources and likely result in rejection:

| Mechanism | Why not claimable | Key prior art |
|---|---|---|
| AST parsing of source code | Foundational technique in all code analysis | Every code analysis tool, ~2002 |
| Control Flow Graph construction | 30+ years of CFG literature | Ferrante et al. 1987; PDG; BinDiff |
| Data dependency / use-def tracking | 30+ years of compiler literature | Ferrante et al. 1987; SSA 1988 |
| Variable name normalization / identifier replacement | CCFinder 2002, NiCad 2008 | CCFinder, NiCad, MOSS |
| SHA-256 hashing of code representations | Any k-gram fingerprinting paper | Winnowing 2003, Rabin 1981 |
| Set intersection for similarity | Jaccard similarity pre-1900; applied to code 2003 | Winnowing (Schleimer et al. 2003) |
| Sort → concatenate → hash construction (the "LSCH" construction) | Known technique in multiset hash discussions | Bellare & Micciancio 1997; informal discussions |
| Order-independent code fingerprinting | MOSS/Winnowing explicitly describe position-independence | Winnowing 2003 |
| CFG + cryptographic hash = program signature | WO2017210005A1 | WO2017210005A1 (~2017) |
| Source-level unified AST+CFG+DFG representation | Code Property Graph (Yamaguchi 2014) | CPG 2014; GraphCodeBERT 2021 |
| Partial code clone detection | NiCad, SourcererCC, Winnowing | NiCad 2008, SourcererCC 2016 |

---

## D. What Additional Experiments Would Strengthen the Technical Contribution?

The following experiments, if performed and documented, would provide stronger evidence for the technical value of the CIPE approach relative to prior art. These strengthen the patent prosecution argument, the academic publication argument, or both. They do not establish patentability.

### D-1: Formal Comparison Against PDG-Based Clone Detection

**Experiment:** Implement or use an existing PDG-based clone detection tool (or a graph-isomorphism-based approach) on the same test suite that CIPE uses. Compare: (a) detection accuracy on the 18 verification test cases, (b) runtime performance, (c) ability to produce a partial-match confidence score.

**Rationale:** The core argument for CIPE's distinctness from PDG is that it produces a partial-match provenance certificate without graph isomorphism. A head-to-head comparison would demonstrate this empirically. If CIPE achieves comparable detection accuracy in O(N log N) time while PDG requires exponential time in the worst case, this is a concrete technical advantage to document.

**Required resources:** Access to an existing PDG clone detector (Deckard operates on AST subtrees; NICAD operates at text level — neither is a true PDG comparator). This comparison may require implementing a simplified PDG comparator for the experiment.

---

### D-2: Adversarial Attack Resistance Comparison Across Methods

**Experiment:** Run the five adversarial evasion cases (IIFE wrapping, dead code injection, dependency-order injection, ternary transformation, fragmented interleaving) against three baselines: MOSS/Winnowing-style token fingerprinting, a simple AST hash, and CIPE. Measure evasion success rates across all three.

**Rationale:** CIPE currently has a 4/5 adversarial evasion failure rate. If token fingerprinting has a 5/5 failure rate and CIPE has a 4/5 failure rate, this demonstrates improvement relative to the baseline even if CIPE is not perfect. This contextualizes CIPE's limitations as a known limitation of the class of approach, not a unique weakness.

---

### D-3: Scaled Corpus Evaluation Against MOSS Ground Truth

**Experiment:** Collect a set of student assignment pairs that are known to be flagged by MOSS as plagiarism. Test whether CIPE reaches the same conclusion on these pairs. Measure false positive and false negative rates against MOSS as ground truth on a corpus of 100+ program pairs.

**Rationale:** Currently CIPE's test cases are synthetic and self-created. An evaluation against real-world plagiarism cases with a ground-truth signal (MOSS score) would demonstrate external validity. This is the evaluation that an academic reviewer would require for publication.

---

### D-4: Content-Addressed Canonical Binding (vs. Positional Binding)

**Experiment:** Implement an alternative binding scheme where canonical IDs are assigned based on the hash of the sub-expression tree rooted at each binding's definition, rather than positional d:N/b:M encoding. Measure whether this scheme is resistant to the dependency-order injection attack.

**Rationale:** The dependency-order injection attack succeeds because inserting a dummy variable shifts all positional binding IDs downstream. A content-addressed scheme would be immune to this attack because the canonical ID of each binding would depend only on the expression structure at that binding, not on its position. This experiment would both validate the attack hypothesis and demonstrate a specific improvement pathway — strengthening the technical contribution argument.

---

### D-5: Define and Measure the Scope-Boundary of Supported Programs

**Experiment:** Systematically generate JavaScript programs at increasing levels of complexity and map the exact boundary at which CIPE's normalization produces correct results versus incorrect results. Specifically test: programs with closures at depth N, programs with mutual recursion, programs using IIFEs (documenting exactly why they fail), programs with prototype chain manipulation, programs with dynamic property access.

**Rationale:** A precise scope boundary (supported/unsupported language subset) strengthens the claim that CIPE is a sound system within its boundary. Without this, reviewers can always argue that the undefined cases make the system incomplete.

---

## E. What Prior Art Remains Unresolved?

The following items were identified but not fully resolved. Any patent professional must address these before reaching a conclusion:

### E-1: Full Text of WO2017210005A1 Claims
The abstract was analyzed. The full claim set was not obtained. The claims may be broader than the abstract suggests, potentially covering "applying a hash function to any CFG-derived structure for program identity verification purposes." This must be read and analyzed at claim level.

### E-2: Status and Claims of US20150363197A1
This patent application was not verified as issued. If issued, the claims may be broad enough to cover "using IR artifacts to identify program fragment patterns." If abandoned, it poses no risk.

### E-3: Google / Microsoft / Amazon Internal Patent Portfolios
No relevant internal patents were found via public web search. This does not mean they do not exist. A professional freedom-to-operate (FTO) search using commercial patent databases (Derwent Innovation, PatSnap, or equivalent) is required. This is the largest remaining gap.

### E-4: 2020–2026 Academic Code Provenance Literature
The search covered the GraphCodeBERT era (2021) and CPG era (2014). However, code provenance for license compliance, specifically in the context of AI-generated code and SBOM tracking, is a rapidly evolving area. Papers from 2023–2026 on "cryptographic code provenance" or "deterministic code fingerprinting" may have addressed similar mechanisms. This literature was not systematically surveyed.

### E-5: Patent Coverage of PDG + Hash Combination
The PDG approach (Komondoor & Horwitz 2001) is academic work. It may have been patented by academic institutions or subsequently extended into patents by companies. A patent covering "using program dependence graph structures for code provenance or fingerprinting" would create a freedom-to-operate concern regardless of CIPE's novelty. This specific combination must be searched in patent databases.

### E-6: Whether CIPE's Scope-Depth Binding Scheme Is Formally Published
The d:N/b:M positional binding scheme was not found in any specific prior-art document. However, it is a simple concept. A systematic search of compiler textbooks, formal semantics literature, and code normalization papers may find an exact match. If found, the "potentially different" assessment for element B-2 collapses.

### E-7: IBM Patent Portfolio on Code Normalization
IBM files extensively in code analysis and compilers. The IBM Research division has published on static analysis and code representation. A targeted search of IBM patents using CPC codes G06F8/40 and G06F21/12 with keywords relating to IR normalization and code similarity is warranted.

---

## Closing Statement

This assessment does not conclude that CIPE is patentable, novel, or patent-ready.

The honest summary is: CIPE is a specific combination of well-established components (PDG-style semantic graph analysis, Winnowing-style fingerprint comparison, and standard cryptographic hashing) applied in a specific pipeline configuration that has not been found as a single prior-art description. Whether this is "inventive" in the legal sense cannot be determined by engineering analysis alone. It requires a professional prior-art search and a legal opinion from a qualified patent attorney — specifically one experienced in software patent prosecution in the target jurisdiction.

The one concrete recommendation: if proceeding to a professional consultation, the primary references to have the attorney analyze are:
1. **Komondoor & Horwitz (2001)** — SAS 2001 — the closest academic analog
2. **Schleimer, Wilkerson & Aiken (2003)** — Winnowing/MOSS
3. **WO2017210005A1** — CFG + cryptographic hash for program integrity
4. **Yamaguchi et al. (2014)** — Code Property Graph
5. **Bellare & Micciancio (1997)** — Multiset hashing

These five documents define the boundary within which CIPE's potential distinction must be argued.

---

*Assessment: 2026-08-21 | Phase 5 | No core CIPE code was modified.*  
*This document does NOT constitute a legal opinion or patentability opinion.*
