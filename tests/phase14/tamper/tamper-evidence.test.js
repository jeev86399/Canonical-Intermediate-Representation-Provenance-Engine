const assert = require('assert');
const { createVerificationManifest } = require('../../../packages/verification-engine/evidence');
const crypto = require('crypto');

function runTest() {
  console.log('Running Tamper Evidence Test...');

  const inputData = {
    sourceDigest: 'abc',
    targetDigest: 'def',
    matchData: {
      matchedFragments: ['frag1', 'frag2'],
      missingFragments: [],
      addedFragments: ['frag3']
    }
  };

  const { manifest, evidenceDigest, rawSerialization } = createVerificationManifest(inputData);

  // 1. Valid Evidence Verification
  const hash = crypto.createHash('sha256');
  hash.update(rawSerialization);
  assert.strictEqual(hash.digest('hex'), evidenceDigest, 'Original evidence digest should match');

  // 2. Tampering test: Modify a fragment
  const tamperedManifest = JSON.parse(JSON.stringify(manifest));
  tamperedManifest.matchData.matchedFragments.push('frag4-fake');
  
  const { deterministicStringify } = require('../../../packages/verification-engine/evidence');
  const tamperedSerialized = deterministicStringify(tamperedManifest);
  const tamperedHash = crypto.createHash('sha256');
  tamperedHash.update(tamperedSerialized);
  
  assert.notStrictEqual(tamperedHash.digest('hex'), evidenceDigest, 'Tampered evidence digest must not match original');

  console.log('✅ Tamper Evidence Test Passed.');
}

module.exports = runTest;
if (require.main === module) runTest();
