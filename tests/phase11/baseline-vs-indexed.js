/**
 * Phase 11 Part 3: Baseline vs Indexed Search Benchmark
 * Compares linear scan (baseline) against O(1) hash-map indexed lookup
 * using actual CIPE pipeline fragments.
 */
const { createIndex } = require('../../packages/provenance-index');
const { analyzeSource } = require('../../packages/provenance-pipeline');
const { performance } = require('perf_hooks');

function runTest() {
  console.log("========================================");
  console.log("   PHASE 11: BASELINE VS INDEXED SEARCH ");
  console.log("========================================\n");

  const index = createIndex();
  const numFunctions = 20;
  let sampleQueryFragment = null;
  let totalFragsGenerated = 0;

  console.log(`  Generating ${numFunctions} synthetic functions...`);

  for (let i = 0; i < numFunctions; i++) {
    const code = `
      function compute_${i}(a, b) {
        var x = a * ${i + 1};
        var y = b + ${(i + 1) * 2};
        if (x > y) {
          return x - y;
        } else {
          return y - x;
        }
      }
    `;

    try {
      const { fingerprint, fragments } = analyzeSource(code);

      for (let j = 0; j < fragments.length; j++) {
        const fp = fragments[j];
        if (fp && typeof fp === 'string' && fp.length === 64) {
          index.addFragment(fp, {
            fragmentType: 'BasicBlock',
            canonicalVersion: 'CIPE-9-WLCDH',
            algorithmVersion: '1.0',
            repositoryId: `repo-${i % 5}`,
            commitHash: `commit-${i}`,
            filePath: `file_${i}.js`,
            blockIndex: j,
            dependencyContext: [],
            controlFlowContext: []
          });
          totalFragsGenerated++;

          if (!sampleQueryFragment) {
            sampleQueryFragment = fp;
          }
        }
      }
    } catch (e) {
      console.log(`  Warning: Failed to analyze snippet ${i}: ${e.message}`);
    }
  }

  const stats = index.getStats();
  console.log(`  Total fragments generated: ${totalFragsGenerated}`);
  console.log(`  Unique fingerprints: ${stats.uniqueFingerprints}`);
  console.log(`  Repositories: ${stats.repositories}`);

  if (!sampleQueryFragment) {
    console.log("\nBASELINE VS INDEXED: FAIL - no fragments generated");
    process.exit(1);
  }

  console.log(`\n  Query fragment: ${sampleQueryFragment.substring(0, 16)}...`);

  // METHOD A: Baseline (linear scan)
  const ITERATIONS = 1000;
  const baselineStart = performance.now();
  let baselineComparisons = 0;
  let baselineResults = 0;
  for (let i = 0; i < ITERATIONS; i++) {
    const res = index.baselineSearch(sampleQueryFragment);
    baselineComparisons = res.comparisons;
    baselineResults = res.results.length;
  }
  const baselineTime = (performance.now() - baselineStart) / ITERATIONS;

  // METHOD B: Indexed (O(1) lookup)
  const indexedStart = performance.now();
  let indexedResults = 0;
  for (let i = 0; i < ITERATIONS; i++) {
    const res = index.queryFragment(sampleQueryFragment);
    indexedResults = res.length;
  }
  const indexedTime = (performance.now() - indexedStart) / ITERATIONS;

  console.log("\n  --- Comparison Table ---");
  console.log("  Method          | Time (µs)   | Comparisons | Results");
  console.log("  ----------------|-------------|-------------|--------");
  console.log(`  Baseline (scan) | ${(baselineTime * 1000).toFixed(2).padStart(11)} | ${String(baselineComparisons).padStart(11)} | ${baselineResults}`);
  console.log(`  Indexed (O(1))  | ${(indexedTime * 1000).toFixed(2).padStart(11)} | ${String(1).padStart(11)} | ${indexedResults}`);

  const speedup = baselineTime / indexedTime;
  console.log(`\n  Speedup: ${speedup.toFixed(1)}x`);

  // Verify results match
  if (baselineResults !== indexedResults) {
    console.log(`\n  ERROR: Result mismatch (baseline: ${baselineResults}, indexed: ${indexedResults})`);
    console.log("BASELINE VS INDEXED: FAIL");
    process.exit(1);
  }

  console.log(`\nBASELINE VS INDEXED: PASS`);
}

try {
  runTest();
} catch (e) {
  console.error(e);
  process.exit(1);
}
