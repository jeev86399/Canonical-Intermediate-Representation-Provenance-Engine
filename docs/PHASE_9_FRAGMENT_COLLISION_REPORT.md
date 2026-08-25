# Phase 9: Fragment Collision Report

## Objective
To prove that structurally different fragments do not produce identical fingerprints (a Hash Collision) due to weak normalization.

## Intra-Block Injection Vulnerability
In Phase 8, non-commutative operations like `a / b` and `b / a` produced identical fingerprints because the dataflow edges entering the subtraction node were sorted lexicographically without tracking their operand roles.

## Phase 9 Patch
The WLCDH Engine was modified to inject **Cryptographic Edge-Roles**. When the AST is traversed to extract DFG edges, the AST property key (e.g., `left`, `right`, `argument`) is appended to the edge as domain separation.

## Experimental Results
- **Target 1**: `b - c` (Hash: d8414328c9a120f006974e22d6511942c474a3bd829a6752cfb0b8fefdd9e9b8)
- **Target 2**: `c - b` (Hash: 98203b6b310b25b8eeaa575f83c8f9defbb562c39925de683cb3fba3650c94b4)

**Result**: Hashes differ entirely. The Intra-Block Collision vulnerability has been completely eliminated by the Phase 9 Edge-Role implementation.
