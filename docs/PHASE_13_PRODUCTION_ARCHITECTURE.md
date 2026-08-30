# Phase 13: Production Architecture

This document describes the production-grade pipeline architecture engineered to scale the Canonical IR Provenance Engine (CIPE) for concurrent, asynchronous repository analysis.

## Core Flow
1. **Client**: Submits an analysis request via `POST /api/repositories/analyze`.
2. **API (Express)**: Performs synchronous validation (limits, parameters) and calculates the **Idempotency Identity**. If an identical request completed, it returns the cached `resultReference`. Otherwise, it pushes the task to the **Job Manager** and returns a `jobId`.
3. **Job Manager (`job-engine`)**: Maintains an asynchronous job queue. Transitions jobs through `QUEUED -> RUNNING -> COMPLETED | FAILED | CANCELLED`. Manages concurrency limits.
4. **Analysis Worker**: An isolated operational boundary executing the heavy computation.
   - Parses the repository incrementally.
   - Extracts the Canonical IR, Dataflow, and CFG using the `CIPE Engine`.
   - Populates the **Fragment Index**.
5. **Evidence Store / Content-Addressable Storage**: Saves canonical fragment sets, evidence graphs, and reproducible manifests using deterministic cryptographic hashing to avoid duplicate storage.
6. **React Dashboard (`apps/web`)**: Polls `GET /api/jobs/:id` for live progress, rendering transparent observability telemetry.

## Synchronization & Asynchrony
- **Synchronous**: API request validation, basic database inserts for job creation, token bucket rate limits, identity hashing, dependency-aware cache validation.
- **Asynchronous**: Repository git pulling, filesystem traversal, AST generation, dataflow graph coloring (WLCDH), cryptographic index queries, and IO-bound artifacts storage.

## Data & Storage Boundaries
- **Ephemeral State**: In-memory job queue handles temporary execution contexts.
- **Persistent State**: MongoDB handles `job` metadata (`startedAt`, `progress`, `errors`) and high-level `verification` audit logs.
- **Content-Addressable Blob Storage**: Massive analysis output (fragment indices, serialized canonical sets) is heavily deduplicated and saved off-database using SHA-256 derivation keys, mapping directly to `repository:commit:file`.

## Failure Recovery & Reliability
- **Worker Crashes**: If an analysis worker throws a fatal unhandled exception or times out, the `job-engine` traps it, marks the job `FAILED`, exposes the `error` reason, and frees the concurrency slot. A job is NEVER left permanently `RUNNING`.
- **Malformed Git / Files**: Corrupt files within a repository simply trigger `UNSUPPORTED` or warning states in the manifest, logging a soft error but allowing the overall job to complete `PARTIAL_ANALYSIS`.
- **Timeouts**: Configurable upper bounds automatically trigger `CANCELLED` states if the pipeline stalls.

## Security Boundaries (Zero-Trust Analysis)
- The target repository is untrusted input.
- **No Execution**: The CIPE Engine parses raw ASTs using static lexers; it does not invoke Node.js `require()` or `eval()` on target code.
- **No Hooks**: Git hooks and `package.json` install scripts are explicitly stripped and disabled.
- **Path Confinement**: Traversal limits reject symlink escapes or absolute path injections out of the `/tmp/cipe-clone/` bounds.
