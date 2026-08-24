# INDEPENDENT PATENT & TECHNICAL REVIEW: CIPE

**Date:** 2026-08-24
**Reviewer:** Independent Technical Reviewer (Hostile Persona)
**Subject:** CIPE (Canonical IR Provenance Engine)

---

## 1. PIPELINE RECONSTRUCTION & STANDARD VS. CUSTOM ANALYSIS

CIPE processes JavaScript source code through the following pipeline. Here is the blunt breakdown of what is standard vs. custom:

1. **Source Code → AST**: Uses standard `@babel/parser`. Zero novelty.
2. **Scope Analysis**: Standard lexical scope traversal. Zero novelty.
3. **Canonicalization**: Assigns `d:N/b:M` (depth/binding) IDs. This is essentially a variant of De Bruijn indexing (invented 1972) adapted for block scopes. Normalizes commutative operators and loop forms. Standard compiler frontend normalization (e.g., GVN, canonicalization passes). Zero novelty.
4. **CFG Construction**: Standard basic block and edge extraction. Zero novelty.
5. **Dataflow/SSA**: Standard use-def chain extraction. Zero novelty.
6. **Fragment Extraction**: Decomposing graphs into individual nodes and edges. Known in graph mining and code similarity (e.g., Code Property Graphs, PDG subsetting). 
7. **Fingerprinting**: Applies standard SHA-256 to strings. Sorts hashes and concatenates them. Standard order-independent multiset hashing technique.
8. **Partial Provenance Verification**: Set intersection (Jaccard-like index). Standard in clone detection (Winnowing, SourcererCC).

**Conclusion:** CIPE is an orchestration of textbook compiler techniques and standard cryptographic hashing. There is no new mathematical algorithm, no new data structure, and no new cryptographic primitive.

---

## 2. CHALLENGING THE "DIFFERENTIATORS"

**A. Scope-depth positional identifiers (`d:N/b:M`)**
- *Is it already known?* Yes. It is functionally a De Bruijn index for lexical bindings, combined with SSA-like identifier renaming.
- *Is it obvious?* Yes. Anyone wanting to normalize variable names while preserving scope hierarchy would use a relative index.

**B. Three-layer fragment taxonomy (Block + CFG Edge + DFG Edge)**
- *Is it already known?* Yes. Code Property Graphs (Yamaguchi 2014) explicitly combine AST, CFG, and DFG edges. Extracting these as independent features for machine learning or hashing is standard practice in clone detection.
- *Is it obvious?* Yes. Combining control flow and data flow is the defining characteristic of Program Dependence Graphs (PDG) (Ferrante 1987).

**C. Independent fragment hashing**
- *Is it already known?* Yes. BinDiff hashes basic blocks. Winnowing hashes k-grams. Hashing edges is a standard graph kernel technique.

**D. Sorted cryptographic accumulation (LSCH)**
- *Is it already known?* Yes. "Sort, concatenate, hash" is the textbook O(N log N) approach to hashing a multiset deterministically. It is widely discussed in cryptography forums as the naive alternative to commutative hashes (like MuHash). 
- *Is it obvious?* Yes.

**E. Partial fragment provenance verification**
- *Is it already known?* Yes. Using set intersection over hashed features to detect partial clones is the exact mechanism of MOSS/Winnowing (2003) and SourcererCC (2016).

**F. Explainable matched/missing/added evidence**
- *Is it already known?* Emitting a diff or set-difference of overlapping features is a standard UI/reporting feature, not a patentable mechanism. It is mathematically just `A ∩ B`, `A \ B`, and `B \ A`.

**G. The "Combination is Novel" argument**
- Connecting a standard compiler frontend (AST -> CFG -> DFG) to a standard clone detection backend (Hash -> Set Intersection) is highly vulnerable to a 35 U.S.C. § 103 (or equivalent) obviousness rejection. Combining PDG extraction with Winnowing set-intersection yields exactly CIPE.

---

## 3. PRIOR-ART CROSS-CHECK

- **PDG-based clone detection (Komondoor & Horwitz 2001):** Solves the exact same problem (semantic clone detection ignoring syntax) using the exact same underlying structures (CFG + DFG).
- **Code Property Graphs (2014):** Establishes the unified representation of syntax, control, and data flow.
- **WO2017210005A1:** Explicitly uses CFG extraction followed by cryptographic hashing for structural fingerprinting. 
- **BinDiff (2004):** Hashes basic blocks and compares sets of hashes to find similarities across different compilations.
- **Translation Validation / Equivalence Checking:** Establishes the use of normalized IRs to prove semantic equivalence regardless of variable naming or syntactic sugar.

---

## 4. CLAIM ELEMENT ATTACK

| CIPE Element | Already Known? | Closest Prior Art | Technical Difference | Obvious Combination Risk | Confidence |
|---|---|---|---|---|---|
| 1. AST parsing | Yes | Every compiler | None | N/A | High |
| 2. Lexical scope analysis | Yes | Every compiler | None | N/A | High |
| 3. Variable normalization | Yes | CCFinder, NiCad | None | N/A | High |
| 4. De Bruijn/depth-style IDs | Yes | De Bruijn indices (1972) | Block-level adaptation | High | High |
| 5. Syntax canonicalization | Yes | GVN, Compiler passes | None | N/A | High |
| 6. CFG construction | Yes | Standard literature | None | N/A | High |
| 7. SSA/dataflow | Yes | SSA (1988), PDG (1987) | None | N/A | High |
| 8. Fragment extraction | Yes | CPG (2014), Graph Kernels | None | High | High |
| 9. Block hashing | Yes | BinDiff (~2004) | Operates on IR not binary | High | High |
| 10. Control-edge hashing | Yes | Graph kernels | None | High | High |
| 11. Data-edge hashing | Yes | PDG clone detection | None | High | High |
| 12. Sorted concatenation | Yes | Crypto literature | None | High | High |
| 13. Order-independent comp. | Yes | Winnowing (2003) | None | N/A | High |
| 14. Partial provenance | Yes | SourcererCC, MOSS | None | N/A | High |
| 15. Matched/added/missing | Yes | Standard set math | None | High | High |
| 16. Complete CIPE pipeline | Conceptually | PDG + Winnowing | Specific fragment format | EXTREME | High |

