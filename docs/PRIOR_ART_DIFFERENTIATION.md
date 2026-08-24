# CIPE — Prior-Art Differentiation Research

**Date:** 2026-08-21  
**Phase:** 5 — Prior-Art Investigation  
**Scope:** Academic literature, issued patents, open-source tools, and commercial systems covering the technical mechanisms used by CIPE.  
**Purpose:** Determine whether CIPE's combination of mechanisms is likely to encounter close prior art, and identify what — if anything — appears potentially distinguishing. This document does NOT conclude that CIPE is patentable. That determination requires a professional prior-art search by a qualified patent attorney against actual USPTO, EPO, and academic databases.  
**Research method:** Web searches against Google Scholar, Google Patents, Semantic Scholar, and IEEE/ACM abstracts. No direct access to full-text patent claims was available; summaries are drawn from publicly available abstracts and search result descriptions. Any prior-art assessment made here is preliminary and non-authoritative.

---

## Table of Contents

- [Section A: Clearly Existing Technology](#section-a-clearly-existing-technology)
- [Section B: CIPE Features That Appear To Overlap Existing Work](#section-b-cipe-features-that-appear-to-overlap-existing-work)
- [Section C: Potentially Differentiating Technical Combinations and Mechanisms](#section-c-potentially-differentiating-technical-combinations-and-mechanisms)
- [Research Gaps and Open Questions](#research-gaps-and-open-questions)

---

## Section A: Clearly Existing Technology

The following mechanisms are all well-established in the prior art. CIPE uses some form of each of them. Their presence does not mean CIPE as a whole is anticipated, but any claim that covers only one of these individually would almost certainly fail.

---

### A-01: Token-Based Source Code Fingerprinting (MOSS / Winnowing)

**Title:** Winnowing: Local Algorithms for Document Fingerprinting  
**Authors:** Saul Schleimer, Daniel S. Wilkerson, Alex Aiken  
**Date:** 2003 (SIGMOD)  
**Mechanism:** Source code is normalized (whitespace/comments removed, identifiers sometimes replaced with generic tokens), broken into k-grams, hashed, and a sliding-window minimum-selection algorithm ("winnowing") produces a reduced fingerprint set. Fingerprint sets from two programs are then compared for overlap to measure similarity.  
**MOSS (Measure of Software Similarity)** is the production system built on this work and is widely deployed in academic settings.  
**Overlaps with CIPE:**
- Normalization of whitespace and comments before fingerprinting
- Fingerprint set comparison (intersection-based similarity)
- Position-independent detection (reordering doesn't hide copying)

**Appears different from CIPE:**
- Winnowing operates on lexical token sequences, not on a semantic intermediate representation
- Variable renaming is handled at best by generic token substitution, not by scope-aware canonical binding IDs
- Winnowing does not use CFG or DFG structure; it is purely text/token-level
- No cryptographic provenance artifact is produced; only a similarity score is returned

**Assessment:** Winnowing is clearly prior art for the concept of "fingerprint set comparison on normalized code." The level of normalization is significantly shallower than CIPE's.

**Source:** Schleimer, S., Wilkerson, D.S., & Aiken, A. (2003). Winnowing: Local algorithms for document fingerprinting. SIGMOD 2003.

---

### A-02: Token-Based Code Clone Detection (CCFinder)

**Title:** CCFinder: A Multilinguistic Token-Based Code Clone Detection System for Large Scale Source Code  
**Authors:** Toshihiro Kamiya, Shinji Kusumoto, Katsuro Inoue  
**Date:** 2002 (IEEE Transactions on Software Engineering)  
**Mechanism:** Source files are tokenized. Tokens are normalized — identifiers (variable names) are replaced with a uniform token. Transformed token sequences are compared to find duplicate subsequences. Produces clone reports, not fingerprints.  
**Overlaps with CIPE:**
- Variable name normalization before comparison
- Identifier replacement (though at token level, not scope-depth level)

**Appears different from CIPE:**
- Operates on linear token sequences, not a semantic graph
- Does not use CFG or DFG relationships
- Does not produce a cryptographic artifact
- Does not handle loop-form equivalence (for ≡ while), commutative expression reordering, or function-form equivalence
- Comparison is text-subsequence based, not set-intersection on semantic graph fragments

**Assessment:** CCFinder is clearly prior art for identifier normalization in clone detection. It does not overlap with CIPE's semantic graph layer.

**Source:** Kamiya, T., Kusumoto, S., & Inoue, K. (2002). CCFinder. IEEE TSE 28(7).

---

### A-03: AST-Based Clone Detection with Normalization (NiCad)

**Title:** NICAD: Accurate Detection of Near-Miss Intentional Clones Using Flexible Pretty-Printing and Code Normalization  
**Authors:** Chanchal K. Roy, James R. Cordy  
**Date:** 2008 (ICPC)  
**Mechanism:** Source code is parsed into an AST, then pretty-printed into normalized form using TXL transformation rules. Normalization includes variable renaming (replacement with generic tokens), whitespace removal, and local editing difference filtering. Normalized code fragments are compared using text-line diff.  
**Overlaps with CIPE:**
- AST-based parsing
- Variable renaming normalization
- Near-miss (partial) clone detection

**Appears different from CIPE:**
- Normalization produces normalized text, then compares that text using diff — not a semantic IR
- Does not use CFG or DFG structures
- No cryptographic fingerprint produced
- Comparison is text-diff-based, not set-intersection on graph-derived fragment hashes
- No concept of canonical binding IDs encoding scope depth

**Assessment:** NiCad is clearly prior art for AST-based normalization and near-miss clone detection. The comparison mechanism is fundamentally different from CIPE's.

**Source:** Roy, C.K. & Cordy, J.R. (2008). NICAD. IEEE ICPC 2008.

---

### A-04: AST Characteristic Vector Clustering (Deckard)

**Title:** Scalable and Accurate Tree-Based Detection of Code Clones  
**Authors:** Lingxiao Jiang et al.  
**Date:** 2007 (ICSE)  
**Mechanism:** AST subtrees are characterized by computing numerical vectors representing structural features. Subtrees in Euclidean space are clustered; nearby clusters indicate clone candidates. Avoids full graph isomorphism by using vector approximation.  
**Overlaps with CIPE:**
- AST-based structural analysis
- Avoidance of full graph isomorphism (CIPE uses sorted hash accumulation instead of clustering)

**Appears different from CIPE:**
- Operates on AST subtrees, not on a semantically normalized IR that erases loop forms, function forms, and expression order
- Uses continuous-space clustering, not discrete set-intersection of cryptographic hashes
- No CFG or DFG layer
- No cryptographic provenance output

**Assessment:** Deckard is clearly prior art for AST-based approximation techniques to avoid graph isomorphism. The mechanisms are structurally different from CIPE.

**Source:** Jiang, L. et al. (2007). Scalable and accurate tree-based detection of code clones. ICSE 2007.

---

### A-05: PDG-Based Semantic Clone Detection (Komondoor & Horwitz)

**Title:** Using Slicing to Identify Duplication in Source Code  
**Authors:** Raghavan Komondoor, Susan Horwitz  
**Date:** 2001 (SAS)  
**Mechanism:** Programs are represented as Program Dependence Graphs (PDGs), which encode both control-flow and data-flow dependencies between statements. Backward slicing on PDGs finds isomorphic subgraphs, which represent semantic clones — code that performs the same computation even when source text differs.  
**Overlaps with CIPE:**
- Uses both control-flow and data-flow edges to represent programs (CIPE's CFG + DFG fragment types)
- Semantic-level comparison (order of independent statements does not matter)
- Variable-name-independent (PDG edges encode dependencies, not names)

**Appears different from CIPE:**
- Uses graph isomorphism for subgraph matching — computationally expensive (NP-complete in general)
- Does not produce a cryptographic fingerprint
- Does not output an explainable partial-match provenance report with matched/missing/added fragment sets
- Gabel et al. (2008) noted that PDG isomorphism approaches do not scale to large codebases
- Produces clone pairs, not a provenance claim with confidence score

**Assessment:** This is the most significant academic prior art relative to CIPE. Both CIPE and PDG clone detection operate on combined control-flow + data-flow graph structures. The critical technical differences are: (1) PDG uses graph isomorphism; CIPE uses sorted hash accumulation on a fragment multiset — avoiding the isomorphism problem entirely. (2) PDG produces clone pairs; CIPE produces a cryptographic fingerprint artifact and an explainable evidence report.

**Source:** Komondoor, R. & Horwitz, S. (2001). Using slicing to identify duplication in source code. SAS 2001.

---

### A-06: Software Birthmarks (Static and Dynamic)

**Title:** Static and Dynamic Software Watermarking / Birthmarks  
**Authors:** Gregg Myles, Christian Collberg et al.  
**Date:** 2004 and related works  
**Mechanism:** Software birthmarks are intrinsic program properties used to identify software without explicit embedding. Static birthmarks derive properties from the program's structure (instruction sequences, import tables, constant values). Dynamic birthmarks observe runtime behavior (API call sequences, system call traces). Both are used to assert that one program is derived from another.  
**Overlaps with CIPE:**
- Core goal: assert that one program is derived from another
- Static properties extracted from program structure

**Appears different from CIPE:**
- Static birthmarks in 2004 literature typically operated on compiled binaries or coarse source-level features, not on a normalized semantic IR
- No use of CFG/DFG combined graph structure at source level with canonical binding normalization
- No cryptographic hash-based fingerprint — birthmarks are property descriptors, not SHA-256 hashes over normalized fragment sets
- Dynamic birthmarks require execution; CIPE is entirely static
- No concept of partial-match evidence with fragment-level explainability

**Assessment:** Software birthmarks establish the conceptual goal of program identity assertion. CIPE's mechanism for achieving that goal appears distinct from the birthmark literature's typical approaches.

**Source:** Myles, G. & Collberg, C. (2004). Software watermarking via opaque predicates. Various IEEE/ACM publications 2004–2007.

---

### A-07: CFG/Basic Block Hashing for Binary Similarity (BinDiff / Zynamics)

**Title:** BinDiff — Binary Code Comparison  
**Owner/Author:** Zynamics (acquired by Google)  
**Date:** ~2004 onward; open-sourced ~2022  
**Mechanism:** Compiled binaries are disassembled. Control flow graphs are constructed. Functions are matched across binaries by comparing structural attributes (number of basic blocks, edges, call subgraphs). Basic blocks are hashed (using mnemonic-level features, not raw bytes) to find similar blocks. Multi-stage matching produces a diff between two binary versions.  
**Overlaps with CIPE:**
- Basic block concept (CIPE's BlockFragment maps to basic blocks)
- CFG structure used for similarity
- Hash-based block fingerprinting

**Appears different from CIPE:**
- Operates on compiled binary code, not source-level ASTs
- No semantic normalization of variable names (no concept applies at binary level)
- No dataflow edge fragment layer at source semantic level
- Fuzzy/structural hashing, not SHA-256 over canonically normalized IR nodes
- No explainable provenance report with matched/missing evidence sets
- Domain: binary similarity for reverse engineering, not source provenance

**Assessment:** BinDiff establishes that CFG-based basic block hashing for code similarity is known at the binary level. CIPE applies analogous concepts at the source semantic level with additional normalization layers. The source-level canonical IR normalization (scope-depth binding, loop-form erasure, commutative sort) has no direct analog in binary similarity tools.

**Source:** Zynamics BinDiff (various publications and Google Open Source release). Also: Dullien, T. & Rolles, R. (2005). Graph-based comparison of executable objects. SSTIC 2005.

---

### A-08: Order-Independent Cryptographic Multiset Hashing (Bellare & Micciancio)

**Title:** A New Paradigm for Collision-Free Hashing: Incrementality at Reduced Cost  
**Authors:** Mihir Bellare, Daniele Micciancio  
**Date:** 1997 (Eurocrypt)  
**Mechanism:** Defines multiset hash functions — hash functions over unordered collections that are sensitive to element multiplicity but not order. Specific constructions: MSet-XOR-Hash (XOR of per-element hashes — weak, self-canceling), MSet-Add-Hash (addition modulo large integer), MSet-Mu-Hash (finite field multiplication — no secret key required, multiset collision resistant).  
**Overlaps with CIPE:**
- CIPE's LSCH fingerprint is an order-independent accumulation of per-fragment hashes
- The goal of hashing an unordered collection without order-sensitivity is the same

**Appears different from CIPE:**
- CIPE does not use any of the standard multiset hash constructions (XOR, Add, MuHash)
- CIPE uses sorted concatenation of fixed-length (64-char hex SHA-256) strings, followed by a second SHA-256
- CIPE's construction is simpler and does not require the algebraic properties of MSet-Mu-Hash, but also does not have the incremental update property
- The sorted-concatenation construction is not a standard cryptographic multiset accumulator; it is better described as a "canonical multiset digest" — its security relies on the sorted order being canonical, which is guaranteed by the fixed 64-char output of SHA-256

**Assessment:** Bellare & Micciancio establish the field of multiset hashing. CIPE uses a non-standard construction in this space. Whether CIPE's specific construction is considered novel relative to the multiset hash literature is a key open question for a patent attorney.

**Source:** Bellare, M. & Micciancio, D. (1997). A new paradigm for collision-free hashing. Eurocrypt 1997.

---

### A-09: Merkelized ASTs / Structural Tree Hashing

**Title:** Merkelized Abstract Syntax Trees (MAST) — Various implementations  
**Date:** ~2013 onward (originally in Bitcoin/script context); general prior art for hash trees is Merkle (1979)  
**Mechanism:** A Merkle tree is applied to an AST: each leaf node contains the hash of a code token or literal; each internal node contains the hash of its children's hashes. The root hash represents the entire program. Matching sub-trees can be identified by comparing subtree root hashes.  
**Overlaps with CIPE:**
- Hashing AST-derived structures
- Using SHA-256 for content-addressing of code elements

**Appears different from CIPE:**
- Merkle trees on raw ASTs preserve program-order dependency and do not normalize variable names, loop forms, or commutative expressions
- A MAST root hash changes if any single character changes — it is not a similarity measure
- MAST does not support partial matching or provenance comparison at the fragment level
- CIPE operates on a semantically normalized IR, not the raw AST
- CIPE's fragment set construction (CFG blocks + edges + DFG edges) has no parallel in Merkle-AST work

**Assessment:** Merkle tree hashing of code is clearly prior art for cryptographic code content-addressing. It does not cover CIPE's normalized semantic fragment approach.

**Source:** Merkle, R.C. (1979). Merkle tree. US Patent 4309569. MAST: Various Bitcoin protocol discussions (2013+).

---

### A-10: Issued Patents — Binary Code CFG Fingerprinting for Plagiarism

**Patent:** US9218466B2 — "Systems and methods for detecting copied computer code using fingerprints"  
**Date:** 2015  
**Mechanism:** Disassembles compiled binaries, builds CFG and function call graphs, extracts unique "spectra" (fingerprints) from each function, compares fingerprints across binaries to detect code copying.  
**Overlaps with CIPE:**
- CFG construction for similarity detection
- Fingerprint-based comparison
- Code copying/plagiarism detection goal

**Appears different from CIPE:**
- Operates on compiled binary code, not JavaScript source
- No semantic normalization of variable names (binary level has no variable name concept)
- No DFG/dataflow edge fragments
- No canonical IR with normalization of loop forms, function forms, expression commutativity
- No partial-match provenance report with matched/missing evidence fragments

**Assessment:** This patent covers binary-level CFG fingerprinting. CIPE is a source-level system with a substantially different normalization pipeline.

**Source:** US9218466B2 (Google Patents).

---

### A-11: Issued Patents — Source Code Similarity via k-gram Fingerprinting

**Patent:** US7503035B2 — Plagiarism detection in source code using k-gram fingerprints  
**Date:** ~2009  
**Mechanism:** Source code is fingerprinted using k-gram hashes (similar to Winnowing). Fingerprint sets are compared. Hash functions used to minimize collision probability.  
**Overlaps with CIPE:**
- k-gram/fingerprint comparison over source code
- Hash functions for comparison

**Appears different from CIPE:**
- k-gram fingerprinting is a token/character-level approach, not semantic graph level
- No CFG or DFG structure
- No canonical IR with normalization
- No cryptographic provenance artifact

**Assessment:** This patent covers the basic Winnowing-style source code fingerprinting approach. CIPE is at a substantially different layer.

**Source:** US7503035B2 (Google Patents).

---

### A-12: SSA Form and Value Numbering for Variable-Name-Independent Analysis

**Title:** Static Single Assignment Form — foundational compiler work  
**Authors:** Alpern et al. (1988), Cytron et al. (1991), and many successors  
**Date:** 1988–1991 (foundational); value numbering for equivalence checking well-established by late 1990s  
**Mechanism:** SSA form assigns each variable a unique definition site, making data-flow explicit. Value numbering assigns abstract "value numbers" to expressions — expressions that provably compute the same value receive the same number, independent of variable names. The resulting SSA value graph can be compared for structural equivalence without reference to original variable names.  
**Overlaps with CIPE:**
- Variable-name-independent program representation
- Data-flow-explicit representation

**Appears different from CIPE:**
- SSA/value numbering is a compiler technique for optimization and equivalence verification, not a provenance detection system
- SSA comparison for equivalence requires structural graph isomorphism — not avoided
- CIPE's canonical binding scheme (d:N/b:M scope-depth encoding) is different from SSA's phi-function based renaming
- CIPE does not use phi-functions and does not handle all SSA-equivalent transformations
- No cryptographic fingerprint output from SSA comparison systems

**Assessment:** SSA form is clearly prior art for variable-name-independent program analysis. CIPE's binding normalization scheme is conceptually related to value numbering, but is a different and simpler mechanism (scope-depth positional encoding rather than global value equivalence classes).

**Source:** Cytron, R. et al. (1991). Efficiently computing static single assignment form. ACM TOPLAS.

---

## Section B: CIPE Features That Appear To Overlap Existing Work

This section catalogs each of CIPE's specific technical mechanisms and identifies which prior-art items most closely address them.

---

### B-01: Variable Name Normalization Before Comparison

**CIPE mechanism:** Scope engine assigns canonical IDs (d:scopeDepth/b:bindingIndex) to all bindings. IR uses canonical IDs rather than programmer-assigned names.

**Prior art overlap:**
- CCFinder (A-02): replaces identifiers with generic tokens before token-sequence comparison
- NiCad (A-03): variable renaming normalization via TXL transformation rules
- MOSS/Winnowing (A-01): partial — some normalization is applied but it is not scope-aware
- SSA/Value Numbering (A-12): provides variable-name-independent analysis via phi-functions and value numbers

**Assessment of overlap:** Variable name normalization before code comparison is well-established (20+ years of prior art). CIPE's specific scheme — scope-depth positional encoding (d:N/b:M) rather than generic token replacement or SSA value numbers — may be a distinguishing detail, but the general concept is clearly anticipated.

---

### B-02: Control-Flow Graph Used for Code Similarity

**CIPE mechanism:** CFG engine builds basic blocks + control-flow edges from Canonical IR. CFGEdgeFragments encode each control-flow relationship.

**Prior art overlap:**
- BinDiff / Zynamics (A-07): CFG-based binary similarity at binary level
- Komondoor & Horwitz PDG (A-05): control-flow edges are part of PDG
- US9218466B2 (A-10): CFG fingerprinting for compiled binary code similarity
- WO2017210005A1: CFG + hash for attack detection

**Assessment of overlap:** CFG use for code similarity detection is clearly established at the binary level and conceptually established at the source level (PDG). The application to a normalized source-level IR appears less specifically covered by existing patents, but the general concept is known.

---

### B-03: Dataflow / Data Dependency Used for Code Similarity

**CIPE mechanism:** Dataflow engine emits use-def edges (DataflowEdgeFragment) for each binding defined in one block and used in another.

**Prior art overlap:**
- Komondoor & Horwitz PDG (A-05): PDG includes data dependency edges (control flow + data flow combined)
- SSA form (A-12): data-flow is explicit in SSA representations

**Assessment of overlap:** Using data dependency edges for code similarity is established in the PDG literature. CIPE's specific fragment approach (treating each use-def edge as a separately hashed unit) may differ in detail from PDG-based approaches.

---

### B-04: Combined CFG + DFG Graph Representation

**CIPE mechanism:** All three fragment types (BlockFragment, CFGEdgeFragment, DataflowEdgeFragment) are emitted from a single pipeline and combined in the fingerprint.

**Prior art overlap:**
- Komondoor & Horwitz PDG (A-05): PDG is precisely a combined control-flow + data-flow representation. PDG isomorphism detects equivalence without variable names.

**Assessment of overlap:** The combination of control-flow and data-flow for semantic code analysis is the defining characteristic of PDG-based clone detection, which dates to 2001. This is the single strongest area of prior art overlap with CIPE's approach.

---

### B-05: Order-Independent Function-Level Comparison

**CIPE mechanism:** Root-level function declarations are sorted by canonical binding at the IR stage. Independent function reordering produces the same canonical IR.

**Prior art overlap:**
- MOSS/Winnowing (A-01): described as "position-independent" — reordering does not hide copying
- Komondoor & Horwitz PDG (A-05): PDG isomorphism is inherently order-independent for independent statements

**Assessment of overlap:** Position/order independence for code similarity detection is established. CIPE achieves it via a specific mechanism (sorted body array) that may differ from prior approaches.

---

### B-06: Cryptographic Hashing of Code Fragments

**CIPE mechanism:** SHA-256 applied to deterministicStringify(fragment) for each of the three fragment types.

**Prior art overlap:**
- US7503035B2 (A-11): k-gram hash fingerprinting with hash functions for collision avoidance
- US9218466B2 (A-10): binary-level "spectrum" fingerprints from CFG structures
- General hash-based fingerprinting: extremely well-established since Rabin (1981)

**Assessment of overlap:** Applying hash functions to code representations is one of the most well-established techniques in the field. CIPE's specific application to deterministicStringify output of normalized IR fragments is a detail, but the general concept is not novel.

---

### B-07: Fragment-Set Intersection as Similarity Metric

**CIPE mechanism:** confidence = |A ∩ B| / min(|A|, |B|) over raw fragment hash sets.

**Prior art overlap:**
- MOSS/Winnowing (A-01): fingerprint set intersection is the core of Winnowing-based similarity
- Jaccard similarity index: established mathematical foundation for set-intersection similarity (predates software clone detection entirely)

**Assessment of overlap:** Set-intersection-based similarity metrics are the backbone of fingerprinting approaches. Jaccard coefficient is a textbook technique. CIPE's application of it to a semantic graph fragment hash set is a context, not a novel mechanism.

---

### B-08: Unsupported Syntax Explicit Rejection

**CIPE mechanism:** Parser returns UnsupportedSyntaxError for eval, async/await, classes, generators, dynamic import, and cyclic call graphs.

**Prior art overlap:**
- All practical program analysis tools define a supported input language boundary
- This is an implementation decision, not a technical mechanism with prior art implications

**Assessment of overlap:** Irrelevant for prior-art purposes. Explicit boundary declaration is engineering practice, not a patentable mechanism.

---

## Section C: Potentially Differentiating Technical Combinations and Mechanisms

This section identifies areas where CIPE's combination of mechanisms may not be directly anticipated by any single prior-art item. These are observations only — not conclusions about patentability. A patent professional must determine whether these observations survive a formal prior-art search.

> **Caveat:** All items below could be anticipated by combinations of prior art (obviousness under 35 U.S.C. § 103), by undiscovered patents, or by academic work not found in this search. The absence of a specific matching document does not establish novelty.

---

### C-01: Cryptographic Fingerprint (Not Score) Over Normalized Semantic Graph Fragments

**Observation:** Existing systems produce one of the following:
1. A similarity score (MOSS, CCFinder, NiCad, Deckard)
2. A clone pair report (Komondoor & Horwitz PDG)
3. A binary-level fingerprint spectrum for binary comparison (BinDiff, US9218466B2)

None of the prior art found produces a **reproducible, deterministic cryptographic artifact** (a specific hash value) derived from a **semantically normalized** source-level intermediate representation, where the hash is computed over **graph-structured semantic fragments** (not token sequences), and the artifact is **reproducible independently** by any party holding the source code.

**Potential significance:** If a cryptographic fingerprint over normalized semantic graph fragments — as opposed to a similarity score — is treated as a distinct technical concept, the combination may not be directly anticipated.

**Risk:** This could be characterized as an obvious combination of (Winnowing's fingerprint comparison approach) + (PDG-based semantic graph analysis) + (cryptographic hash functions). An examiner could find this obvious without finding a single document that combines all three.

---

### C-02: Three-Layer Fragment Taxonomy (Block + CFG Edge + DFG Edge) as Independent Hash Inputs

**Observation:** PDG (A-05) combines control-flow and data-flow into a single graph and uses graph isomorphism. CIPE treats each graph element — individual basic blocks, individual CFG edges, and individual DFG edges — as independently hashed units, and accumulates them in a multiset.

The consequence is that CIPE's fingerprint reflects the program's semantic graph at element-level granularity, not at whole-graph-comparison granularity. This is what enables partial matching and confidence scoring without any graph isomorphism computation.

**Potential significance:** The decomposition into three independently hashed, type-tagged fragment categories and their accumulation into a multiset fingerprint may be a specific technical approach not described in PDG literature.

**Risk:** An examiner familiar with PDG literature could argue this is a straightforward simplification of PDG isomorphism (replacing isomorphism with hashing). The non-obviousness of this step would need to be argued based on the practical consequences (avoiding NP complexity, enabling partial matching, enabling cryptographic provenance).

---

### C-03: Scope-Depth Positional Canonical Binding IDs (d:N/b:M)

**Observation:** Existing normalization approaches use one of:
- Generic token replacement (CCFinder, NiCad): all identifiers become `VAR` — loses scope structure
- Value numbering (SSA/GVN): assigns equivalence classes based on the value computed — structurally different from CIPE
- SSA renaming: renames based on phi-function positions — different scheme

CIPE's canonical ID scheme encodes `d:scopeDepth/b:bindingIndex` — a positional encoding that is deterministic, hierarchical, and preserves relative scope relationships without requiring value equivalence computation.

**Potential significance:** This specific encoding scheme — and its property that two structurally identical programs at the same scope structure will always produce the same canonical IDs — may not be described in the prior art in this exact form.

**Risk:** Simple positional renaming (rename all variables in declaration order within each scope) is a straightforward normalization that many developers would implement without formal publication. It may be an obvious implementation choice even if not formally published as a standalone technique.

---

### C-04: Sorted Concatenation of Fixed-Length SHA-256 Hashes as Order-Independent Accumulator

**Observation:** Standard multiset hash constructions (A-08: Bellare-Micciancio) use algebraic operations (XOR, addition modulo large integer, finite field multiplication). CIPE uses lexicographic sort of fixed-length (64-char hex) SHA-256 strings followed by SHA-256 of the concatenated result.

This construction has specific properties:
- Fixed 64-char output eliminates boundary ambiguity in concatenation (unlike variable-length hashes)
- Lexicographic sort on hex strings is canonical and deterministic
- No algebraic group operations required; relies only on SHA-256
- Not incremental (adding a fragment requires re-sorting), but also not algebraically invertible

**Potential significance:** This specific construction does not appear in the multiset hash literature. It is simpler than MuHash, does not require algebraic assumptions beyond SHA-256 collision resistance, and produces a standard SHA-256 output.

**Risk:** It may be characterized as an obvious variant of multiset hashing. A reviewer could argue that "sort the elements and hash the sorted result" is an obvious way to achieve order independence, even if not formally published. It is not clear that this construction adds a genuine inventive step over existing multiset hash literature.

---

### C-05: Explainable Fragment Evidence Report (Matched / Added / Missing Fragment Sets)

**Observation:** No prior-art system found produces an explainable provenance report specifying exactly which semantic graph fragments (by hash) are shared between two programs, which are present in the suspected copy but absent from the original, and which are present in the original but absent from the suspected copy.

Clone detection systems (MOSS, CCFinder, NiCad, Deckard, PDG) produce clone location pairs or similarity scores. They do not produce a fragment-level evidence manifest.

**Potential significance:** The combination of (a) cryptographic fragment hashes + (b) set-difference analysis + (c) matched/added/missing evidence output constitutes an "explainable cryptographic provenance report" that may not be described in existing prior art.

**Risk:** This could be characterized as obvious: given that CIPE computes fragment hash set intersection for the confidence score, also computing the set differences (A \ B and B \ A) is an obvious engineering step that adds no inventive concept.

---

### C-06: Commutative Expression Reordering as Normalization in Source-Level IR

**Observation:** The CIPE canonical IR sorts operands of commutative binary operators (`+`, `*`, `|`, `&`, `^`, `||`, `&&`) by `JSON.stringify()` of the operand before building the IR node. This ensures that `a + b` and `b + a` produce the same fragment hashes.

The prior art found does not specifically describe commutativity normalization at the source-IR level for the purpose of provenance fingerprinting. CCFinder replaces all identifiers with generic tokens but does not sort operands. NiCad normalizes at the text level. SSA/GVN can detect value equivalence for commutative operations but uses value numbers, not canonical operand sorting.

**Potential significance:** Commutativity normalization as a specific step in source-level IR construction for provenance fingerprinting may be a specific technical detail not directly covered by prior art.

**Risk:** This is a narrow and implementation-level observation. Commutativity normalization is a well-known concept in compiler optimization (constant folding, algebraic simplification). An examiner would likely find it obvious to apply to IR normalization for clone detection purposes.

---

## Research Gaps and Open Questions

The following areas were not fully resolved by this search. A professional prior-art search must address them explicitly.

### Gap 1: Google/Industry Internal Patents
Large technology companies (Google, Microsoft, Amazon, Meta) file substantial numbers of software analysis patents. Internal tools for code similarity, provenance, and analysis at scale may have been patented. No internal patent database was accessible during this search.

### Gap 2: Academic Literature from 2015–2025
The code clone detection field has continued to evolve substantially. Recent work on neural network / embedding-based code similarity (e.g., Code2Vec, GraphCodeBERT, UniXcoder) was not surveyed. These systems use learned representations, not rule-based semantic normalization, so they are likely less relevant — but they should be confirmed as non-overlapping.

### Gap 3: WO2017210005A1 — CFG + SHA Hash for Attack Detection
This PCT application (listed in patent search results) apparently describes a system that generates process signatures using CFG minimum spanning trees and cryptographic hash functions. The full text of this patent was not reviewed. It may have overlap with CIPE's CFG fingerprinting approach and should be examined in detail.

### Gap 4: US20150363197A1 — Software Analytics / Code Provenance via IR
This patent (mentioned in software provenance context) describes methods for identifying design patterns or code provenance using IR. The full text was not reviewed and should be examined.

### Gap 5: Formal Equivalence Checking Literature
Academic work on program equivalence checking (Pnueli et al., translation validation literature) may describe variable-name-independent, CFG-based program comparison. This literature was not fully surveyed.

### Gap 6: Specific LSCH Acronym Search
A search for "Locality-Sensitive Cryptographic Hashing" as a named technique was not conducted. The acronym LSCH may already be used in the literature for a different technique, which would be a problem in patent prosecution.

---

## Summary Assessment

This is a preliminary, non-authoritative assessment based on publicly available web search results. It is not a substitute for a formal patentability opinion.

**Mechanisms clearly in the prior art (individual components):**
- Variable name normalization before code comparison (CCFinder 2002, NiCad 2008)
- CFG-based code similarity (BinDiff ~2004, US9218466B2 2015)
- Combined CFG + DFG graph structure for semantic analysis (Komondoor & Horwitz 2001 PDG)
- Hash-based code fingerprinting (Winnowing 2003, US7503035B2)
- Order-independent multiset hashing (Bellare & Micciancio 1997)
- Set-intersection similarity metrics (Winnowing / Jaccard)

**Aspects where no single prior-art document was found that directly covers CIPE's combination:**
- A reproducible cryptographic fingerprint (not similarity score) derived from a normalized source-level semantic graph
- Three-layer fragment taxonomy (Block + CFGEdge + DFGEdge) as independently hashed multiset elements, enabling partial matching without graph isomorphism
- Scope-depth positional canonical binding IDs (d:N/b:M) as the normalization mechanism
- Sorted concatenation of fixed-length SHA-256 strings as the order-independent accumulator
- Fragment-level explainable evidence report (matched/added/missing)

**The central question for a patent professional:**
Whether CIPE's specific combination of (normalized semantic IR + three-layer fragment taxonomy + sorted-hash multiset accumulation + cryptographic provenance artifact + explainable evidence report) constitutes a non-obvious combination that survives prior-art analysis against (a) PDG-based clone detection, (b) Winnowing-style fingerprinting, and (c) multiset hash literature.

**This document does not conclude that CIPE is patentable, novel, or patent-ready.**

---

*Research conducted: 2026-08-21 | Phase 5 | No core implementation code was modified.*  
*Sources: Google Scholar, Google Patents, Semantic Scholar, IEEE/ACM abstracts via web search.*  
*Full-text patent claims were not directly examined; all characterizations are based on abstracts and secondary descriptions.*

---

## Phase 5B — Deep Validation of Unresolved Gaps

**Date:** 2026-08-21  
**Status:** Supplementary investigation resolving the six gaps flagged in Phase 5A.

---

### Gap 1 Resolution: WO2017210005A1 — Full Analysis

**Title:** Systems and Methods for Detecting Attacks in Big Data Systems  
**Filing:** PCT/US2017/034889, published as WO2017210005A1  
**Domain:** Runtime attack detection in distributed big data systems, not source code provenance

**Exact Technical Mechanism (from abstract and secondary descriptions):**
1. Monitors running processes across replicated data nodes in a distributed system
2. Extracts the Control Flow Graph of each executing process
3. Reduces the CFG to a **Minimum Spanning Arborescence (MSA)** — a directed spanning tree of the CFG
4. Hashes the MSA representation using a cryptographic hash function (SHA or similar) to produce a "process signature"
5. Exchanges process signatures across replica nodes via a secure communication protocol
6. Detects attacks by comparing signatures between replicas — mismatches indicate tampering

**Does it use CFG?** YES — explicitly.  
**Does it use cryptographic hashing?** YES — SHA-class hash of MSA.  
**Source/program provenance?** NO — this is runtime behavioral integrity verification (attack detection), not source-level static provenance.

**Overlap with CIPE:**
- Both use CFG structure + cryptographic hash
- Both produce a compact signed representation of program structure
- Both compare representations to detect discrepancy

**Absent in WO2017210005A1 vs. CIPE:**
- Does not operate on source code — operates on executing runtime process images
- Does not perform source-level normalization (no variable renaming, no loop-form erasure, no canonical binding IDs)
- MSA is a topological reduction of the CFG — CIPE hashes individual CFG edge fragments, not a spanning tree
- Does not extract or use dataflow/data-dependency fragments
- Does not perform partial-match provenance (matched/missing/added fragments)
- Does not produce a reproducible artifact from source text — artifact depends on runtime execution state
- Domain is distributed systems integrity verification, not intellectual property provenance

**Assessment:** WO2017210005A1 is the **closest single patent** found that combines CFG extraction with cryptographic hashing for a program-integrity purpose. Its mechanism is substantially different from CIPE: it operates at runtime on executing processes (not source), uses MSA (not fragment-level edge hashing), and detects tampering between replicas (not provenance between programs). A patent examiner may cite it as relevant background art for the concept of "CFG + cryptographic hash = program signature," but would need to evaluate claim-level overlap rather than concept-level overlap. This patent does NOT anticipate CIPE's source-level normalized fragment approach. However, it narrows the space of what can be claimed.

**Risk level:** MEDIUM. The concept of "hash a CFG-derived structure to produce a program signature" is established by this patent. Claims limited to that concept alone would likely fail. Claims that include source-level normalization (canonical binding, loop erasure, commutativity) and dataflow fragments would be more distant from this patent's scope.

**Source:** WO2017210005A1 (Google Patents / WIPO); confirmed via abstract and multiple secondary descriptions.

---

### Gap 2 Resolution: US20150363197A1 — Full Analysis

**Title:** Systems and Methods for Software Analytics  
**Filing:** US20150363197A1 (patent application, not issued)  
**Assignee:** Unknown (to be confirmed in full text)

**Exact Technical Mechanism (from abstract and secondary descriptions):**
1. Maintains a database of "artifacts" corresponding to software files
2. Artifacts can be in source code, binary code, or **intermediate representation (IR)** format
3. Identifies "design patterns" — which include flaws, repairs, features, pre-identified program fragments
4. Can label and store identified patterns linked to specific program fragments
5. Uses "character strings derived from artifacts" to denote design patterns

**Does it use CFG?** Not described in available abstract material.  
**Does it use cryptographic hashing?** Not described — "character strings derived from artifacts" may or may not be cryptographic hashes.  
**Source/program provenance?** Partially — tracks design pattern provenance across software files.

**Overlap with CIPE:**
- Both analyze software across source, binary, and IR formats
- Both link identified patterns to specific program fragments
- Both associate a compact identifier with code fragments

**Absent in US20150363197A1 vs. CIPE:**
- No specific normalization mechanism described (no variable renaming, no canonical bindings)
- No CFG or DFG construction described
- No cryptographic fingerprint construction described with specific hash algorithm
- No partial provenance matching (matched/missing/added fragment sets)
- No confidence score for partial overlap
- The patent appears to be a broad framework patent for "software analytics," not a specific mechanism patent

**Assessment:** US20150363197A1 is a **broad, framework-level patent** for software analytics using IR artifacts. Its language is broad enough that it may cover some high-level aspect of CIPE (analyzing IR to identify code patterns). However, it does not describe CIPE's specific mechanisms. It is prior art for the broad concept of "IR-based code analysis for pattern identification," but not for CIPE's specific combination of canonical normalization + CFG/DFG fragment hashing + multiset accumulation + partial provenance evidence.

**Risk level:** LOW-MEDIUM as a specific anticipation, but its broad language may be cited during prosecution. A freedom-to-operate analysis would need to examine the issued claims, not just the application.

**Source:** US20150363197A1 (Google Patents); abstract analysis.

---

### Gap 3 Resolution: 2015–2026 Academic Literature

**A-13: Code Property Graph (CPG) — Yamaguchi et al., 2014**

**Title:** Modeling and Discovering Vulnerabilities with Code Property Graphs  
**Authors:** Fabian Yamaguchi, Nico Golde, Daniel Arp, Konrad Rieck  
**Date:** 2014 (IEEE S&P)  
**Mechanism:** Merges AST, CFG, and Program Dependence Graph (PDG) into a single unified "property graph" stored in a graph database. Queries on this graph detect vulnerability patterns. The CPG is used for security analysis (vulnerability detection), not provenance or clone detection.  
**Open-source implementation:** Joern (C/C++), later extended to multiple languages.

**Overlaps with CIPE:**
- Combines AST + CFG + DFG into a single unified representation
- Operates at source level
- Both CFG and data-flow edges are first-class entities

**Appears different from CIPE:**
- CPG is used for vulnerability detection via graph queries — not for code provenance or clone detection
- No canonicalization or normalization of variable names
- No fingerprint or hash construction from graph elements
- No partial-match provenance report
- Comparison is by graph pattern matching (subgraph queries), not by hash set intersection
- CPG preserves original variable names; CIPE erases them

**Assessment:** CPG is highly relevant prior art added by this Phase 5B investigation. It establishes that the unified AST+CFG+DFG graph structure at source level existed by 2014 for security analysis. However, its application, normalization approach, and comparison mechanism are all different from CIPE's.

**Source:** Yamaguchi, F. et al. (2014). Modeling and discovering vulnerabilities with code property graphs. IEEE S&P 2014.

---

**A-14: SourcererCC — Sajnani et al., 2016**

**Title:** SourcererCC: Scaling Code Clone Detection to Big-Code  
**Authors:** Hitesh Sajnani, Vaibhav Saini, Jeffrey Svajlenko, Chanchal K. Roy, Cristina V. Lopes  
**Date:** 2016 (ICSE)  
**Mechanism:** Token-level bag-of-tokens approach with optimized inverted index and filtering heuristics. Detects Type-1, Type-2, and near-miss Type-3 clones at scale (hundreds of millions of LOC). Also used for code provenance (tracing code fragment origins across repositories).

**Overlaps with CIPE:**
- Code provenance goal (tracing fragment origins)
- Token-level identifier normalization (Type-2 detection)
- Partial-copy detection (fragment-level)

**Appears different from CIPE:**
- Token bag comparison, not semantic graph fragment comparison
- No CFG or DFG used
- No canonical binding IDs
- No cryptographic fingerprint artifact
- Similarity is a token overlap score, not a hash-based provenance certificate

**Assessment:** SourcererCC is prior art for the "code provenance at fragment level" application domain. It does not overlap with CIPE's semantic graph mechanism.

**Source:** Sajnani, H. et al. (2016). SourcererCC: Scaling code clone detection to big-code. ICSE 2016.

---

**A-15: GraphCodeBERT — Guo et al., 2021 (Microsoft)**

**Title:** GraphCodeBERT: Pre-training Code Representations with Data Flow  
**Authors:** Daya Guo et al. (Microsoft Research)  
**Date:** 2021 (ICLR)  
**Mechanism:** Transformer model pre-trained on code using both source tokens and data flow graph (DFG) structure. DFG edges (where-used relationships between variables) are incorporated as additional input to the attention mechanism. Used for tasks including clone detection, code search, code translation.

**Overlaps with CIPE:**
- Uses data flow graph edges for code analysis
- Applied to clone detection

**Appears different from CIPE:**
- Neural/learned representation — not deterministic or reproducible from source alone without model weights
- DFG is used as an attention bias, not as independently hashed fragments
- No canonical variable normalization — variable names are tokenized as-is
- No cryptographic fingerprint — output is a learned embedding vector
- Not reproducible: two identical programs run through different model versions produce different embeddings
- Semantic equivalence is approximate (similarity in embedding space), not cryptographic

**Assessment:** GraphCodeBERT establishes that data flow graph edges are useful for code analysis (including clone detection) by 2021. It does NOT establish cryptographic, rule-based, deterministic provenance. Its learned embedding approach is fundamentally different from CIPE's hash-based approach.

**Source:** Guo, D. et al. (2021). GraphCodeBERT: Pre-training code representations with data flow. ICLR 2021.

---

**A-16: TAILOR — CPG + GNN for Code Similarity (2022+)**

**Title:** TAILOR: Graph Neural Network-Based Code Similarity Detection Using Code Property Graphs  
**Authors:** Various (multiple academic groups, ~2022)  
**Mechanism:** Extracts Code Property Graphs (AST+CFG+DFG unified graph), applies Graph Neural Networks to learn node embeddings, uses learned similarity scores for clone detection.

**Overlaps with CIPE:**
- AST + CFG + DFG unified graph at source level
- Code similarity detection

**Appears different from CIPE:**
- Neural/learned approach — not deterministic or reproducible
- No variable name canonicalization
- No cryptographic fingerprint
- Similarity is a learned embedding distance, not hash set intersection

**Assessment:** TAILOR confirms that CPG-based code similarity is an active research area. Like GraphCodeBERT, it uses learning rather than rule-based cryptographic mechanisms.

**Source:** TAILOR paper (multiple publications, ~2022). Confirmed via Google Scholar search results.

---

### Gap 4 Resolution: Industry Prior Art — Additional Items Found

**A-17: US8997256B1 — Binary Fingerprinting (2015, attributed to Google/VirusTotal)**

**Title:** Fingerprinting executable code  
**Date:** 2015  
**Mechanism:** Generates fingerprints from compiled binary executables for provenance and similarity tracking. Binary-level analysis, not source-level.  
**Overlap:** Binary-level fingerprinting concept. Domain mismatch with CIPE.

---

**Industry Landscape Assessment (Google, Microsoft, Amazon, IBM, Meta):**

- **Google:** Google's publicly known code analysis work (BinDiff, now open-source; VirusTotal binary fingerprinting) operates at the binary level. No publicly available Google patent was found covering source-level normalized IR fingerprinting with CFG+DFG fragment hashing for provenance. The Code Property Graph work (Joern community) is an academic open-source tool, not a Google internal patent.

- **Microsoft:** GraphCodeBERT (2021) is the most relevant Microsoft work. It uses DFG for code analysis but is neural/learned, not cryptographic/deterministic. No Microsoft patent was found specifically covering rule-based semantic graph fragment hashing for source code provenance.

- **Amazon:** No relevant patents found in this search. Amazon's primary code analysis work (CodeGuru) focuses on code review automation, not provenance fingerprinting.

- **IBM:** IBM's patent portfolio in code analysis is extensive but focuses on: static analysis for security vulnerabilities, software composition analysis at the component level, and compiler optimization. No IBM patent was found covering canonical IR normalization + CFG/DFG fragment hashing for provenance.

- **Meta:** No relevant patents found in this search targeting CIPE's mechanisms.

- **GitHub / Copilot:** GitHub's work on code similarity focuses on deduplication for training data and license compliance at the function/file level (similar to SourcererCC approach). No GitHub patent found covering semantic graph fragment hashing for provenance.

**Assessment:** No single industry patent from a major technology company was found that specifically covers CIPE's combination of source-level canonical IR normalization + three-layer fragment taxonomy + cryptographic multiset accumulation. This does not mean such patents do not exist — internal patent portfolios at large companies are not fully searchable via public web search.

---

### Gap 5 Resolution: Formal Equivalence Checking Literature

**What is established:**

- **Translation Validation (Pnueli et al., 1998; Necula, 2000):** Checks that a compiler transformation preserves program semantics. Uses SSA/value graphs for comparison. Operates as a compiler verification technique, not as a provenance detection system. Established: SSA-based variable-name-independent program comparison.

- **Value Numbering (Alpern et al., 1988; GVN by Cooper et al.):** Assigns semantic equivalence classes to expressions in an SSA graph. Established: detecting that two expressions produce the same value, independent of variable names.

- **Program Equivalence Checking (Kundu et al., 2009; LLVM-based work):** Formally verifies that two programs compute the same function. Typically requires SMT solver-based reasoning. Goal is binary YES/NO equivalence, not partial similarity with confidence score.

**What is NOT established by equivalence checking literature:**
- Partial provenance detection (CIPE's matched/added/missing fragments)
- Cryptographic artifact construction from normalized IR
- Confidence scoring for partial overlap

**Assessment:** Formal equivalence checking is clearly prior art for the concept of variable-name-independent program comparison. CIPE does NOT perform formal equivalence checking — it performs partial structural similarity measurement. The equivalence checking literature establishes that related representations exist, but does not cover CIPE's specific application or output format.

---

### Gap 6 Resolution: LSCH Terminology and Mathematical Construction

**Search findings:**

The acronym **"LSCH"** as used in CIPE ("Lexicographically Sorted Concatenation Hash" or "Locality-Sensitive Cryptographic Hashing") was not found in any standard cryptographic literature, academic code analysis paper, or patent database.

The **mathematical construction** — (1) sort a set of fixed-length hash strings lexicographically, (2) concatenate the sorted strings, (3) apply SHA-256 to the concatenated result — is described in general cryptographic discussions as the **"sorted concatenation"** method for order-independent hashing. Specifically:

- CryptoSE (StackExchange Cryptography) and related forums describe "sort then concatenate then hash" as a standard technique for order-independent set hashing
- It is classified as the O(N log N) approach in discussions of multiset hash function comparisons
- It is presented as an alternative to MuHash that trades incremental-update capability for simplicity

**Conclusion on LSCH:**
- **The acronym "LSCH" as coined in CIPE does not conflict with any existing named cryptographic construction.** It is CIPE's own terminology.
- **However, the underlying mathematical construction (sort + concatenate + hash) is a well-known, commonly discussed technique** — not an original invention. It appears as a "common approach" in multiple discussion threads and comparison tables.
- **The name "LSCH" is new. The construction is not.** This distinction must be stated plainly.
- A patent attorney must be informed that the construction is known. Any claim to the construction itself would almost certainly fail. Claims that use the construction as part of a larger novel pipeline (e.g., "apply sorted-concatenation hash to normalized semantic graph fragments for program provenance") may fare differently.

---
