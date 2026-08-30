# Phase 16 Error Model

The API explicitly translates internal exceptions into a public Error Taxonomy to avoid leaking stack traces or unhandled exceptions.

## Taxonomy

1. **`INVALID_INPUT`** (HTTP 400/404)
   - Triggered by missing payloads, invalid UUIDs, or unparseable JSON.
2. **`PATH_SECURITY_VIOLATION`** (HTTP 403)
   - Triggered by detecting path traversal inputs (`../`) attempting to breach the base directory bound.
3. **`ANALYSIS_ERROR`** (HTTP 422)
   - Triggered by syntax errors inside the analyzed source code (AST parsing failures).
4. **`VERIFICATION_ERROR`** (HTTP 400)
   - Triggered by illegal state transitions, such as requesting verification results for a job that is still queued or crashed.
5. **`INTERNAL_ERROR`** (HTTP 500)
   - Used for unexpected environment issues like lack of disk space for the audit log.

All errors return JSON in the format:
```json
{
  "error": "TAXONOMY_KEY",
  "details": "Safe string explanation"
}
```
