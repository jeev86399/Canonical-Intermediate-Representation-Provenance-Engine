const { parseSource } = require('../parser');
const { analyzeScope } = require('../scope-engine');
const { generateCanonicalIR } = require('../canonical-ir');
const { generateCFG } = require('../cfg-engine');
const { analyzeDataflow } = require('../dataflow-engine');
const { runWLCDH } = require('../../tests/phase9/engine');

/**
 * Analyzes JS source code and returns its CIPE fingerprint and multiset fragments.
 * @param {string} sourceCode 
 * @returns {object} { fingerprint, fragments }
 */
function analyzeSource(sourceCode) {
  if (!sourceCode || sourceCode.trim() === '') {
    return { fingerprint: null, fragments: [] };
  }
  try {
    const parsed = parseSource(sourceCode);
    const scopedAst = analyzeScope(parsed.ast).ast;
    const ir = generateCanonicalIR(scopedAst);
    const cfg = generateCFG(ir);
    const dataflow = analyzeDataflow(cfg);
    
    // Pass the dataflow CFG to Phase 9 WLCDH
    const result = runWLCDH(dataflow, 2); // K=2 iterations
    return {
      fingerprint: result.globalHash,
      fragments: result.rawHashes // Was blockHashes previously, changed to rawHashes
    };
  } catch (e) {
    // Parser failure or similar
    return { fingerprint: null, fragments: [], error: e.message };
  }
}

/**
 * Compares two sets of fragments and returns the provenance delta.
 * @param {string[]} oldFragments 
 * @param {string[]} newFragments 
 * @returns {object} { matched, added, removed }
 */
function compareFragments(oldFragments, newFragments) {
  const oldSet = new Set(oldFragments);
  const newSet = new Set(newFragments);
  
  const matched = [];
  const added = [];
  const removed = [];
  
  for (const f of newFragments) {
    if (oldSet.has(f)) matched.push(f);
    else added.push(f);
  }
  
  for (const f of oldFragments) {
    if (!newSet.has(f)) removed.push(f);
  }
  
  return { matched, added, removed };
}

/**
 * Determines the verification result classification.
 * EXACT_MATCH: All fragments match, none added/removed
 * STRUCTURAL_MATCH: Global fingerprints match
 * PARTIAL_MATCH: Some fragments match (>0)
 * NO_MATCH: No fragments match
 * INVALID_SOURCE: Source could not be parsed
 */
function determineVerificationResult(oldAnalysis, newAnalysis, comparison) {
  if (!oldAnalysis.fingerprint || !newAnalysis.fingerprint) {
    return "INVALID_SOURCE";
  }
  if (oldAnalysis.fingerprint === newAnalysis.fingerprint) {
    return "EXACT_MATCH";
  }
  if (comparison.matched.length > 0 && comparison.added.length === 0 && comparison.removed.length === 0) {
    return "STRUCTURAL_MATCH";
  }
  if (comparison.matched.length > 0) {
    return "PARTIAL_MATCH";
  }
  return "NO_MATCH";
}

/**
 * Perform a full provenance analysis between a before and after state of a file.
 * @param {string} oldSource 
 * @param {string} newSource 
 * @returns {object} Strict Provenance Evidence Format JSON
 */
function compareSources(oldSource, newSource) {
  const oldAnalysis = analyzeSource(oldSource);
  const newAnalysis = analyzeSource(newSource);
  
  const comparison = compareFragments(oldAnalysis.fragments, newAnalysis.fragments);
  
  // Strict Evidence JSON Format
  return {
    canonicalVersion: "CIPE-9-WLCDH",
    oldFingerprint: oldAnalysis.fingerprint,
    newFingerprint: newAnalysis.fingerprint,
    fragmentCount: newAnalysis.fragments.length,
    matchedFragments: comparison.matched,
    addedFragments: comparison.added,
    removedFragments: comparison.removed,
    // Using simple metrics for dependency/control flow changes based on fragment sets
    dependencyChanges: comparison.added.length + comparison.removed.length,
    controlFlowChanges: comparison.added.length + comparison.removed.length,
    verificationResult: determineVerificationResult(oldAnalysis, newAnalysis, comparison)
  };
}

module.exports = {
  analyzeSource,
  compareFragments,
  compareSources
};
