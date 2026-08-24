# CIPE: Prior-Art Search Plan

This document outlines the strategic plan for identifying existing prior art related to the Canonical IR Provenance Engine (CIPE) to determine patentability and prepare for filing.

## 1. Search Objectives
The primary goal is to find patents, academic papers, and existing open-source or commercial software that disclose mechanisms for:
1. Converting Abstract Syntax Trees (ASTs) into order-independent and name-independent cryptographic hashes.
2. Generating multiset accumulators (specifically Lexicographically Sorted Concatenation Hashes) for subsets of Dataflow and Control Flow graphs.
3. Conducting partial-match software provenance verification without relying on token streams or strict graph isomorphism.

## 2. Core Invention Elements (Keywords & Classifications)
### Keywords
* **Primary:** `Software provenance`, `Code plagiarism detection`, `Abstract Syntax Tree canonicalization`, `Semantic clone detection`, `Dataflow graph hashing`, `Control flow graph hashing`.
* **Secondary:** `Order-independent hashing`, `Multiset hash accumulator`, `Lexicographical sort hashing`, `Locality-sensitive hashing for code`, `Static Single Assignment (SSA) hashing`.
* **Exclusions:** Token-based plagiarism (MOSS, JPlag), n-gram matching, machine learning/LLM embeddings for code similarity.

### Relevant Patent Classifications (CPC/IPC)
* **G06F 8/40**: Compiler and interpreter technologies (parsing, intermediate representation).
* **G06F 8/75**: Structural analysis of code (refactoring, clone detection).
* **G06F 21/50**: Monitoring users, programs or devices to maintain the integrity of platforms (software attestation).
* **G06F 21/64**: Protecting data integrity (cryptographic hashing of software structures).

## 3. Search Venues
### 3.1 Academic Literature
1. **IEEE Xplore & ACM Digital Library**: Search for papers on "Semantic Code Clones", "Graph-based code similarity", and "AST Hashing". Focus on ICSE, FSE, and ASE conference proceedings.
2. **Google Scholar / arXiv**: Search for recent pre-prints on "Cryptographic software provenance" or "Order-agnostic code hashing".
3. **Specific Prior Art to Review**:
   * *Deckard* (Tree-based clone detection using characteristic vectors).
   * *CCFinder* (Token-based clone detection).
   * *Gitzinger et al.* (Hashes of basic blocks for malware analysis).

### 3.2 Patent Databases (USPTO, EPO, Google Patents)
* Search strings to deploy:
  * `("abstract syntax tree" OR "control flow graph") AND ("cryptographic hash" OR "fingerprint") AND ("order independent" OR "commutative" OR "multiset")`
  * `("plagiarism detection" OR "software provenance") AND "dataflow graph" AND "hash"`

### 3.3 Commercial & Open Source
* Search GitHub for implementations of "AST hashing" or "CFG fingerprinting".
* Review documentation for tools like:
  * **BinDiff / Zynamics**: Binary diffing tools (how do they hash CFGs at the binary level, and does it apply to ASTs?).
  * **Semgrep**: AST-based semantic grep (do they use structural hashing internally?).
  * **SourceClear / Snyk**: Dependency scanning tools (how do they match vulnerable snippets?).

## 4. Evaluation Criteria
When potential prior art is identified, evaluate it against CIPE's three core novelty claims:
1. Does it normalize variables into deterministic scope/depth bounds BEFORE hashing?
2. Does it use a set-difference algorithm on individual CFG/Dataflow edges to provide exact **partial matching** metrics?
3. Does it rely on Lexicographically Sorted Concatenation Hashes (LSCH) to bypass the computational cost of full graph isomorphism or homomorphic multiset accumulators?

If the prior art relies heavily on token-streams, string-matching, or requires full graph isomorphism, it is considered fundamentally distinct from CIPE.
