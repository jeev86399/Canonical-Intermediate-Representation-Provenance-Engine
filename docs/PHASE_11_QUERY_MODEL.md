# Phase 11: Provenance Query Model

## 1. Overview

The CIPE Provenance Query Model establishes a multi-tiered query and verification workflow. To efficiently determine structural code provenance across repositories, the engine splits candidate retrieval ($O(1)$ index lookup) from structural verification ($O(V+E)$ WLCDH graph comparison).

```
   Source Code ──> analyzeSource() ──> [ Fingerprint + Fragments ]
                                                │
                 ┌──────────────────────────────┴──────────────────────────────┐
                 ▼                                                             ▼
       POST /api/provenance/index                                  POST /api/provenance/query
       [ Index fragment metadata ]                                 [ Retrieve candidate matches ]
                                                                               │
                                                                               ▼
                                                                  POST /api/provenance/verify
                                                                  [ Run full pairwise WLCDH ]
```

## 2. API Endpoints

The HTTP/REST interface exposes four core endpoints:

### `POST /api/provenance/index`
Registers structural fragments extracted from an analyzed source file.
- **Request Body**:
  ```json
  {
    "fragments": ["a1b2c3...64hex", "d4e5f6...64hex"],
    "metadata": {
      "repositoryId": "repo-alpha",
      "commitHash": "9f8e7d6c5b4a3210...",
      "filePath": "src/core/auth.js",
      "canonicalVersion": "CIPE-9-WLCDH",
      "algorithmVersion": "1.0"
    }
  }
  ```
- **Response**: `{ "status": "indexed", "count": 2 }` (Status `200 OK`)

### `POST /api/provenance/query`
Performs candidate retrieval by matching query fragments against the indexed corpus.
- **Request Body**:
  ```json
  {
    "fragments": ["a1b2c3...64hex", "e7f8a9...64hex"]
  }
  ```
- **Response**:
  ```json
  {
    "candidates": [
      {
        "repositoryId": "repo-alpha",
        "commitHash": "9f8e7d6c5b4a3210...",
        "filePath": "src/core/auth.js",
        "matchedFragments": 1,
        "totalFragments": 2,
        "containmentScore": 0.5
      }
    ]
  }
  ```

### `POST /api/provenance/verify`
Executes deep pairwise graph comparison (`compareSources`) between two source units.
- **Request Body**: `{ "sourceA": "...", "sourceB": "..." }`
- **Response**: Provenance evidence packet containing matched, added, removed fragments, similarity score, and cryptographic signature.

### `GET /api/provenance/stats`
Retrieves runtime operational metrics from the index engine.
- **Response**: `{ "totalFragments": 105420, "totalRecords": 241090, "heapUsedMB": 184.2 }`

## 3. Batch Query Mechanism

High-throughput querying utilizes `queryBatch(fingerprints[])`. Instead of issuing isolated point queries, the batch engine iterates over the query fragment set in a single pass, aggregating occurrences by repository and file path:

$$\text{Containment Score}(Q, C) = \frac{|\text{Fragments}(Q) \cap \text{Fragments}(C)|}{\min(|\text{Fragments}(Q)|, |\text{Fragments}(C)|)}$$

Candidate files exceeding a specified containment threshold are forwarded to the WLCDH verification stage.
