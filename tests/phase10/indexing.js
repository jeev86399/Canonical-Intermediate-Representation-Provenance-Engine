const { performance } = require('perf_hooks');

function runIndexingExperiment() {
  console.log("========================================");
  console.log("   PHASE 10: INDEXING EXPERIMENT        ");
  console.log("========================================\n");

  const NUM_FRAGMENTS = 100000;
  console.log(`Generating a synthetic reverse-index of ${NUM_FRAGMENTS} fragments...`);

  // Simple in-memory Map to represent Redis or Elasticsearch
  const index = new Map();

  const startIdx = performance.now();
  for (let i = 0; i < NUM_FRAGMENTS; i++) {
    // Mock 64-char sha256 hash
    const hash = 'a'.repeat(64 - i.toString().length) + i.toString();
    
    index.set(hash, {
      repo: 'repo-A',
      commit: 'abc123def456',
      file: 'src.js',
      author: 'alice',
      timestamp: Date.now()
    });
  }
  const endIdx = performance.now();
  console.log(`Index built in ${(endIdx - startIdx).toFixed(2)} ms.`);

  const targetHash = 'a'.repeat(64 - '99999'.length) + '99999';

  console.log(`\nQuerying for fragment: ${targetHash}...`);
  const startQuery = performance.now();
  const result = index.get(targetHash);
  const endQuery = performance.now();

  if (result) {
    console.log(`Fragment found in ${(endQuery - startQuery).toFixed(4)} ms:`, result);
    console.log("\nINDEXING EXPERIMENT: PASS");
  } else {
    console.log("Fragment NOT found.");
    console.log("\nINDEXING EXPERIMENT: FAIL");
    process.exit(1);
  }
}

try {
  runIndexingExperiment();
} catch (e) {
  console.error(e);
  process.exit(1);
}
