# Phase 10: Cross-Repo Clone Detection

## Objective
To prove that CIPE can establish a mathematical provenance link between two entirely distinct git repositories, where one repository has cloned and superficially modified logic from the other.

## Methodology
The `cross-repo.js` experiment generated two disparate Git repositories (Repo A and Repo B):
- **Repo A:** Contained a target algorithmic function (Original).
- **Repo B:** Contained an unrelated function, alongside a stolen version of the algorithm from Repo A.

The stolen version was modified using common obfuscation techniques:
- Variable and parameter renaming.
- Whitespace and newline reformatting.
- Enclosing within a different lexical structure (beside an unrelated function).

## Experimental Results
When querying the CIPE fragments of Repo B against Repo A, the pipeline achieved an **80.00% Provenance Confidence**.
- **Matched Fragments:** 4
- **False Negatives:** 1 (The global Program-level entry block, which legitimately diverged due to the insertion of the unrelated function).
- **Verdict:** Partial Provenance Link Detected (Snippet Copying).

## Technical Conclusion
CIPE successfully survives boundary-crossing obfuscation. Because the topological graph inside the stolen function matched exactly, 4 out of 5 structural fragments matched identically, proving the core logic was cloned despite the textual git diff sharing zero similarity.
