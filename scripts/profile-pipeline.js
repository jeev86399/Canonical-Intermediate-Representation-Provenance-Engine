const { performance } = require('perf_hooks');
const fs = require('fs');
const path = require('path');
const { parseSource } = require('../packages/parser');
const { analyzeScopes } = require('../packages/scope-engine');
const { canonicalizeAST } = require('../packages/canonical-ir');
const { buildCFG } = require('../packages/cfg-engine');
const { buildDataflowGraph } = require('../packages/dataflow-engine');
const { generateFragments } = require('../packages/fragment-engine');
const { computeFingerprints } = require('../packages/fingerprint-engine');
const { verifyProvenance } = require('../packages/provenance-engine');

async function profilePipeline() {
  console.log('--- Phase 12: Performance Profiling ---');

  const sourceCode = `
    function complexSort(arr) {
      if (!arr || arr.length === 0) return [];
      let pivot = arr[0];
      let left = [];
      let right = [];
      for (let i = 1; i < arr.length; i++) {
        if (arr[i] < pivot) left.push(arr[i]);
        else right.push(arr[i]);
      }
      return [...complexSort(left), pivot, ...complexSort(right)];
    }
  `;

  // Scale it up to simulate a larger file
  const largeSource = Array(100).fill(sourceCode).join('\n');
  const sizeKb = (Buffer.byteLength(largeSource, 'utf8') / 1024).toFixed(2);
  console.log(`Input Size: ${sizeKb} KB`);

  const metrics = {};

  const measure = async (name, fn) => {
    const startMem = process.memoryUsage().heapUsed;
    const start = performance.now();
    const result = await fn();
    const end = performance.now();
    const endMem = process.memoryUsage().heapUsed;
    
    metrics[name] = {
      timeMs: (end - start).toFixed(2),
      memoryKb: ((endMem - startMem) / 1024).toFixed(2)
    };
    return result;
  };

  try {
    const ast = await measure('Parsing', () => parseSource(largeSource, 'test.js'));
    const scopeData = await measure('Scope Analysis', () => analyzeScopes(ast));
    const canonicalAst = await measure('Canonicalization', () => canonicalizeAST(ast, scopeData));
    const cfg = await measure('CFG Generation', () => buildCFG(canonicalAst));
    const dataflow = await measure('Dataflow Generation', () => buildDataflowGraph(cfg));
    const fragments = await measure('Fragment Generation', () => generateFragments(dataflow));
    const fingerprints = await measure('Fingerprinting', () => computeFingerprints(fragments));

    // Create a slight variant for verification
    const variantSource = largeSource.replace(/complexSort/g, 'quickSort');
    const variantAst = parseSource(variantSource, 'variant.js');
    const vScope = analyzeScopes(variantAst);
    const vCan = canonicalizeAST(variantAst, vScope);
    const vCfg = buildCFG(vCan);
    const vDf = buildDataflowGraph(vCfg);
    const vFrags = generateFragments(vDf);
    const vFingerprints = computeFingerprints(vFrags);

    const targetMeta = { repositoryId: 'R1', commitHash: 'C1', filePath: 'f1.js', fragments: fingerprints.fragments };
    const suspectMeta = { repositoryId: 'R2', commitHash: 'C2', filePath: 'f2.js', fragments: vFingerprints.fragments };

    const verification = await measure('Verification & Evidence', () => verifyProvenance(targetMeta, suspectMeta));

    console.table(metrics);

    // Identify bottlenecks
    const sortedByTime = Object.entries(metrics).sort((a, b) => parseFloat(b[1].timeMs) - parseFloat(a[1].timeMs));
    console.log('\nTop 3 CPU Bottlenecks:');
    sortedByTime.slice(0, 3).forEach((m, i) => console.log(`${i+1}. ${m[0]} (${m[1].timeMs} ms)`));

    const sortedByMem = Object.entries(metrics).sort((a, b) => parseFloat(b[1].memoryKb) - parseFloat(a[1].memoryKb));
    console.log('\nTop 3 Memory Consumers:');
    sortedByMem.slice(0, 3).forEach((m, i) => console.log(`${i+1}. ${m[0]} (${m[1].memoryKb} KB)`));

    // Save report
    const outDir = path.join(__dirname, '../tests/phase12/corpus');
    if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
    fs.writeFileSync(path.join(outDir, 'performance.json'), JSON.stringify({ inputSizeKb: sizeKb, metrics }, null, 2));

  } catch (err) {
    console.error('Profiling error:', err);
  }
}

if (require.main === module) {
  profilePipeline();
}

module.exports = { profilePipeline };
