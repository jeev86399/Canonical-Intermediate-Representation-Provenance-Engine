const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const matrix = require('./matrix.js');
const { runWLCDH, verifyWLCDH } = require('./engine.js');

// Original CIPE Pipeline
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

function runWLCDHPipeline(code) {
  const parsed = parseSource(code);
  const scopedAst = analyzeScope(parsed.ast).ast;
  const ir = generateCanonicalIR(scopedAst);
  const cfg = generateCFG(ir);
  const dataflow = analyzeDataflow(cfg);
  return runWLCDH(dataflow, 2);
}

// Baselines
function exactHashBaseline(code) {
  return crypto.createHash('sha256').update(code).digest('hex');
}

function tokenBaseline(code) {
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

console.log('Running Phase 6 Experiments (WLCDH vs CIPE vs Baselines)...\n');

matrix.forEach((test, index) => {
  const result = {
    id: index + 1,
    category: test.category,
    expected: test.expected,
    cipe: { status: 'FAILED', timeMs: 0 },
    wlcdh: { status: 'FAILED', timeMs: 0 },
    baselineHash: { match: false },
    baselineToken: { match: false },
    baselineAST: { match: false }
  };

  // Baselines
  result.baselineHash.match = exactHashBaseline(test.original) === exactHashBaseline(test.suspect);
  result.baselineToken.match = tokenBaseline(test.original) === tokenBaseline(test.suspect);
  result.baselineAST.match = astBaseline(test.original) === astBaseline(test.suspect);

  // Original CIPE
  const startCIPE = performance.now();
  try {
    const origFingerprint = runCIPEPipeline(test.original);
    const suspFingerprint = runCIPEPipeline(test.suspect);
    const report = verifyProvenance(origFingerprint, suspFingerprint);
    result.cipe.status = report.status;
  } catch (err) {
    result.cipe.status = 'ERROR';
  }
  result.cipe.timeMs = performance.now() - startCIPE;

  // New WLCDH Mechanism
  const startWLCDH = performance.now();
  try {
    const origWLCDH = runWLCDHPipeline(test.original);
    const suspWLCDH = runWLCDHPipeline(test.suspect);
    const report = verifyWLCDH(origWLCDH, suspWLCDH);
    result.wlcdh.status = report.status;
    result.wlcdh.confidence = report.confidence;
    result.wlcdh.matched = report.matched;
  } catch (err) {
    console.error(err); result.wlcdh.status = 'ERROR';
  }
  result.wlcdh.timeMs = performance.now() - startWLCDH;

  results.push(result);

  const passed = result.wlcdh.status === test.expected;
  if (!passed) allPassed = false;
  
  console.log(`[${passed ? 'PASS' : 'FAIL'}] ${test.category}`);
  console.log(`  Expected: ${test.expected}`);
  console.log(`  WLCDH:    ${result.wlcdh.status} (${result.wlcdh.timeMs.toFixed(2)}ms, Conf: ${result.wlcdh.confidence?.toFixed(2)})`);
  console.log(`  CIPE:     ${result.cipe.status} (${result.cipe.timeMs.toFixed(2)}ms)`);
});

const mdReportPath = path.join(__dirname, '../../docs/experiments/phase6/report.md');
let mdReport = '# Phase 6 Experimental Results (WLCDH)\n\n';
mdReport += 'The following matrix compares the new Weisfeiler-Lehman Contextual Dataflow Hashing (WLCDH) mechanism against the original CIPE implementation and standard baselines.\n\n';
mdReport += '| ID | Category | Expected | WLCDH | CIPE | Exact Hash | Token Hash | AST Hash |\n';
mdReport += '|---|---|---|---|---|---|---|---|\n';

results.forEach(r => {
  const wlcdhMark = r.wlcdh.status === r.expected ? '✅' : '❌';
  // Check if CIPE matched expected, or if it failed where it shouldn't
  let cipeMark = r.cipe.status === r.expected ? '✅' : '❌';
  
  const hashMark = (r.baselineHash.match && r.expected.includes('MATCH')) || (!r.baselineHash.match && !r.expected.includes('MATCH')) ? '✅' : '❌';
  const tokenMark = (r.baselineToken.match && r.expected.includes('MATCH')) || (!r.baselineToken.match && !r.expected.includes('MATCH')) ? '✅' : '❌';
  const astMark = (r.baselineAST.match && r.expected.includes('MATCH')) || (!r.baselineAST.match && !r.expected.includes('MATCH')) ? '✅' : '❌';
  
  mdReport += `| ${r.id} | ${r.category} | ${r.expected} | **${r.wlcdh.status}** ${wlcdhMark} | ${r.cipe.status} ${cipeMark} | ${r.baselineHash.match ? 'MATCH' : 'NO_MATCH'} ${hashMark} | ${r.baselineToken.match ? 'MATCH' : 'NO_MATCH'} ${tokenMark} | ${r.baselineAST.match ? 'MATCH' : 'NO_MATCH'} ${astMark} |\n`;
});

fs.writeFileSync(mdReportPath, mdReport);

console.log(`\nReport generated at docs/experiments/phase6/report.md`);
