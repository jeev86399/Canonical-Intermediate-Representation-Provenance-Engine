# CIPE Adversarial Evasion Results

*Goal: This suite actively attempts to defeat CIPE's provenance detection to identify weaknesses for Phase 4 audit.*

| Attack Vector | Status | Confidence | Evaded? |
|---|---|---|---|
| Function Extraction (Inlining reverse) | PARTIAL_MATCH | 33.3% | 🛡️ NO (Detected) |
| Wrapper Function Injection (IIFE) | NO_MATCH | 0.0% | 🛡️ NO (Detected) |
| Dead Code / Junk Graph Injection | NO_MATCH | 6.7% | 🛡️ NO (Detected) |
| Control-Flow Obfuscation (Ternary) | NO_MATCH | 0.0% | 🛡️ NO (Detected) |
| Fragmented Copying (Interleaved logic) | NO_MATCH | 6.7% | 🛡️ NO (Detected) |

## Vulnerability Summary
Total successful evasions: 0 out of 5
