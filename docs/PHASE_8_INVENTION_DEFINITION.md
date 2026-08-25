# Phase 8: Technical Invention Definition

## A. Problem
Detecting semantic software clones and tracking partial code provenance across decoupled systems (e.g., CI/CD pipelines, open-source compliance) fails when using token-stream hashing due to trivial syntactic obfuscation (variable renaming, whitespace). Sub-graph isomorphism on Program Dependence Graphs (PDGs) solves obfuscation but is computationally intractable for fast, large-scale database intersections.

## B. Technical Input
Raw JavaScript source code files or fragments.

## C. Technical Transformation
1. **Acorn Parsing**: Converts source to an Abstract Syntax Tree (AST).
2. **Lexical Normalization**: Converts syntactic sugar into canonical forms (e.g., arrow functions to standard functions, explicit implicit returns).
3. **Graph Construction**: Generates a unified Control-Flow Graph (CFG) and Data-Flow Graph (DFG) in Static Single Assignment (SSA) form.
4. **Identifier Erasure**: Systematically deletes all variable names, lexical scopes, and positional bindings from the resulting graph, leaving only the mathematical AST structure.
5. **Shallow Topological Folding (WLCDH)**: Commutatively hashes each basic block's internal structure with the sorted hashes of its incoming CFG and DFG edges iteratively over $K$ steps.

## D. Intermediate Representation
An identifier-scrubbed, mathematically canonical Basic Block containing SSA-linked AST instructions.

## E. Fragment Construction
The graph is decomposed into an unordered set of topologically hashed Basic Blocks, rather than extracted edge lists or subgraphs.

## F. Fingerprint Construction
A cryptographic multiset (using SHA-256) of all generated Basic Block hashes, represented as a concatenated, lexicographically sorted string payload.

## G. Verification Mechanism
Set intersection between the hashes in Fingerprint A and Fingerprint B.

## H. Technical Output
A deterministically comparable cryptographic fingerprint mapping the topology of the code.

## I. Measurable Technical Effect
Reduces graph-matching complexity from NP-hard (sub-graph isomorphism) to $O(N)$ multiset intersection while successfully resisting variable renaming, function relocation, and structural dependency-order injection.
