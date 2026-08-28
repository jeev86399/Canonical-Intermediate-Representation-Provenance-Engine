const { classifyVerification } = require('./verification-model');
const { buildEvidenceGraph } = require('./evidence-graph');
const { traceLineage, classifyTransition } = require('./lineage-tracker');
const { CommonFragmentSuppressor } = require('./common-suppression');

/**
 * Main Provenance Engine API (Phase 12)
 */

/**
 * Verifies the provenance of a suspect source file against an original target source file.
 * Returns a formal classification and a complete evidence graph.
 * 
 * @param {Object} targetData - The original source's metadata (repositoryId, commitHash, filePath, fragments)
 * @param {Object} suspectData - The suspect source's metadata (repositoryId, commitHash, filePath, fragments)
 * @param {Set<String>} commonFingerprints - Optional set of fingerprints known to be common boilerplate
 * @returns {Object} A detailed verification report and evidence graph
 */
function verifyProvenance(targetData, suspectData, commonFingerprints = new Set()) {
  if (!targetData || !suspectData) {
    throw new Error('Both target and suspect data must be provided.');
  }

  // Strict Versioning Check
  if (targetData.hashVersion && suspectData.hashVersion && targetData.hashVersion !== suspectData.hashVersion) {
    throw new Error(`Hash version mismatch: Target(${targetData.hashVersion}) vs Suspect(${suspectData.hashVersion})`);
  }

  const targetFragments = targetData.fragments || [];
  const suspectFragments = suspectData.fragments || [];

  // Classify
  const classification = classifyVerification(targetFragments, suspectFragments, commonFingerprints);

  // Extract matched fragments for the graph
  const targetHashes = new Set(targetFragments.map(f => f.hash));
  const matchedRare = [];
  const matchedCommon = [];
  
  for (const s of suspectFragments) {
    if (targetHashes.has(s.hash)) {
      if (commonFingerprints.has(s.hash)) matchedCommon.push(s.hash);
      else matchedRare.push(s.hash);
    }
  }

  // Build Graph
  const evidenceGraph = buildEvidenceGraph(targetData, suspectData, classification, matchedRare, matchedCommon);

  return {
    status: classification.status,
    reasoning: classification.reasoning,
    matchedFragments: matchedRare.length + matchedCommon.length,
    rareMatched: matchedRare.length,
    commonMatched: matchedCommon.length,
    totalTargetFragments: targetFragments.length,
    totalSuspectFragments: suspectFragments.length,
    evidenceGraph
  };
}

module.exports = {
  verifyProvenance,
  classifyVerification,
  buildEvidenceGraph,
  traceLineage,
  classifyTransition,
  CommonFragmentSuppressor
};
