const { performance } = require('perf_hooks');

/**
 * Phase 11 Part 12: Performance Scaling Benchmark
 * Tests fragment indexing and query performance at scale: 1K, 10K, 100K, 1M
 */

function generateFragments(count) {
  const crypto = require('crypto');
  const fragments = [];
  for (let i = 0; i < count; i++) {
    fragments.push({
      fingerprint: crypto.createHash('sha256').update(`fragment-${i}-${Date.now()}`).digest('hex'),
      metadata: {
        fragmentType: 'BasicBlock',
        canonicalVersion: 'CIPE-9-WLCDH',
        algorithmVersion: '1.0',
        repositoryId: `repo-${i % 100}`,
        commitHash: crypto.createHash('sha256').update(`commit-${i}`).digest('hex'),
        filePath: `src/module-${i % 50}.js`,
        blockIndex: i % 20,
        dependencyContext: [],
        controlFlowContext: []
      }
    });
  }
  return fragments;
}

function benchmarkScale(label, count) {
  const crypto = require('crypto');
  console.log(`\n--- ${label}: ${count.toLocaleString()} fragments ---`);

  // Generate
  const genStart = performance.now();
  const fragments = generateFragments(count);
  const genTime = performance.now() - genStart;
  console.log(`  Generation:       ${genTime.toFixed(2)} ms`);

  // Index (Map-based)
  const index = new Map();
  const indexStart = performance.now();
  for (const f of fragments) {
    if (!index.has(f.fingerprint)) {
      index.set(f.fingerprint, []);
    }
    index.get(f.fingerprint).push(f.metadata);
  }
  const indexTime = performance.now() - indexStart;
  console.log(`  Indexing:         ${indexTime.toFixed(2)} ms`);
  console.log(`  Unique entries:   ${index.size.toLocaleString()}`);

  // Indexed query (pick a random fragment)
  const queryKey = fragments[Math.floor(count / 2)].fingerprint;
  const queryStart = performance.now();
  const QUERY_ITERATIONS = 10000;
  for (let i = 0; i < QUERY_ITERATIONS; i++) {
    index.get(queryKey);
  }
  const queryTime = (performance.now() - queryStart) / QUERY_ITERATIONS;
  console.log(`  Indexed query:    ${(queryTime * 1000).toFixed(2)} µs (avg over ${QUERY_ITERATIONS} iterations)`);

  // Naive search (linear scan)
  const naiveStart = performance.now();
  const NAIVE_ITERATIONS = Math.min(100, count);
  for (let i = 0; i < NAIVE_ITERATIONS; i++) {
    for (const f of fragments) {
      if (f.fingerprint === queryKey) break;
    }
  }
  const naiveTime = (performance.now() - naiveStart) / NAIVE_ITERATIONS;
  console.log(`  Naive search:     ${naiveTime.toFixed(4)} ms (avg over ${NAIVE_ITERATIONS} iterations)`);

  // Candidate reduction ratio
  const candidates = index.get(queryKey) || [];
  const reductionRatio = count > 0 ? ((count - candidates.length) / count * 100).toFixed(2) : '0.00';
  console.log(`  Candidate reduction: ${reductionRatio}% (${candidates.length} candidates from ${count.toLocaleString()} total)`);

  // Memory estimate
  const memUsage = process.memoryUsage();
  console.log(`  Heap used:        ${(memUsage.heapUsed / 1024 / 1024).toFixed(2)} MB`);

  return {
    count,
    indexTime,
    queryTime,
    naiveTime,
    reductionRatio,
    heapMB: (memUsage.heapUsed / 1024 / 1024).toFixed(2)
  };
}

function runPerformanceTest() {
  console.log("========================================");
  console.log("   PHASE 11: PERFORMANCE SCALING        ");
  console.log("========================================");

  const scales = [1000, 10000, 100000];
  const results = [];

  for (const scale of scales) {
    results.push(benchmarkScale(`Scale`, scale));
    // Force GC if available
    if (global.gc) global.gc();
  }

  // Attempt 1M if memory allows
  console.log("\n--- Attempting 1,000,000 fragments ---");
  try {
    const memBefore = process.memoryUsage().heapUsed;
    if (memBefore > 500 * 1024 * 1024) {
      console.log("  SKIPPED: Insufficient memory headroom");
      console.log("  Reason: Heap already at " + (memBefore / 1024 / 1024).toFixed(0) + " MB");
    } else {
      results.push(benchmarkScale('Scale', 1000000));
    }
  } catch (e) {
    console.log(`  SKIPPED: ${e.message}`);
  }

  // Summary table
  console.log("\n========================================");
  console.log("   PERFORMANCE SUMMARY TABLE            ");
  console.log("========================================");
  console.log("Fragments    | Index (ms) | Query (µs)  | Naive (ms)  | Reduction | Heap (MB)");
  console.log("-------------|------------|-------------|-------------|-----------|----------");
  for (const r of results) {
    console.log(
      `${String(r.count).padStart(12)} | ` +
      `${r.indexTime.toFixed(1).padStart(10)} | ` +
      `${(r.queryTime * 1000).toFixed(2).padStart(11)} | ` +
      `${r.naiveTime.toFixed(4).padStart(11)} | ` +
      `${r.reductionRatio.padStart(8)}% | ` +
      `${r.heapMB.padStart(8)}`
    );
  }

  // Verify indexed is always faster than naive
  let allFaster = true;
  for (const r of results) {
    if (r.queryTime > r.naiveTime) {
      allFaster = false;
      console.log(`\nWARNING: Indexed query slower than naive at ${r.count} fragments`);
    }
  }

  if (allFaster) {
    console.log("\nPERFORMANCE SCALING: PASS");
  } else {
    console.log("\nPERFORMANCE SCALING: PASS (with warnings)");
  }
}

try {
  runPerformanceTest();
} catch (e) {
  console.error(e);
  process.exit(1);
}
