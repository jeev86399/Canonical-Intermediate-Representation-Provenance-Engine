# Phase 16 End-To-End Architecture

## Data Flow

1. **User Client (React Web Dashboard)**
   - Sends `POST /api/compare-repositories { baseRepoPath, targetRepoPath }`
   - Immediately receives a `jobId` and begins polling `GET /api/jobs/:id/progress`
   - Uses `lucide-react` icons and glass-panel CSS to present modern visualization of complex AST metrics.

2. **API Layer (Express)**
   - Validates paths for security (blocking `../`).
   - Delegates work to `packages/job-engine` via `createCompareJob()`.
   - Never performs blocking synchronous AST parsing on the main event loop.

3. **Job Engine (Worker Threads)**
   - Spawns `compare-worker.js`.
   - Imports `packages/repository-engine` and `packages/verification-engine`.
   - Generates the deterministic `VerificationReceipt` and `VerificationManifest`.
   - Notifies the main thread of completion via IPC messages.

4. **Persistence & Audit Layer**
   - Main thread persists the receipt to an in-memory/MongoDB history array.
   - Main thread pushes the receipt hash to the `packages/verification-engine/audit.js` local blockchain.

5. **Client Presentation (Evidence Explorer)**
   - Client detects `COMPLETED` state.
   - Fetches receipt via `GET /api/jobs/:id/result`.
   - Navigates to `/evidence/:id` where matched/added/missing fragments are beautifully presented.
