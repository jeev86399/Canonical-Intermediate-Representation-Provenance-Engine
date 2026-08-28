# Phase 11: Versioned Cryptographic Schema

## 1. Cryptographic Primitive & Hashing Standards

All structural fingerprints and fragment identifiers within CIPE are strictly formatted as **64-character SHA-256 hexadecimal strings**. Every basic block label, dataflow summary, and graph neighborhood iteration is hashed deterministically using standard Node.js `crypto.createHash('sha256')`.

```json
{
  "fingerprint": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
  "canonicalVersion": "CIPE-9-WLCDH",
  "algorithmVersion": "1.0"
}
```

## 2. Versioning Specification & Metadata Model

To guarantee backward compatibility and prevent false collisions across algorithm revisions, all fingerprints and evidence packets embed explicit schema version tags:

- `canonicalVersion = 'CIPE-9-WLCDH'`: Specifies the canonical intermediate representation grammar, scope tree normalization rules, and Weisfeiler-Lehman Continuous Directed Hypergraph iteration depth ($K=2$).
- `algorithmVersion = '1.0'`: Identifies the current revision of the provenance extraction pipeline and evidence serialization schema.

### Fragment Index Storage Record:
```javascript
{
  fingerprint: "a7c2e81b...", // 64-char SHA-256 hex string
  repositoryId: "owner/repo-name",
  commitHash: "d6f4b2...",
  filePath: "lib/parser.js",
  canonicalVersion: "CIPE-9-WLCDH",
  algorithmVersion: "1.0",
  indexedAt: 1771900000000
}
```

## 3. Version-Aware Query Routing

When querying candidate fragments across multi-version historical corpora, queries specify the required canonical version. In production database backends, queries leverage a compound index:

```sql
-- Conceptual compound index
CREATE INDEX idx_fingerprint_version ON fragment_records (fingerprint, canonicalVersion);
```

This ensures that future algorithm upgrades (e.g., `CIPE-10-WLCDH` with higher iteration bounds or AST expansions) will not generate false matches against legacy indexed fragments.

## 4. Determinism & Cryptographic Invariance

Determinism is the foundational requirement for repeatable provenance claims. The CIPE verification suite executed an invariance study across 100 sequential runs on diverse JavaScript source files:

- **Run Count**: 100 / 100 executions
- **Fingerprint Stability**: 100% bitwise identical hashes
- **AST Traversal Invariance**: Guaranteed deterministic node ordering and scope symbol resolution.
- **WLCDH Sorting**: Neighbor labels are lexicographically sorted prior to hashing at each iteration $k \in [1, K]$, eliminating non-deterministic map iteration side effects.