---

## 5. LOOKING FOR A REAL TECHNICAL INVENTION

**Does CIPE contain a specific mechanism that solves a concrete technical problem?**
No. It is an application of known mathematical and compiler algorithms to a known problem (plagiarism/provenance detection). 

It does not invent a new way to parse JavaScript. It does not invent a new hashing algorithm. It does not invent a new data structure (CPG and PDG predate it). 

The only "difference" is the specific arbitrary decision to hash individual edges rather than subgraph isomorphisms. However, breaking a graph into a "bag of edges" and hashing them is a standard graph kernel technique (e.g., edge histograms, WL-kernels). There is no "technical effect" here other than identifying copied text, which is an administrative/intellectual property outcome, not an improvement in computer functioning.

---

## 6. ATTACKING THE FINGERPRINTING DESIGN

The current "Lexicographically Sorted Concatenation Hash" (LSCH) is mathematically flawed for its stated purpose:
- **Dependency Context Loss:** By breaking the CFG and DFG into isolated, independently hashed edges (`A->B`, `B->C`), CIPE loses the global graph topology. A graph consisting of two disconnected edges `A->B` and `C->D` will produce the exact same fingerprint components as a connected path `A->B->C->D` if the node contents match.
- **Boilerplate Density:** A program with 100 `return true;` blocks will completely skew the Jaccard similarity index, causing massive false positives.
- **Dependency-Order Manipulation Attack:** The Phase 4 report admits that inserting `let dummy = 0;` shifts all downstream `d:N/b:M` identifiers. Because every downstream data-edge fragment includes the binding ID, a single dummy variable destroys the entire downstream fingerprint. The system is structurally fragile against the most basic adversarial obfuscation.
- **Collision via Duplicate Masking:** Since sets do not preserve multiplicity, `A + A + A` hashes to the same set as `A`.

*Conclusion:* The fingerprint design does not offer a meaningful technical advantage over simpler approaches. In fact, it is arguably worse than PDG subgraph isomorphism because it is trivially defeated by dummy variable injection.

---

## 7. CHECKING THE EXPERIMENTAL EVIDENCE

Reviewing `docs/FINAL_TECHNICAL_REPORT.md`:
- **The 18/18 tests are synthetic and self-authored.** Passing one's own unit tests proves functional correctness, not novelty, robust utility, or patentability.
- **Adversarial tests expose fatal flaws.** The system failed 4 out of 5 adversarial attacks. The report correctly admits that wrapping code in an IIFE or injecting dead code evades detection.
- **False Positives:** A 41.2% match on a single constant change proves the threshold logic is arbitrary and highly sensitive to program size.
- **Performance:** 444ms for 405 lines of deeply nested code (quadratic complexity) is extremely poor for static analysis.

*Conclusion:* The experiments prove that CIPE is a brittle prototype. It works only under friendly, non-adversarial conditions and fails spectacularly against basic obfuscation (which is the entire point of a cryptographic provenance engine).

---

## 8. INDIA-SPECIFIC PATENT CONSIDERATIONS (SECTION 3(k))

**Section 3(k) of the Indian Patents Act, 1970** strictly prohibits patents for "a mathematical or business method or a computer programme per se or algorithms."
- **Computer Programme Per Se:** The Indian Patent Office (IPO) Guidelines (2017) require a software invention to demonstrate a **"technical effect"** or a **"technical contribution"** (e.g., faster memory access, lower bandwidth, better hardware control).
- **CIPE's Technical Effect:** CIPE takes code as data, applies a mathematical algorithm (graph extraction + hashing), and outputs a similarity score. The result (detecting copied code) is an administrative, legal, or business outcome. It does not improve the internal functioning of the computer.
- **Comparison to WO2017210005A1:** That patent used CFG hashing to detect runtime malicious attacks on distributed data nodes—a clear technical effect improving system security. CIPE is a static analysis tool for plagiarism. 
- **Verdict for India:** Under Section 3(k), CIPE is almost certainly ineligible. It is purely a computer program executing an algorithm to compare data files. 

---

## 9. FINAL VERDICT

**D. NO CLEAR PATENTABLE TECHNICAL MECHANISM IDENTIFIED**

**Explanation:**
CIPE is a well-engineered application of existing compiler and cryptographic techniques. However, it lacks any novel technical mechanism. 
1. The pipeline is an obvious combination of Program Dependence Graphs (PDG) and token/k-gram set-intersection (Winnowing).
2. The fingerprinting technique (sorted concatenation) is mathematically standard and suffers from fatal structural vulnerabilities (dummy variable injection).
3. The system solves no new technical problem and provides no internal improvement to computer functioning, making it highly vulnerable to subject-matter eligibility rejections (Alice in the US, Section 3(k) in India). 

Do not waste capital prosecuting this as a patent. It should be open-sourced, published as a blog post or academic paper, or kept as a trade secret/internal tool.
