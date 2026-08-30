# Patent Technical Evidence

## Purpose
This document strictly captures experimentally demonstrated technical mechanisms of the multi-file Verification Engine. It does NOT assert guaranteed patentability, but rather records engineering observations for subsequent legal review.

## 1. Global Fragment Aggregation Mechanism
- **Technical Problem:** File paths, hierarchy, and physical file distributions are often the first element modified during plagiarism or codebase forks. Traditional checksums (e.g. SHA-1 of a directory tree) immediately fail.
- **CIPE Mechanism:** The system entirely ignores physical files during the mathematical set comparison. It aggregates all hashed CFG/Dataflow fragments into a flat, order-independent `Set` structure.
- **Experimental Evidence:** `adversarial.test.js` successfully demonstrated that entirely refactoring a project's directory structure while maintaining the identical logic inside the AST produces an exact match.
- **Prior-Art Overlap Risk:** Graph isomorphism and structural fragment hashing are known in academic static analysis. The patentable delta potentially relies on the *cryptographic verification receipt* strictly isolating this content identity.

## 2. Decoupling of Event vs Content Identity
- **Technical Problem:** Proof of provenance requires guaranteeing the code match, but storing this proof requires temporal metadata (when was it run, on what worker node?). Intermingling these destroys mathematical reproducibility.
- **CIPE Mechanism:** `VerificationManifest` contains ONLY the code structures. `VerificationReceipt` wraps the manifest digest with a salted, timestamped ID.
- **Experimental Evidence:** `reproducibility.test.js` proved that separate verification requests on the same source produce mathematically identical `evidenceDigest` cores, while successfully outputting distinct temporal IDs for the audit log.
- **Known Limitations:** Cryptographic fingerprinting proves representation relationships, not authorship. We prove "these mathematical fragments overlap", but we do NOT prove "Entity A stole this from Entity B".
