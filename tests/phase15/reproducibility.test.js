const assert = require('assert');
const { createRepositoryVerificationReceipt } = require('../../packages/verification-engine/receipt');

function runTest() {
  console.log('Running Reproducibility Test (Event Identity vs Content Identity)...');

  const verificationData = {
    classification: 'PARTIAL_PROVENANCE',
    matchData: {
      matchedFiles: ['a.js', 'b.js'], // Order doesn't matter, evidence stringifier sorts
      matchedFragments: ['f2', 'f1'], 
      missingFragments: [],
      addedFragments: [],
      changedDependencies: 0,
      unsupportedFeatures: []
    }
  };

  const verificationData2 = {
    classification: 'PARTIAL_PROVENANCE',
    matchData: {
      matchedFiles: ['b.js', 'a.js'],
      matchedFragments: ['f1', 'f2'],
      missingFragments: [],
      addedFragments: [],
      changedDependencies: 0,
      unsupportedFeatures: []
    }
  };

  const executionMetadata1 = { workerId: 1, durationMs: 15 };
  const executionMetadata2 = { workerId: 2, durationMs: 12 };

  const receipt1 = createRepositoryVerificationReceipt(verificationData, executionMetadata1);
  
  // Sleep 10ms to ensure different timestamp
  const start = Date.now();
  while(Date.now() - start < 10) {}

  const receipt2 = createRepositoryVerificationReceipt(verificationData2, executionMetadata2);

  // Assert CONTENT Identity is perfectly identical
  assert.strictEqual(receipt1.evidenceDigest, receipt2.evidenceDigest, 'Evidence digests must match despite array ordering');

  // Assert EVENT Identity is perfectly decoupled
  assert.notStrictEqual(receipt1.verificationId, receipt2.verificationId, 'Verification IDs must differ for different executions');
  assert.notStrictEqual(receipt1.generatedAt, receipt2.generatedAt, 'Generated timestamps must differ');
  assert.notStrictEqual(receipt1.executionMetadata.workerId, receipt2.executionMetadata.workerId, 'Execution metadata must differ');

  console.log('✅ Reproducibility Test Passed.');
}

module.exports = runTest;
if (require.main === module) runTest();
