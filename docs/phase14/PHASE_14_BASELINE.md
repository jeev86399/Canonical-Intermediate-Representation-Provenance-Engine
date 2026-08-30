# Phase 14 Baseline: Repository Audit & Current State

## 1. Current Architecture
The Canonical Intermediate Representation Provenance Engine (CIPE) operates as a multi-stage static analysis pipeline:
1. **Parser**: Translates raw JS into AST (using `acorn`).
2. **Canonical IR**: Normalizes ASTs into structural blocks (removing variable names, comments, whitespaces).
3. **CFG & Dataflow**: Generates Control Flow Graphs and basic dataflow bindings for variables.
4. **Fingerprint Engine**: Uses Weisfeiler-Lehman Graph Kernel hashes with depth $K=2$ over CFG blocks.
5. **Provenance Index**: Content-addressable index storing mappings of WLCDH hashes to file/repository metadata.
6. **Job Engine**: Handles asynchronous queuing, idempotency, incremental bypass, and worker lifecycle.

## 2. Existing APIs
- **Job Submission**: `POST /api/jobs` (receives repository, commit id)
- **Job Status**: `GET /api/jobs/:id` (returns queue status, percentage, manifest identity, result, or error)
- **Index Query**: Queries to the internal index for exact, structural, partial matches.

## 3. Current Database Model
- No persistent SQL/NoSQL database has been firmly integrated yet for the provenance index; it primarily utilizes an in-memory Map structure for `fingerprint -> metadata[]`.
- Content-Addressable Storage (CAS) for Incremental Analysis caches results locally based on a SHA-256 identity composed of URI, Commit Hash, and Engine Version.

## 4. Job Engine Behavior
- Orchestrates asynchronous tasks.
- Returns standard lifecycle state transitions: `QUEUED -> RUNNING -> COMPLETED` or `FAILED`/`CANCELLED`.
- Idempotency is enforced. If the same `(RepoId, CommitId)` is queued, it instantly returns the cached manifest without re-parsing.

## 5. Worker Architecture
- Utilizes Node.js `worker_threads` for isolation.
- Main thread (`job-engine/index.js`) spawns a thread (`job-engine/worker.js`) via `workerData`.
- Master process handles network logic and queue persistence; worker performs intense CPU-bound AST/CFG traversal.
- Limits (`MAX_FILES`, `MAX_FILE_SIZE_BYTES`) prevent unbounded memory consumption.
- Timed out via `MAX_ANALYSIS_TIME_MS`.

## 6. Fingerprint Architecture
- Based on SHA-256 hashes of Canonical IR statements, merged into Basic Blocks.
- Propagated across the CFG utilizing Weisfeiler-Lehman (WLCDH).
- Deterministic property stringification (though currently uses `JSON.stringify` heavily in places).

## 7. Current Tests
- Tests range across 13 phases.
- Phase 13 tests (`tests/phase13/run.js`) cover: Idempotent Analysis, Incremental Analysis Speedups, Concurrent Analysis (10+ workers), Chaos Resource limits (max files bounds check), and Cancellation.
- Tests confirm that independent process-level faults are isolated successfully.

## 8. Current Known Limitations
- "MATCH" results are binary or statistical confidence scores, but there is currently no "Explainable Evidence" mechanism.
- Hashing uses `JSON.stringify` which may not be completely deterministic under property reordering.
- No historical auditing / appending log for verifications.
- No tamper detection for evidence payloads.
- Replay attacks or stale job replay behavior are loosely defined.
