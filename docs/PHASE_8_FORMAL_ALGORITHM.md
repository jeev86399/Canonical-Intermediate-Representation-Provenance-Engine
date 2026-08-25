# Phase 8: Formal Algorithm

This document mathematically formalizes the CIPE WLCDH mechanism as actually implemented in `tests/phase6/engine.js`.

## 1. Definitions

- Let $P$ be a source code program string.
- Let $A(P)$ be the Abstract Syntax Tree parsed from $P$.
- Let $S(A)$ be the set of lexical variable identifier strings in $A$.
- Let $C(A, S)$ be the **Canonical Representation** where all string tokens $s \in S$ are deleted, yielding $A'$.

## 2. Graph Construction

- Let the Program Dependence Graph $G = (V, E_C, E_D)$ where:
  - $V$ is the set of Basic Blocks $v_i \in A'$.
  - $E_C$ is the set of directed Control-Flow edges $(u, v)$ such that execution flows from $u$ to $v$.
  - $E_D$ is the set of directed Data-Flow edges $(u, v)$ such that variable data flows from $u$ to $v$.

## 3. Initialization Step ($K=0$)

For each vertex $v \in V$:
- Define the initialization state $H_0(v) = \text{SHA-256}(\text{Serialize}(v))$, where $\text{Serialize}$ yields the deterministic JSON of the basic block containing no lexical identifiers.

## 4. Weisfeiler-Lehman Contextual Dataflow Iteration ($K > 0$)

For iteration step $k$ from 1 to $K$:
For each vertex $v \in V$:

Let $N_C(v)$ be the set of incoming control-flow neighbors $\{u \mid (u, v) \in E_C\}$.
Let $N_D(v)$ be the set of incoming data-flow neighbors $\{u \mid (u, v) \in E_D\}$.

Define the commutative sorted neighbor accumulation:
$M_C^k(v) = \text{Sort}(\{ H_{k-1}(u) \mid u \in N_C(v) \})$
$M_D^k(v) = \text{Sort}(\{ H_{k-1}(u) \mid u \in N_D(v) \})$

Define the node state update:
$H_k(v) = \text{SHA-256}(H_{k-1}(v) \parallel \text{Concat}(M_C^k(v)) \parallel \text{Concat}(M_D^k(v)))$

## 5. Fingerprint Generation

After $K$ iterations, the final fragment set for the program is:
$F(P) = \{ H_K(v) \mid v \in V \}$

The full program cryptographic fingerprint is:
$\text{Fingerprint}(P) = \text{SHA-256}(\text{Concat}(\text{Sort}(F(P))))$

## 6. Verification Mechanisms

### Whole-Program Provenance
$V(P_1, P_2)$ is true iff $\text{Fingerprint}(P_1) == \text{Fingerprint}(P_2)$.

### Partial-Fragment Provenance
Let $F_1 = F(P_1)$ and $F_2 = F(P_2)$.
The partial provenance measure is defined as the multiset intersection:
$PV(F_1, F_2) = F_1 \cap F_2$

A positive provenance match is declared if $| PV(F_1, F_2) | \ge T$, where threshold $T = 3$.
