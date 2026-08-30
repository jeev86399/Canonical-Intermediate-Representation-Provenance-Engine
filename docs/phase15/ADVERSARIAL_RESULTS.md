# Adversarial Results

## Multi-File Provocation
In Phase 15, we tested the resilience of the repository-level provenance index.

## Attack Vectors Blocked
1. **File Renaming/Movement**: A codebase that was entirely refactored to move `fileA.js` into `src/utils/fileA-renamed.js` triggers an **EXACT_MATCH**. The global fragment aggregation model inherently ignores physical file hierarchies.
2. **Dead-Code Dilution**: When an attacker attempts to dilute a stolen codebase by artificially injecting 50 unrelated files, the global set intersection correctly identifies the entire core fragment set as a **PARTIAL_PROVENANCE** match and explicitly lists the number of `addedFragments` (the dilution) in the verification receipt.
3. **Completely Different Source**: An entirely distinct repository triggers 0 matched fragments, resulting in a **DIFFERENT** classification with zero false positives.

## Summary
The global multi-file aggregation logic forces adversarial transformations to attack the inner structural graph of the files themselves, rendering file renaming and folder obfuscation completely ineffective.
