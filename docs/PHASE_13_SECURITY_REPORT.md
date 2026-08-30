# Phase 13: Security & Resource Governance Report

## Threat Model & Attack Vectors Analyzed

1. **Malicious AST Injection**
   - **Vector**: An attacker uploads a JS file that exploits the V8 parser to execute arbitrary code.
   - **Defense**: We use the Acorn parser running in an isolated Worker thread. The code is treated strictly as a string and parsed into an AST. `eval()`, `require()`, or dynamic execution is NEVER performed.
   - **Result**: PASS.

2. **Repository Path Traversal**
   - **Vector**: A malicious Git repository contains files with names like `../../etc/passwd` to read host files.
   - **Defense**: Path sanitization in `incremental.js` blocks any file paths starting with `/` or containing `../`.
   - **Result**: PASS.

3. **Archive/Repository Bombs (Zip Bombs)**
   - **Vector**: A repository contains millions of files or gigabytes of JS code designed to exhaust memory.
   - **Defense**: Strict limits enforced by `limits.js` (`MAX_FILE_SIZE_BYTES = 1MB`, `MAX_FILES = 5000`). Truncation occurs safely.
   - **Result**: PASS.

4. **Resource Exhaustion (Denial of Service)**
   - **Vector**: Spawning thousands of parallel analysis jobs to crash the node.
   - **Defense**: Global `MAX_CONCURRENCY` limit queuing mechanisms in `packages/job-engine/index.js`.
   - **Result**: PASS.

5. **Worker Crashes**
   - **Vector**: A job crashes the worker thread (e.g. OOM or infinite loop in graph traversal).
   - **Defense**: The orchestrator handles `worker.on('exit')` and `worker.on('error')` correctly, marking the job `FAILED` and recovering the slot.
   - **Result**: PASS.

## Worker Isolation Strategy
Currently, isolation is achieved via Node.js `worker_threads` which provide separate V8 isolates and memory spaces. This prevents a crash in analysis from taking down the API server.
In a true multi-tenant cloud environment, this should be extended to isolated containers (e.g., Docker/gVisor), but threads are sufficient to prove the boundary concept for this phase.
