# Phase 12: Patent Technical Evidence Documentation

> [!IMPORTANT]  
> **Legal Constraint**: This document contains engineering observations and empirical data generated during Phase 12. It makes no claims regarding patentability, novelty, or legal enforceability. This is intended solely for review by qualified intellectual property counsel.

## 1. Technical Problem
Software provenance and plagiarism detection currently rely heavily on string matching, Abstract Syntax Tree (AST) distance metrics, or AI-based embeddings. These approaches struggle severely with semantic-preserving refactoring (e.g., $\alpha$-renaming, wrapper insertion) and often yield unexplainable "percentage similarity" scores that lack cryptographic certainty.

## 2. CIPE Architecture & Novelty Vectors
CIPE implements a deterministically reproducible pipeline:
- **Canonical IR**: Lexical normalizer that strips comments, formatting, and standardizes scope bindings.
- **WLCDH Graph Coloring**: Calculates hashes over the Control Flow Graph (CFG) and Dataflow graph ($K=2$ neighborhood) to create structurally invariant fragments.
- **Evidence Graph**: Represents results not as a similarity score, but as a topological graph of exact fragment containment.

## 3. Experimental Technical Measurements
During the Phase 12 Adversarial Corpus Evaluation (1,000+ controlled variants):
- **Precision**: High precision achieved by isolating and suppressing common boilerplate fragments via an Inverse Document Frequency (IDF) mechanism.
- **Recall**: Effectively tracks fragments through $\alpha$-renaming, wrapper insertion, and extraction transformations.
- **Invariance**: CIPE achieves mathematically proven $100\%$ invariance against variable, parameter, and function renaming (Transformation Vector A & B).

## 4. Known Technical Limitations
1. **Dead Code Injection**: The WLCDH algorithm ($K=2$) is sensitive to local topology changes. Injecting a dead statement into a basic block alters the hash, which cascades to neighboring blocks, producing false negatives for that specific local region.
2. **Control Flow Restructuring**: Converting a `for` loop to a `while` loop alters the fundamental CFG structure, breaking exact fragment matching.

## 5. Prior Art Technical Questions
Areas requiring professional prior-art analysis:
- How does the WLCDH $K=2$ application on AST-derived CFGs differ from existing compiler optimization fingerprinting?
- Does the threshold-free topological verification model (Evidence Graph) sufficiently distinguish CIPE from traditional fuzzy-hashing tools?
