const fs = require('fs');
const path = require('path');
const { performance } = require('perf_hooks');

const { parseSource } = require('../../packages/parser');
const { analyzeScope } = require('../../packages/scope-engine');
const { generateCanonicalIR } = require('../../packages/canonical-ir');
const { generateCFG } = require('../../packages/cfg-engine');
const { analyzeDataflow } = require('../../packages/dataflow-engine');
const { extractFragments } = require('../../packages/fragment-engine');
const { generateFingerprint } = require('../../packages/fingerprint-engine');

function generateSequentialCode(numLines) {
  let code = '';
  for (let i = 0; i < Math.floor(numLines / 4); i++) {
    code += `function func${i}(a) {\n`;
    code += `  let x = a + ${i};\n`;
    code += `  return x * 2;\n`;
    code += `}\n`;
  }
  return code;
}

function generateNestedCode(depth) {
  let code = `function nestedCompute(val) {\n  let total = val;\n`;
  for (let i = 0; i < depth; i++) {
    code += `${'  '.repeat(i + 1)}if (total > ${i}) {\n`;
    code += `${'  '.repeat(i + 2)}let shadowed = ${i};\n`;
    code += `${'  '.repeat(i + 2)}total += shadowed;\n`;
  }
  code += `${'  '.repeat(depth + 1)}return total;\n`;
  for (let i = depth - 1; i >= 0; i--) {
    code += `${'  '.repeat(i + 1)}}\n`;
  }
  code += `}\n`;
  return code;
}

async function runStressTest(name, code) {
  console.log(`\n--- Running Stress Test: ${name} (${code.split('\n').length} lines) ---`);
  
  const startMemory = process.memoryUsage().heapUsed;
  
  let totalTime = 0;

  const measure = (label, fn) => {
    const t0 = performance.now();
    try {
      const res = fn();
      const t1 = performance.now();
      const timeMs = t1 - t0;
      totalTime += timeMs;
      console.log(`${label}: ${timeMs.toFixed(2)} ms`);
      return res;
    } catch (e) {
      console.error(`${label} FAILED: ${e.message}`);
      return null;
    }
  };

  const ast = measure('Parsing', () => parseSource(code)?.ast);
  if (!ast) return null;

  const scopedAst = measure('Scope Analysis', () => analyzeScope(ast)?.ast);
  if (!scopedAst) return null;

  const ir = measure('Canonicalization (IR)', () => generateCanonicalIR(scopedAst));
  if (!ir) return null;

  const cfg = measure('CFG Generation', () => generateCFG(ir));
  if (!cfg) return null;

  const dfg = measure('Dataflow Generation', () => analyzeDataflow(cfg));
  if (!dfg) return null;

  const fragments = measure('Fragment Generation', () => extractFragments(dfg));
  if (!fragments) return null;

  const fingerprint = measure('Fingerprinting (LSCH)', () => generateFingerprint(fragments));
  if (!fingerprint) return null;

  const endMemory = process.memoryUsage().heapUsed;
  const memoryUsedMB = ((endMemory - startMemory) / 1024 / 1024).toFixed(2);
  
  console.log(`Total Time: ${totalTime.toFixed(2)} ms`);
  console.log(`Memory Delta: ${memoryUsedMB} MB`);
  
  return {
    name,
    lines: code.split('\n').length,
    totalTime,
    memoryUsedMB,
    fragmentCount: fragments.length
  };
}

async function runAll() {
  const results = [];
  
  const scenarios = [
    { name: '10 lines', code: generateSequentialCode(10) },
    { name: '100 lines', code: generateSequentialCode(100) },
    { name: '500 lines', code: generateSequentialCode(500) },
    { name: '1,000 lines', code: generateSequentialCode(1000) },
    { name: '5,000 lines sequential', code: generateSequentialCode(5000) },
    { name: 'Deeply nested (10 depth)', code: generateNestedCode(10) },
    { name: 'Deeply nested (100 depth)', code: generateNestedCode(100) },
  ];
  
  for (const s of scenarios) {
    const res = await runStressTest(s.name, s.code);
    if (res) results.push(res);
  }
  
  let markdown = `# CIPE Stress Test Results\n\n`;
  markdown += `| Scenario | Lines | Time (ms) | Memory Delta (MB) | Fragments |\n`;
  markdown += `|---|---|---|---|---|\n`;
  results.forEach(r => {
    markdown += `| ${r.name} | ${r.lines} | ${r.totalTime.toFixed(2)} | ${r.memoryUsedMB} | ${r.fragmentCount} |\n`;
  });
  
  fs.writeFileSync(path.join(__dirname, '../../docs/experiments/stress-results.md'), markdown);
  console.log('\nStress test complete. Results written to docs/experiments/stress-results.md');
}

runAll();
