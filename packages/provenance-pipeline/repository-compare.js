const { analyzeSource, compareFragments } = require('./index');

/**
 * Compares two multi-file snapshots.
 * A snapshot is a Map<filePath, sourceContent>.
 * 
 * Returns an aggregated repository-level provenance result.
 */
function compareRepositories(baseSnapshot, targetSnapshot) {
  const baseAnalyses = new Map();
  const targetAnalyses = new Map();

  // 1. Analyze Base
  for (const [filePath, content] of baseSnapshot.entries()) {
    baseAnalyses.set(filePath, analyzeSource(content));
  }

  // 2. Analyze Target
  for (const [filePath, content] of targetSnapshot.entries()) {
    targetAnalyses.set(filePath, analyzeSource(content));
  }

  // 3. Aggregate all fragments
  const allBaseFragments = new Set();
  const allTargetFragments = new Set();

  for (const analysis of baseAnalyses.values()) {
    if (!analysis.error) {
      analysis.fragments.forEach(f => allBaseFragments.add(f));
    }
  }

  for (const analysis of targetAnalyses.values()) {
    if (!analysis.error) {
      analysis.fragments.forEach(f => allTargetFragments.add(f));
    }
  }

  // 4. Compare across entire repository
  const comparison = compareFragments(Array.from(allBaseFragments), Array.from(allTargetFragments));

  // Determine classification
  let classification = 'INCONCLUSIVE';
  
  if (comparison.matched.length === 0) {
    classification = 'DIFFERENT';
  } else if (comparison.added.length === 0 && comparison.removed.length === 0) {
    classification = 'EXACT_MATCH';
  } else {
    classification = 'PARTIAL_PROVENANCE';
  }

  if (baseSnapshot.size === 0 && targetSnapshot.size === 0) {
    classification = 'INCONCLUSIVE'; // Empty repo
  }

  return {
    classification,
    matchedFiles: Array.from(targetSnapshot.keys()), // Overly simplified for now, we should track which files contain matched fragments
    matchedFragments: comparison.matched,
    missingFragments: comparison.removed,
    addedFragments: comparison.added,
    changedDependencies: comparison.added.length + comparison.removed.length, // Placeholder for Phase 15D
    unsupportedFeatures: [] 
  };
}

module.exports = {
  compareRepositories
};
