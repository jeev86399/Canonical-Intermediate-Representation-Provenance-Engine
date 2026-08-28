/**
 * Phase 11 Part 11: Security Test
 * Threat-model the provenance index against 7 attack vectors.
 */
const { createIndex } = require('../../packages/provenance-index');

function runTest() {
  console.log("========================================");
  console.log("   PHASE 11: SECURITY TESTS             ");
  console.log("========================================\n");

  let passed = 0;
  const total = 7;

  function test(name, fn) {
    try {
      fn();
      console.log(`  [FAIL] ${name}: attack was NOT blocked`);
    } catch (e) {
      console.log(`  [PASS] ${name}: blocked with "${e.message}"`);
      passed++;
    }
  }

  const index = createIndex();

  // 1. Malicious fingerprints (non-hex, wrong length)
  test('Malicious fingerprint (non-hex string)', () => {
    index.addFragment("not-a-valid-hex-fingerprint", { repositoryId: 'repo1', fragmentType: 'BasicBlock', canonicalVersion: 'CIPE-9-WLCDH', algorithmVersion: '1.0', commitHash: 'abc', filePath: 'x.js', blockIndex: 0, dependencyContext: [], controlFlowContext: [] });
  });

  // 2. Oversized metadata (>10KB)
  test('Oversized metadata payload', () => {
    index.addFragment("a".repeat(64), { repositoryId: 'repo1', fragmentType: 'BasicBlock', canonicalVersion: 'CIPE-9-WLCDH', algorithmVersion: '1.0', commitHash: 'abc', filePath: 'x.js', blockIndex: 0, dependencyContext: [], controlFlowContext: [], hugePayload: "X".repeat(11000) });
  });

  // 3. Duplicate record flooding (>500 records per fingerprint)
  test('Duplicate record flooding (>500)', () => {
    const floodIndex = createIndex();
    const validHash = "b".repeat(64);
    for (let i = 0; i < 1000; i++) {
      floodIndex.addFragment(validHash, { repositoryId: `repo-${i}`, fragmentType: 'BasicBlock', canonicalVersion: 'CIPE-9-WLCDH', algorithmVersion: '1.0', commitHash: 'abc', filePath: 'x.js', blockIndex: 0, dependencyContext: [], controlFlowContext: [] });
    }
  });

  // 4. Malformed repository paths (shell injection)
  test('Malformed repository path (shell injection)', () => {
    index.addFragment("c".repeat(64), { repositoryId: 'repo; rm -rf /', fragmentType: 'BasicBlock', canonicalVersion: 'CIPE-9-WLCDH', algorithmVersion: '1.0', commitHash: 'abc', filePath: 'x.js', blockIndex: 0, dependencyContext: [], controlFlowContext: [] });
  });

  // 5. Path traversal in file paths
  test('Path traversal in filePath', () => {
    index.addFragment("d".repeat(64), { repositoryId: 'repo1', fragmentType: 'BasicBlock', canonicalVersion: 'CIPE-9-WLCDH', algorithmVersion: '1.0', commitHash: 'abc', filePath: '../../../../etc/passwd', blockIndex: 0, dependencyContext: [], controlFlowContext: [] });
  });

  // 6. Corrupted index entries (import malformed data)
  test('Corrupted index data import', () => {
    index.importIndex("this is not valid JSON at all");
  });

  // 7. Input validation (null fingerprint)
  test('Null fingerprint input', () => {
    index.addFragment(null, { repositoryId: 'repo1' });
  });

  console.log(`\nSECURITY TESTS: ${passed}/${total} PASSED`);
  if (passed === total) {
    process.exit(0);
  } else {
    process.exit(1);
  }
}

runTest();
