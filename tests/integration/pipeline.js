const { parseSource } = require('../../packages/parser');
const { analyzeScope } = require('../../packages/scope-engine');
const { generateCanonicalIR } = require('../../packages/canonical-ir');
const { generateCFG } = require('../../packages/cfg-engine');
const { analyzeDataflow } = require('../../packages/dataflow-engine');
const { extractFragments } = require('../../packages/fragment-engine');
const { generateFingerprint } = require('../../packages/fingerprint-engine');
const { verifyProvenance } = require('../../packages/provenance-engine');

function processSource(code) {
  const parsed = parseSource(code);
  const scopedAst = analyzeScope(parsed.ast).ast;
  const ir = generateCanonicalIR(scopedAst);
  const cfg = generateCFG(ir);
  const dataflow = analyzeDataflow(cfg);
  const fragments = extractFragments(dataflow);
  return generateFingerprint(fragments);
}

module.exports = {
  processSource,
  verifyProvenance
};
