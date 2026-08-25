# Phase 6: Formal Specification

**Mechanism Name:** Weisfeiler-Lehman Contextual Dataflow Hashing (WLCDH)
**Date:** 2026-08-25

## 1. Technical Problem Addressed
The previous Canonical IR Provenance Engine (CIPE v1.0) relied on Lexical Positional Identifiers (`d:N/b:M`) and independent edge hashing. This architecture suffered from a critical vulnerability: **Dependency-Order Injection**. By inserting a dead dummy variable (`let dummy = 0;`), all subsequent positional identifiers in the scope shifted, cascading changes through all downstream dataflow and control-flow edge hashes, completely destroying the fingerprint despite zero semantic change to the target algorithm. Additionally, hashing isolated edges caused a loss of graph topology context.

## 2. Proposed Mechanism: WLCDH
The WLCDH algorithm applies a bounded iteration of neighborhood hashing (inspired by the Weisfeiler-Lehman graph isomorphism test) directly to the unified Control Flow Graph (CFG) and Data Flow Graph (DFG). Crucially, **all lexical and positional identifiers are completely stripped from the block instructions**. A variable's identity is defined exclusively by the cryptographic signature of the node that computed it.

### 2.1 Input Representation & Intermediate Data Structures
- **$V$**: Set of basic blocks (nodes).
- **$E_C \subseteq V \times V$**: Set of control-flow edges.
- **$E_D \subseteq V \times V$**: Set of dataflow (use-def) edges. An edge $(u, v)$ means block $v$ reads a value defined in block $u$.

### 2.2 Canonicalization Stages
1. **Standard IR Generation**: Convert AST to IR (normalize loops, `if`/`ternary`, commutative operators).
2. **Identifier Erasure**: All variable names and positional identifiers (`d:N/b:M`) are scrubbed from the Basic Block stringification. Uses are represented generically (e.g., `Ref(DefNode)`).

### 2.3 Mathematical Formulation (Fingerprint Construction)

**Step 1: Initialization (k=0)**
For every node $v_i \in V$, compute the base signature:
$$ S^0(v_i) = SHA256( \text{CanonicalizeInstructions}(v_i) ) $$
*(Note: Because identifiers are stripped, $S^0$ only captures the mathematical structure of the block, e.g., `Assignment(BinaryOp(+, Literal(1), Literal(2)))`).*

**Step 2: Iterative Contextual Aggregation**
For iterations $k = 1$ to $K$ (where $K=2$, representing a 2-hop structural context):
For each node $v_i \in V$:

Collect incoming dataflow signatures:
$$ D_{in}(v_i) = \text{sort}( \{ S^{k-1}(u) \mid (u, v_i) \in E_D \} ) $$

Collect incoming control-flow signatures:
$$ C_{in}(v_i) = \text{sort}( \{ S^{k-1}(w) \mid (w, v_i) \in E_C \} ) $$

Update the node's signature:
$$ S^k(v_i) = SHA256( S^{k-1}(v_i) \oplus \text{join}(D_{in}) \oplus \text{join}(C_{in}) ) $$

**Step 3: Global Fingerprint Collection**
The final program fingerprint is the multiset of fully resolved node signatures:
$$ \mathbb{F} = \{ S^K(v_i) \mid v_i \in V \} $$

### 2.4 Verification & Partial Provenance Algorithm
Given two fingerprints $\mathbb{F}_A$ and $\mathbb{F}_B$:
$$ \text{Intersection } I = \mathbb{F}_A \cap \mathbb{F}_B $$
$$ \text{Confidence } C = \frac{|I|}{\min(|\mathbb{F}_A|, |\mathbb{F}_B|)} $$

- **Matched Evidence**: The specific blocks corresponding to hashes in $I$.
- **Missing/Added Evidence**: Hashes in $\mathbb{F}_A \setminus I$ and $\mathbb{F}_B \setminus I$.

## 3. Why this Mechanism is Technically Different
1. **Total Immunity to Dummy Variables**: If an adversary injects `let dummy = 0;`, a new node $v_{dummy}$ is created. Because the target algorithm does not read `dummy`, there is no dataflow edge from $v_{dummy}$ to any algorithm node. Therefore, the dummy node's signature never enters the $D_{in}$ of the target nodes. The target algorithm hashes remain **100% mathematically identical**, surviving the dependency-order injection attack.
2. **Topology Preservation**: Unlike independent edge hashing, $S^2(v)$ encodes the precise sub-graph structure 2 hops backward, preventing disconnected edges from spoofing a connected path.

## 4. Complexity & Requirements
- **Determinism**: Sorting step inside $D_{in}$ and $C_{in}$ guarantees order-independent determinism regardless of AST traversal order.
- **Complexity**: $O(|V| + |E_C| + |E_D|)$ per iteration. Since $K$ is a small constant (e.g., 2), execution scales linearly $O(N)$ with program size.
- **Security Assumptions**: Relies on SHA-256 pre-image and collision resistance. Assumes 256-bit hashes truncated or full are sufficient to avoid accidental signature collision within the bounded iteration space.

## 5. Failure Conditions & Unsupported Cases
- **Cyclic Dataflow**: Handled by capping $K=2$. Infinite loops do not crash the hashing phase because it is a fixed $K$-iteration message passing algorithm, not an unbounded traversal.
- **Boilerplate False Positives**: While dummy variable immunity is solved, a large injection of standard boilerplate (e.g., 500 identical `return false;` blocks) will dilute the confidence denominator. Future implementations may require IDF weighting.
