# Phase 8: Claim Architecture Concepts

This document outlines the independent and dependent technical limitations that define the WLCDH mechanism. These are technical concepts for a patent professional to translate into formal legal claims.

## A. Independent Method Claim Concept
A computer-implemented method for verifying partial software provenance, comprising:
1. Receiving a first source code file and parsing it into a first Abstract Syntax Tree (AST).
2. Generating a unified Control-Flow and Data-Flow Graph (PDG) from the AST.
3. Erasing all lexical variable identifiers and positional scope bindings from the PDG to create a structurally generic graph.
4. For each node in the generic graph, iteratively generating a cryptographic state update comprising:
   - A hash of the node's previous state.
   - A sorted sequence of hashes representing incoming Control-Flow edges.
   - A separated, sorted sequence of hashes representing incoming Data-Flow edges.
5. Projecting the final hashed nodes into a flat, unordered cryptographic multiset representing the first source code file.
6. Comparing the first multiset against a second multiset generated from a second source code file.
7. Declaring a partial provenance match if the intersection of the two multisets meets a predefined numerical threshold.

## B. Independent System Claim Concept
A system comprising one or more processors configured to:
(Mirror steps 1-7 from Method Claim A, emphasizing the memory-efficient execution of the multiset intersection relative to traditional NP-hard graph matching architectures).

## C. Dependent Technical Limitations
To provide fallback positions during prosecution, the following limitations are technically demonstrated:
- **Limitation 1 (Identifier Erasure)**: The erasure of identifiers specifically includes overwriting `Identifier` AST nodes with a static constant, decoupling the graph from developer naming choices.
- **Limitation 2 (Multiset Sorting)**: The sorting of incoming edges is performed lexicographically to ensure commutative structural equivalence.
- **Limitation 3 (Domain Separation)**: The cryptographic state update explicitly segregates control-flow hashes from data-flow hashes using deterministic delimiters to prevent symmetric graph collisions.
- **Limitation 4 (Thresholding)**: The predefined numerical threshold for a partial provenance match is $\ge 3$ basic blocks, experimentally derived to eliminate generic syntactic boilerplate collisions.
- **Limitation 5 (Linear Scaling)**: The comparison step executes in linear time $O(N)$ relative to the size of the multisets, bypassing sub-graph isomorphism entirely.
