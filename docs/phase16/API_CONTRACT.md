# Phase 16 API Contract

## Overview
The CIPE API provides asynchronous multi-file repository verification endpoints, strict input bound checking, and explicit job resource governance.

## Endpoints

### 1. `POST /api/analyze`
**Purpose:** Sync analysis of a single code snippet.
**Input:** `{ source: "string" }`
**Output:** `{ status: 'COMPLETED', result: { fileCount, fragmentCount, fragments } }`

### 2. `POST /api/compare-repositories`
**Purpose:** Async queueing of full multi-file exact/partial verification.
**Input:** `{ baseRepoPath: "/absolute/path", targetRepoPath: "/absolute/path" }`
**Output:** `{ jobId: "uuid", status: "QUEUED" }`
**Bounds:** Rejects input containing `..` path traversal sequences.

### 3. `GET /api/jobs/:id/progress`
**Purpose:** Polling endpoint for job completion percentage.
**Output:** `{ progress: Number, status: "RUNNING"|"COMPLETED"|"FAILED" }`

### 4. `GET /api/jobs/:id/result`
**Purpose:** Fetches the completed `VerificationManifest` and `VerificationReceipt`. On first access, commits the receipt to the immutable Audit Log.

### 5. `GET /api/verification/history`
**Purpose:** Retrieve array of all previously audited receipts.

### 6. `GET /api/verification/:id/receipt`
**Purpose:** Fetch deterministic execution receipt and `evidenceDigest`.

### 7. `GET /api/verification/audit`
**Purpose:** Validate cryptographic integrity of the historical receipt log.
