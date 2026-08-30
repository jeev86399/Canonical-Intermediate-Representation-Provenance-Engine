const assert = require('assert');
const { createVerificationManifest } = require('../../../packages/verification-engine/evidence');

function runTest() {
  console.log('Running Reproducibility Test...');

  const dataA = {
    sourceDigest: 'abc',
    targetDigest: 'def',
    matchData: {
      matchedFragments: ['frag2', 'frag1'], // Out of order!
      missingFragments: [],
      addedFragments: []
    }
  };

  const dataB = {
    sourceDigest: 'abc',
    targetDigest: 'def',
    matchData: {
      matchedFragments: ['frag1', 'frag2'], // Sorted order
      missingFragments: [],
      addedFragments: []
    }
  };

  const resA = createVerificationManifest(dataA);
  const resB = createVerificationManifest(dataB);

  assert.strictEqual(resA.evidenceDigest, resB.evidenceDigest, 'Evidence Digest must be strictly identical regardless of array insertion order');

  // Also check property reordering in the JSON structure
  const { deterministicStringify } = require('../../../packages/verification-engine/evidence');
  const obj1 = { z: 1, a: 2, b: { y: 3, x: 4 } };
  const obj2 = { a: 2, z: 1, b: { x: 4, y: 3 } };

  assert.strictEqual(deterministicStringify(obj1), deterministicStringify(obj2), 'Property sorting must be deterministic');

  console.log('✅ Reproducibility Test Passed.');
}

module.exports = runTest;
if (require.main === module) runTest();
