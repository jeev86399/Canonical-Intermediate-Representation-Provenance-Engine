const crypto = require('crypto');
const versions = require('./versions');

/**
 * Deterministically serialize an object by recursively sorting its keys.
 */
function deterministicStringify(obj) {
  if (obj === null || typeof obj !== 'object') {
    return JSON.stringify(obj);
  }

  if (Array.isArray(obj)) {
    // Note: Arrays maintain their order. We do not sort array elements.
    return '[' + obj.map(item => deterministicStringify(item)).join(',') + ']';
  }

  const sortedKeys = Object.keys(obj).sort();
  let result = '{';
  for (let i = 0; i < sortedKeys.length; i++) {
    const key = sortedKeys[i];
    const value = obj[key];
    if (value === undefined) continue; // Skip undefined
    result += JSON.stringify(key) + ':' + deterministicStringify(value);
    if (i < sortedKeys.length - 1) {
      result += ',';
    }
  }
  result += '}';
  return result;
}

/**
 * Create a VerificationManifest which binds cryptographically to the inputs.
 * The digest of this manifest serves as the 'evidenceDigest'.
 * 
 * @param {Object} data The input provenance comparison results
 * @param {string} data.sourceDigest Hash of the source input
 * @param {string} data.targetDigest Hash of the target input
 * @param {Object} data.matchData Details of matched, missing, and added fragments
 */
function createVerificationManifest(data) {
  if (!data.sourceDigest || !data.targetDigest || !data.matchData) {
    throw new Error('Missing required fields for VerificationManifest');
  }

  const manifest = {
    engineVersion: versions.CIPE_ENGINE_VERSION,
    canonicalizationVersion: versions.CANONICAL_IR_VERSION,
    fingerprintVersion: versions.FINGERPRINT_VERSION,
    fragmentSchemaVersion: versions.FRAGMENT_SCHEMA_VERSION,
    verificationAlgorithm: versions.VERIFICATION_PROTOCOL,
    normalizationProfile: 'strict', // Can be parameterized if needed
    sourceDigest: data.sourceDigest,
    targetDigest: data.targetDigest,
    matchData: {
      matchedFragments: [...data.matchData.matchedFragments].sort(),
      missingFragments: [...data.matchData.missingFragments].sort(),
      addedFragments: [...data.matchData.addedFragments].sort(),
      controlFlowRelationships: data.matchData.controlFlowRelationships || [],
      dataFlowRelationships: data.matchData.dataFlowRelationships || []
    }
  };

  const serialized = deterministicStringify(manifest);
  const hash = crypto.createHash('sha256');
  hash.update(serialized);
  
  return {
    manifest,
    evidenceDigest: hash.digest('hex'),
    rawSerialization: serialized
  };
}

/**
 * Create a Repository Verification Manifest which binds cryptographically to a multi-file graph.
 */
function createRepositoryVerificationManifest(data) {
  if (!data.classification || !data.matchData) {
    throw new Error('Missing required fields for RepositoryVerificationManifest');
  }

  const manifest = {
    engineVersion: versions.CIPE_ENGINE_VERSION,
    canonicalizationVersion: versions.CANONICAL_IR_VERSION,
    fingerprintVersion: versions.FINGERPRINT_VERSION,
    fragmentSchemaVersion: versions.FRAGMENT_SCHEMA_VERSION,
    verificationAlgorithm: versions.VERIFICATION_PROTOCOL,
    classification: data.classification,
    matchData: {
      matchedFiles: [...(data.matchData.matchedFiles || [])].sort(),
      matchedFragments: [...data.matchData.matchedFragments].sort(),
      missingFragments: [...data.matchData.missingFragments].sort(),
      addedFragments: [...data.matchData.addedFragments].sort(),
      changedDependencies: data.matchData.changedDependencies || 0,
      unsupportedFeatures: [...(data.matchData.unsupportedFeatures || [])].sort()
    }
  };

  const serialized = deterministicStringify(manifest);
  const hash = crypto.createHash('sha256');
  hash.update(serialized);
  
  return {
    manifest,
    evidenceDigest: hash.digest('hex'),
    rawSerialization: serialized
  };
}

module.exports = {
  deterministicStringify,
  createVerificationManifest,
  createRepositoryVerificationManifest
};
