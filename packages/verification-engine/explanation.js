/**
 * Decision Explanation Engine
 * Consumes raw verification evidence and produces a deterministic human-readable explanation.
 */

function generateExplanation(receipt) {
  if (!receipt || !receipt.manifest || !receipt.manifest.matchData) {
    throw new Error('Invalid verification receipt provided for explanation.');
  }

  const { matchData } = receipt.manifest;
  
  const matchedCount = matchData.matchedFragments.length;
  const missingCount = matchData.missingFragments.length;
  const addedCount = matchData.addedFragments.length;
  const cfCount = matchData.controlFlowRelationships ? matchData.controlFlowRelationships.length : 0;
  const dfCount = matchData.dataFlowRelationships ? matchData.dataFlowRelationships.length : 0;

  const lines = [];
  lines.push(`RESULT: ${receipt.result}`);
  lines.push('EVIDENCE:');
  
  if (matchedCount > 0) {
    lines.push(`- ${matchedCount} structural fragments matched`);
  }
  if (cfCount > 0) {
    lines.push(`- ${cfCount} control-flow edges matched`);
  }
  if (dfCount > 0) {
    lines.push(`- ${dfCount} data-flow bindings matched`);
  }
  if (missingCount > 0) {
    lines.push(`- ${missingCount} expected fragments missing`);
  }
  if (addedCount > 0) {
    lines.push(`- ${addedCount} unrelated fragments added in target`);
  }

  // If literally nothing was matched or logged
  if (lines.length === 2) {
    lines.push('- 0 fragments matched');
  }

  return lines.join('\n');
}

/**
 * Generates an explanation for a RepositoryVerificationReceipt.
 */
function generateRepositoryExplanation(receipt) {
  if (!receipt || !receipt.manifest || !receipt.manifest.matchData) {
    throw new Error('Invalid repository verification receipt provided for explanation.');
  }

  const { matchData } = receipt.manifest;
  
  const matchedFilesCount = matchData.matchedFiles ? matchData.matchedFiles.length : 0;
  const matchedCount = matchData.matchedFragments.length;
  const missingCount = matchData.missingFragments.length;
  const addedCount = matchData.addedFragments.length;

  const lines = [];
  lines.push(`CLASSIFICATION: ${receipt.result}`);
  lines.push('EVIDENCE:');
  
  if (matchedFilesCount > 0) {
    lines.push(`- ${matchedFilesCount} files contained matching provenance`);
  }
  if (matchedCount > 0) {
    lines.push(`- ${matchedCount} structural fragments matched`);
  }
  if (missingCount > 0) {
    lines.push(`- ${missingCount} expected fragments missing`);
  }
  if (addedCount > 0) {
    lines.push(`- ${addedCount} unrelated fragments added in target`);
  }

  if (lines.length === 2) {
    lines.push('- 0 fragments matched');
  }

  return lines.join('\n');
}

module.exports = {
  generateExplanation,
  generateRepositoryExplanation
};
