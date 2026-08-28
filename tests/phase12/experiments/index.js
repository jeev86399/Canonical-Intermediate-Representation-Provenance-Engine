const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { generateCorpus } = require('../generator');
const { parseSource } = require('../../../packages/parser');
const { generateFingerprints } = require('../../../packages/provenance-pipeline');
const { verifyProvenance } = require('../../../packages/provenance-engine');

// Baselines
function hashSHA256(code) {
  return crypto.createHash('sha256').update(code).digest('hex');
}

function normalizedTokens(code) {
  // Ultra-naive baseline: strip all whitespace and non-alphanumeric
  return code.replace(/[^a-zA-Z0-9]/g, '');
}

function countASTNodes(code) {
  try {
    const ast = parseSource(code, 'file.js');
    let count = 0;
    // Simple tree walker for counting nodes
    const walk = (node) => {
      if (!node) return;
      count++;
      for (const key in node) {
        if (node[key] && typeof node[key] === 'object') {
          if (Array.isArray(node[key])) {
            node[key].forEach(walk);
          } else if (node[key].type) {
            walk(node[key]);
          }
        }
      }
    };
    walk(ast);
    return count;
  } catch (e) {
    return -1;
  }
}

async function runExperiments(fastMode = false) {
  console.log("Starting Phase 12 Experiments...");
  
  const corpusSize = fastMode ? 100 : 1000;
  const outDir = path.join(__dirname, '../corpus');
  const pairs = generateCorpus(corpusSize, outDir);

  let truePositives = 0;
  let trueNegatives = 0;
  let falsePositives = 0;
  let falseNegatives = 0;

  const baselineResults = {
    sha256: { matches: 0 },
    tokens: { matches: 0 },
    astCount: { matches: 0 }
  };

  const cipeResults = [];

  for (const pair of pairs) {
    // 1. Baselines
    const sha1 = hashSHA256(pair.sourceVariant);
    const sha2 = hashSHA256(pair.targetVariant);
    if (sha1 === sha2) baselineResults.sha256.matches++;

    const tok1 = normalizedTokens(pair.sourceVariant);
    const tok2 = normalizedTokens(pair.targetVariant);
    if (tok1 === tok2) baselineResults.tokens.matches++;

    const ast1 = countASTNodes(pair.sourceVariant);
    const ast2 = countASTNodes(pair.targetVariant);
    if (ast1 !== -1 && ast1 === ast2) baselineResults.astCount.matches++;

    // 2. CIPE Pipeline
    try {
      const sourceData = generateFingerprints(pair.sourceVariant, 'source.js');
      const targetData = generateFingerprints(pair.targetVariant, 'target.js');

      const targetMeta = { repositoryId: 'R1', commitHash: 'C1', filePath: 'source.js', fragments: sourceData.fragments };
      const suspectMeta = { repositoryId: 'R2', commitHash: 'C2', filePath: 'target.js', fragments: targetData.fragments };

      const result = verifyProvenance(targetMeta, suspectMeta);

      const actualMatch = (result.status !== 'NO_MATCH' && result.status !== 'UNSUPPORTED' && result.status !== 'INSUFFICIENT_EVIDENCE');
      const expectedMatch = (pair.expectedRelationship !== 'NO_MATCH');

      if (expectedMatch && actualMatch) truePositives++;
      else if (!expectedMatch && !actualMatch) trueNegatives++;
      else if (!expectedMatch && actualMatch) falsePositives++;
      else if (expectedMatch && !actualMatch) falseNegatives++;

      cipeResults.push({
        pairId: pair.id,
        transform: pair.transformationChain[0],
        expected: pair.expectedRelationship,
        actual: result.status,
        reasoning: result.reasoning
      });

    } catch (err) {
      console.error(`Error processing pair ${pair.id}:`, err.message);
      if (pair.expectedRelationship !== 'NO_MATCH') falseNegatives++;
      else trueNegatives++;
    }
  }

  const precision = truePositives / (truePositives + falsePositives || 1);
  const recall = truePositives / (truePositives + falseNegatives || 1);
  const f1 = 2 * (precision * recall) / (precision + recall || 1);

  const report = {
    totalPairs: pairs.length,
    CIPE_Metrics: {
      TRUE_POSITIVES: truePositives,
      TRUE_NEGATIVES: trueNegatives,
      FALSE_POSITIVES: falsePositives,
      FALSE_NEGATIVES: falseNegatives,
      PRECISION: precision.toFixed(4),
      RECALL: recall.toFixed(4),
      F1: f1.toFixed(4)
    },
    Baseline_Matches: {
      SHA256: baselineResults.sha256.matches,
      Tokens: baselineResults.tokens.matches,
      AST_Nodes: baselineResults.astCount.matches
    }
  };

  fs.writeFileSync(path.join(outDir, 'results.json'), JSON.stringify(report, null, 2));
  fs.writeFileSync(path.join(outDir, 'details.csv'), 'pairId,transform,expected,actual,reasoning\n' + cipeResults.map(r => `${r.pairId},${r.transform},${r.expected},${r.actual},"${r.reasoning}"`).join('\n'));

  console.log("Experiments complete. Results saved to corpus/results.json");
  return report;
}

if (require.main === module) {
  const fastMode = process.argv.includes('--fast');
  runExperiments(fastMode);
}

module.exports = { runExperiments };
