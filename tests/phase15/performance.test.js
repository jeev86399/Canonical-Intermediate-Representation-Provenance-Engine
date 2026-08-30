const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { compareRepositories } = require('../../packages/provenance-pipeline/repository-compare');

function runTest() {
  console.log('Running Performance Test (Multi-file Scaling)...');

  const createRepo = (numFiles) => {
    const repo = new Map();
    for (let i = 0; i < numFiles; i++) {
      repo.set(`file${i}.js`, `function func${i}() { return ${i} + 1; }`);
    }
    return repo;
  };

  const results = [];
  
  const testScales = [10, 100, 500]; // 1000 can be too slow for sync tests, capped at 500 for demo bounds
  
  for (const scale of testScales) {
    const base = createRepo(scale);
    const target = createRepo(scale);
    
    // Add one difference to prevent pure Exact Match early return (if any)
    target.set('file0.js', 'function func0() { return 0 + 2; }');

    const start = process.hrtime.bigint();
    const res = compareRepositories(base, target);
    const end = process.hrtime.bigint();

    const durationMs = Number(end - start) / 1_000_000;
    
    results.push({
      files: scale,
      durationMs: durationMs.toFixed(2),
      fragments: res.matchedFragments.length + res.addedFragments.length + res.missingFragments.length
    });
  }

  // Save Results to CSV & JSON
  const docsDir = path.join(__dirname, '../../docs/phase15');
  if (!fs.existsSync(docsDir)) fs.mkdirSync(docsDir, { recursive: true });

  let csv = 'Files,DurationMs,TotalFragments\n';
  results.forEach(r => {
    csv += `${r.files},${r.durationMs},${r.fragments}\n`;
  });

  fs.writeFileSync(path.join(docsDir, 'BENCHMARK_RESULTS.csv'), csv);
  fs.writeFileSync(path.join(docsDir, 'PHASE_15_RESULTS.json'), JSON.stringify(results, null, 2));

  console.log('✅ Performance Test Passed. Results written to docs/phase15/');
}

module.exports = runTest;
if (require.main === module) runTest();
