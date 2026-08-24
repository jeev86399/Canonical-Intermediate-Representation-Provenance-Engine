/**
 * Verifies the provenance of a suspect source file against an original target source file
 * by performing a structural set intersection on their cryptographically generated fragment hashes.
 * 
 * @param {Object} targetData - The original source's fingerprint data.
 * @param {Object} suspectData - The suspect source's fingerprint data.
 * @returns {Object} A detailed verification report.
 */
function verifyProvenance(targetData, suspectData) {
  if (!targetData || !suspectData) {
    throw new Error('Both target and suspect fingerprint data must be provided.');
  }

  // Strict Versioning Check (Phase 3A)
  if (targetData.hashVersion !== suspectData.hashVersion) {
    throw new Error(`Hash version mismatch: Target(${targetData.hashVersion}) vs Suspect(${suspectData.hashVersion})`);
  }

  const targetHashes = new Set(targetData.rawHashes);
  const suspectHashes = new Set(suspectData.rawHashes);

  const matched = [];
  const added = [];
  const missing = [];

  // Find Matched and Added in Suspect
  for (const suspectFrag of suspectData.fragments) {
    if (targetHashes.has(suspectFrag.hash)) {
      matched.push({ hash: suspectFrag.hash, type: suspectFrag.content.type, content: suspectFrag.content });
    } else {
      added.push({ hash: suspectFrag.hash, type: suspectFrag.content.type, content: suspectFrag.content });
    }
  }

  // Find Missing from Target
  for (const targetFrag of targetData.fragments) {
    if (!suspectHashes.has(targetFrag.hash)) {
      missing.push({ hash: targetFrag.hash, type: targetFrag.content.type, content: targetFrag.content });
    }
  }

  const intersectionSize = matched.length;
  const minFragments = Math.min(targetData.rawHashes.length, suspectData.rawHashes.length);
  
  let confidence = 0;
  if (minFragments > 0) {
    confidence = intersectionSize / minFragments;
  }

  let status = 'NO_MATCH';
  if (intersectionSize === targetData.rawHashes.length && intersectionSize === suspectData.rawHashes.length) {
    status = 'EXACT_MATCH';
  } else if (confidence > 0.1 || intersectionSize > 5) {
    status = 'PARTIAL_MATCH';
  }

  return {
    status,
    confidence,
    matchedFragments: intersectionSize,
    totalFragments: minFragments,
    evidence: {
      matched,
      added,
      missing
    }
  };
}

module.exports = {
  verifyProvenance
};
