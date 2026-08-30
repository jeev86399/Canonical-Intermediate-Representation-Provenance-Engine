# Performance Benchmark Results

## Metric Collection
The `performance.test.js` script dynamically creates synthetic Multi-File Repositories and routes them through the full CIPE parsing and verification pipeline.

## Raw Results (Phase 15 Engine)
*Note: Run on a standard desktop environment.*

| File Count | Pipeline Duration (ms) | Total Processed Fragments |
|------------|-------------------------|---------------------------|
| 10         | ~30 ms                  | 20                        |
| 100        | ~80 ms                  | 200                       |
| 500        | ~370 ms                 | 1000                      |

## Conclusion
Repository-level partial provenance scales highly efficiently. Due to the mathematically compressed fragment fingerprints, intersection operations on `Set` structures are O(N) where N is the total number of fragments. Computing provenance across 500 files takes well under half a second, easily satisfying asynchronous job queue requirements established in Phase 13.
