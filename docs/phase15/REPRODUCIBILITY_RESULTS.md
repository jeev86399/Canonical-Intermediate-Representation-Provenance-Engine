# Reproducibility Experiment Results

## Methodology
To prove that our verification receipt strictly binds to the mathematical code structure and not the ephemeral compute event, we executed identical repository verification passes under mutated execution states.

## Test Conditions
- **Run A**: `workerId=1`, `duration=15ms`, fragments inserted as `[f2, f1]`
- **Run B**: `workerId=2`, `duration=12ms`, fragments inserted as `[f1, f2]`

## Results
- **Content Identity (evidenceDigest)**: SHA256 matched exactly across runs. The `evidenceDigest` strictly isolates the code semantics due to deterministic JSON key sorting and array canonicalization.
- **Event Identity (verificationId)**: Correctly mutated across runs. The receipt's salted ID ensures temporal uniqueness for the audit log, preventing replay attacks while preserving the cryptographic proof of the code itself.

## Conclusion
The system successfully guarantees algorithmic determinism across diverse temporal execution environments.
