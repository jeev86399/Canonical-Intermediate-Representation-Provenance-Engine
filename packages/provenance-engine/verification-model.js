/**
 * Formal Verification Model (Phase 12)
 *
 * Defines deterministic criteria for provenance verification classifications:
 * EXACT_MATCH, STRUCTURAL_MATCH, PARTIAL_MATCH, EVOLVED_MATCH, NO_MATCH, UNSUPPORTED, INSUFFICIENT_EVIDENCE
 */

/**
 * Evaluates the relationship between two fragment sets and returns a strict classification.
 * Thresholds are avoided where possible, relying instead on containment and exact topological matches.
 *
 * @param {Array<Object>} targetFragments - The original source fragments
 * @param {Array<Object>} suspectFragments - The suspect source fragments
 * @param {Set<String>} commonFingerprints - Set of fingerprints known to be common boilerplate (for suppression)
 * @returns {Object} classification result with reasoning
 */
function classifyVerification(targetFragments, suspectFragments, commonFingerprints = new Set()) {
  if (!targetFragments || !suspectFragments) {
    return { status: 'UNSUPPORTED', reasoning: 'Missing fragment data' };
  }
  
  if (targetFragments.length === 0 || suspectFragments.length === 0) {
    return { status: 'INSUFFICIENT_EVIDENCE', reasoning: 'Not enough fragments to compare' };
  }

  const targetHashes = new Set(targetFragments.map(f => f.hash));
  const suspectHashes = new Set(suspectFragments.map(f => f.hash));

  const matchedRare = [];
  const matchedCommon = [];
  
  let targetRareCount = 0;
  for (const t of targetFragments) {
    if (!commonFingerprints.has(t.hash)) targetRareCount++;
  }
  let suspectRareCount = 0;
  for (const s of suspectFragments) {
    if (!commonFingerprints.has(s.hash)) suspectRareCount++;
    if (targetHashes.has(s.hash)) {
      if (commonFingerprints.has(s.hash)) matchedCommon.push(s.hash);
      else matchedRare.push(s.hash);
    }
  }

  const totalMatches = matchedRare.length + matchedCommon.length;

  // 1. Exact Match
  if (targetFragments.length === suspectFragments.length && totalMatches === targetFragments.length) {
    return { status: 'EXACT_MATCH', reasoning: 'All fragments match exactly.' };
  }

  // 2. Structural Match (e.g. wrapper inserted but all original rare fragments preserved in exact structure)
  if (targetRareCount > 0 && matchedRare.length === targetRareCount && suspectFragments.length > targetFragments.length) {
    return { status: 'STRUCTURAL_MATCH', reasoning: 'Suspect completely envelops target\'s rare logical structure.' };
  }

  // 3. Evolved Match (High rare fragment overlap, but modified)
  if (targetRareCount > 0 && matchedRare.length >= Math.ceil(targetRareCount * 0.5)) {
    return { status: 'EVOLVED_MATCH', reasoning: 'Substantial overlap of rare fragments indicating modification.' };
  }
  if (suspectRareCount > 0 && matchedRare.length >= Math.ceil(suspectRareCount * 0.5)) {
    return { status: 'EVOLVED_MATCH', reasoning: 'Substantial overlap of rare fragments indicating modification.' };
  }

  // 4. Partial Match
  if (matchedRare.length >= 3) {
    return { status: 'PARTIAL_MATCH', reasoning: 'Subset of rare logic fragments shared (>=3).' };
  }

  // 5. Check if it's only common boilerplate
  if (totalMatches > 0 && matchedRare.length === 0) {
    return { status: 'INSUFFICIENT_EVIDENCE', reasoning: 'Matches consist entirely of common boilerplate fragments.' };
  }
  
  if (totalMatches > 0 && matchedRare.length < 3) {
    return { status: 'INSUFFICIENT_EVIDENCE', reasoning: 'Matches too small to definitively prove provenance (<3 rare fragments).' };
  }

  // 6. No Match
  return { status: 'NO_MATCH', reasoning: 'No meaningful intersection found.' };
}

module.exports = {
  classifyVerification
};
