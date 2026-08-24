const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const matrix = require('./matrix.js');

// CIPE Pipeline
const { parseSource } = require('../../packages/parser/index.js');
const { analyzeScope } = require('../../packages/scope-engine/index.js');
const { generateCanonicalIR } = require('../../packages/canonical-ir/index.js');
const { generateCFG } = require('../../packages/cfg-engine/index.js');
const { analyzeDataflow } = require('../../packages/dataflow-engine/index.js');
const { extractFragments } = require('../../packages/fragment-engine/index.js');
const { generateFingerprint } = require('../../packages/fingerprint-engine/index.js');
const { verifyProvenance } = require('../../packages/provenance-engine/index.js');

function runCIPEPipeline(code) {
  const parsed = parseSource(code);
  const scopedAst = analyzeScope(parsed.ast).ast;
  const ir = generateCanonicalIR(scopedAst);
  const cfg = generateCFG(ir);
  const dataflow = analyzeDataflow(cfg);
  const fragments = extractFragments(dataflow);
  return generateFingerprint(fragments);
}

// Baselines
function exactHashBaseline(code) {
  return crypto.createHash('sha256').update(code).digest('hex');
}

function tokenBaseline(code) {
  // Very crude AST/Token approximation: strip whitespace and comments
  return code.replace(/\/\/[^\n]*/g, '').replace(/\s+/g, '');
}

function astBaseline(code) {
  try {
    const ast = parseSource(code).ast;
    const cleanAst = JSON.parse(JSON.stringify(ast, (key, val) => {
      if (key === 'start' || key === 'end' || key === 'loc' || key === 'comments') return undefined;
      return val;
    }));
    return JSON.stringify(cleanAst);
  } catch(e) {
    return 'PARSE_ERROR';
  }
}

// Run Experiments
const results = [];
let allPassed = true;

console.log('Running Phase 3 Experiments & Baselines...\n');

matrix.forEach((test, index) => {
  const result = {
    id: index + 1,
    category: test.category,
    expected: test.expected,
    cipe: { status: 'FAILED', timeMs: 0 },
    baselineHash: { match: false },
    baselineToken: { match: false },
    baselineAST: { match: false }
  };

  // 1. Baselines
  result.baselineHash.match = exactHashBaseline(test.original) === exactHashBaseline(test.suspect);
  result.baselineToken.match = tokenBaseline(test.original) === tokenBaseline(test.suspect);
  result.baselineAST.match = astBaseline(test.original) === astBaseline(test.suspect);

  // 2. CIPE
  const start = performance.now();
  try {
    const origFingerprint = runCIPEPipeline(test.original);
    const suspFingerprint = runCIPEPipeline(test.suspect);
    const report = verifyProvenance(origFingerprint, suspFingerprint);
    
    result.cipe.status = report.status;
    result.cipe.confidence = report.confidence;
    
  } catch (err) {
    if (err.name === 'UnsupportedSyntaxError' || err.message.includes('Not Supported by MVP')) {
      result.cipe.status = 'ERROR_UNSUPPORTED';
    } else {
      result.cipe.status = 'ERROR_UNKNOWN';
      result.cipe.error = err.stack;
    }
  }
  result.cipe.timeMs = performance.now() - start;

  results.push(result);

  const passed = result.cipe.status === test.expected;
  if (!passed) allPassed = false;
  console.log(`[${passed ? 'PASS' : 'FAIL'}] ${test.category}`);
  if (!passed) {
    console.log(`  Expected: ${test.expected}, Got: ${result.cipe.status}`);
    if (result.cipe.error) {
      console.log(`  Error: ${result.cipe.error}`);
    } else {
      console.log(`  Confidence: ${result.cipe.confidence}, Details: ${JSON.stringify(result.cipe.evidence)}`);
    }
  }
});

// Output Reports
const resultsJson = JSON.stringify(results, null, 2);
fs.writeFileSync(path.join(__dirname, '../../docs/experiments/results.json'), resultsJson);

let mdReport = '# Phase 4 Baseline Comparison Results\n\n';
mdReport += '| ID | Category | Expected | CIPE | Exact Hash | Token Match | AST Match |\n';
mdReport += '|---|---|---|---|---|---|---|\n';

results.forEach(r => {
  const cipeMark = r.cipe.status === r.expected ? '✅' : '❌';
  const hashMark = (r.baselineHash.match && r.expected.includes('MATCH')) || (!r.baselineHash.match && !r.expected.includes('MATCH')) ? '✅' : '❌';
  const tokenMark = (r.baselineToken.match && r.expected.includes('MATCH')) || (!r.baselineToken.match && !r.expected.includes('MATCH')) ? '✅' : '❌';
  const astMark = (r.baselineAST.match && r.expected.includes('MATCH')) || (!r.baselineAST.match && !r.expected.includes('MATCH')) ? '✅' : '❌';
  
  mdReport += `| ${r.id} | ${r.category} | ${r.expected} | ${r.cipe.status} ${cipeMark} | ${r.baselineHash.match ? 'MATCH' : 'NO_MATCH'} ${hashMark} | ${r.baselineToken.match ? 'MATCH' : 'NO_MATCH'} ${tokenMark} | ${r.baselineAST.match ? 'MATCH' : 'NO_MATCH'} ${astMark} |\n`;
});

fs.writeFileSync(path.join(__dirname, '../../docs/experiments/baseline-comparison.md'), mdReport);

console.log(`\nReports generated at docs/experiments/`);
if (!allPassed) {
  process.exit(1);
}
