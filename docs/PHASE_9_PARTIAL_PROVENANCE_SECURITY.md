# Phase 9: Partial Provenance Security

## Objective
To test if an attacker can manipulate or dilute the evidence threshold required for a partial provenance match.

## Tests Performed
1. **Tiny Copied Fragment**: Copying a single 1-line basic block (`let a = 1;`).
   - **Result**: Generates 1 hash intersection. The established minimum evidence threshold is $T \ge 3$. A single instruction match is ignored as statistical noise or boilerplate.
2. **Boilerplate Matching**: Generating identical `for(let i=0; i<arr.length; i++)` loops.
   - **Result**: These canonicalize to 2 interconnected basic blocks (Init/Cond + Body). Hash intersection is 2. Fails the $T \ge 3$ threshold. False Positives correctly avoided.
3. **Surrounding Unrelated Code**: A stolen fragment (size 10 blocks) wrapped inside 1,000 blocks of unrelated code.
   - **Result**: The intersection remains 10 hashes. The partial provenance match triggers. Evidence dilution fails because CIPE relies on pure subset matching ($A \cap B$), not percentage-based similarity (which is vulnerable to dilution padding).
4. **Duplicated Code**: A stolen fragment copied 50 times in the same file.
   - **Result**: Because the multiset relies on unique element representation of graph topological equivalents, the 50 identical subgraphs merge into identical topological hash signatures, preventing hash-explosion attacks.

## Conclusion
The mathematical threshold of $T \ge 3$ intersecting basic block hashes provides extremely robust resistance to both False Positives (boilerplate collision) and Evasion by Dilution (padding with unrelated code).
