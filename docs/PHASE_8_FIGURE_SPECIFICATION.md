# Phase 8: Figure Specification for Patent Draft

This document defines the graphical figures required for the patent application. An illustrator should draft these using standard patent formatting (black and white, explicit reference numerals).

## FIGURE 1: Overall CIPE Architecture
- **Description**: A flowchart showing the macro system.
- **Elements**: 
  - (101) Source Code Repository
  - (102) CIPE Processing Engine
  - (103) Fingerprint Database (Multisets)
  - (104) Verification Engine
- **Visuals**: Arrows indicating flow from 101 to 102, outputting to 103. 104 queries 103.

## FIGURE 2: Code Processing Pipeline (The Method)
- **Description**: The core algorithm flow.
- **Elements**:
  - (201) Parsing to AST
  - (202) Lexical Normalization
  - (203) Identifier Erasure
  - (204) PDG Construction (CFG + DFG)
  - (205) WLCDH Iteration
  - (206) Multiset Projection

## FIGURE 3: Identifier Erasure Example
- **Description**: Before/After AST representation showing the deletion of variable names.
- **Visuals**: A box showing `let foo = 1;` becoming `VariableDeclaration(Constant)`.

## FIGURE 4: PDG (CFG + DFG) Representation
- **Description**: A basic block graph.
- **Visuals**: Nodes representing basic blocks. Solid arrows representing Control Flow (CFG). Dashed arrows representing Data Flow (DFG) between nodes.

## FIGURE 5: Weisfeiler-Lehman Cryptographic State Update
- **Description**: The mathematical accumulation step.
- **Visuals**: A central Node Hash (501) receiving a sorted list of CFG hashes (502) and a sorted list of DFG hashes (503). A SHA-256 function box (504) outputting the new state (505).

## FIGURE 6: Partial Provenance Multiset Intersection
- **Description**: Visualizing the $O(N)$ matching.
- **Visuals**: Two arrays of hash strings (Set A and Set B). Lines connecting identical hashes in both sets. A threshold gate (e.g., $\ge 3$) triggering a "Provenance Match" flag.

## FIGURE 7: Adversarial Obfuscation Example
- **Description**: Demonstrating robustness.
- **Visuals**: Code snippet A and a heavily obfuscated Code snippet B (renamed variables). Both pointing to the exact same Cryptographic Multiset string.

## FIGURE 8: Distributed Cloud Embodiment
- **Description**: System diagram of alternative embodiment.
- **Visuals**: A CI/CD pipeline uploading a multiset fingerprint over a network to a cloud Verification API querying a global Elasticsearch cluster.
