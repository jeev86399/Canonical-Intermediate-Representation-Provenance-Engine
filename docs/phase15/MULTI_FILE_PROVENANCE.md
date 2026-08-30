# Multi-File Provenance

## Aggregation Model
Repository matching is fundamentally different from file matching. When a codebase is refactored, files are renamed, combined, and split. A traditional checksum will fail.

The Phase 15 model aggregates ALL extracted fragments into a unified global `Set<Fingerprint>`. 

### Set Theory Evaluation
If Repository A contains `{f1, f2, f3}` spread across 5 files, and Repository B contains `{f2, f3, f4}` spread across 2 files, the provenance engine computes the intersection globally, irrespective of the physical file boundaries.

- **Intersection (`f2, f3`)**: The core matched fragments representing the verified canonical provenance.
- **Base Difference (`f1`)**: The missing fragments (code that was deleted or refactored beyond mathematical recognition).
- **Target Difference (`f4`)**: Unrelated fragments (dead-code dilution or newly authored logic).

### Classification Bounds
- `EXACT_MATCH`: 100% intersection.
- `PARTIAL_PROVENANCE`: > 0% intersection.
- `DIFFERENT`: 0% intersection.
