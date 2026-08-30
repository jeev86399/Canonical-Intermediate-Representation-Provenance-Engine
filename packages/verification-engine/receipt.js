const crypto = require('crypto');
const { createVerificationManifest } = require('./evidence');

/**
 * Creates a verification receipt that strictly separates
 * deterministic content (evidenceDigest) from execution metadata.
 * 
 * @param {Object} verificationData 
 * @param {Object} executionMetadata 
 */
function createVerificationReceipt(verificationData, executionMetadata) {
  // 1. Generate the deterministic evidence
  const { manifest, evidenceDigest } = createVerificationManifest(verificationData);

  // 2. Generate a unique Verification ID
  // This incorporates a salt and timestamp to prevent replay attacks and ensure uniqueness
  const verificationIdHash = crypto.createHash('sha256');
  verificationIdHash.update(evidenceDigest);
  verificationIdHash.update(Date.now().toString());
  verificationIdHash.update(crypto.randomBytes(16));
  const verificationId = `vfy-${verificationIdHash.digest('hex').substring(0, 32)}`;

  // 3. Assemble the Receipt
  return {
    verificationId,
    generatedAt: new Date().toISOString(),
    result: verificationData.result, // e.g. MATCH, EXACT_MATCH, NO_MATCH, PARTIAL_MATCH
    
    // Deterministic Proof Material
    evidenceDigest,
    manifest, // The inner deterministic core
    
    // Non-deterministic execution details (Execution Metadata)
    executionMetadata: {
      jobId: executionMetadata.jobId || null,
      repositoryId: executionMetadata.repositoryId || null,
      workerId: executionMetadata.workerId || null,
      durationMs: executionMetadata.durationMs || 0,
      resourceUsage: executionMetadata.resourceUsage || {},
      failureReason: executionMetadata.failureReason || null
    }
  };
}

/**
 * Creates a repository verification receipt.
 */
function createRepositoryVerificationReceipt(verificationData, executionMetadata) {
  const { createRepositoryVerificationManifest } = require('./evidence');
  // 1. Generate the deterministic evidence
  const { manifest, evidenceDigest } = createRepositoryVerificationManifest(verificationData);

  // 2. Generate a unique Verification ID
  const verificationIdHash = crypto.createHash('sha256');
  verificationIdHash.update(evidenceDigest);
  verificationIdHash.update(Date.now().toString());
  verificationIdHash.update(crypto.randomBytes(16));
  const verificationId = `vfy-repo-${verificationIdHash.digest('hex').substring(0, 32)}`;

  // 3. Assemble the Receipt
  return {
    verificationId,
    generatedAt: new Date().toISOString(),
    result: verificationData.classification, // EXACT_MATCH, PARTIAL_PROVENANCE, DIFFERENT
    evidenceDigest,
    manifest,
    executionMetadata: {
      durationMs: executionMetadata.durationMs || 0,
      workerId: executionMetadata.workerId || null
    }
  };
}

module.exports = {
  createVerificationReceipt,
  createRepositoryVerificationReceipt
};
