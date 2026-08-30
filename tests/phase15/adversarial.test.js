const assert = require('assert');
const { compareRepositories } = require('../../packages/provenance-pipeline/repository-compare');

function runTest() {
  console.log('Running Adversarial Test (Multi-file Provocation)...');

  // Case 1: Exact Match (Multiple Files)
  const base1 = new Map([
    ['a.js', 'function add(a, b) { return a + b; }'],
    ['b.js', 'function sub(a, b) { return a - b; }']
  ]);
  const target1 = new Map([
    ['a.js', 'function add(a, b) { return a + b; }'],
    ['b.js', 'function sub(a, b) { return a - b; }']
  ]);
  const res1 = compareRepositories(base1, target1);
  assert.strictEqual(res1.classification, 'EXACT_MATCH', 'Identical multi-file repo should be exact match');

  // Case 2: Dead-code dilution & Unrelated insertion
  const target2 = new Map([
    ['a.js', 'function add(a, b) { return a + b; }'],
    ['b.js', 'function sub(a, b) { return a - b; }'],
    ['c.js', 'function unrelated() { return 42; }'] // Dilution
  ]);
  const res2 = compareRepositories(base1, target2);
  assert.strictEqual(res2.classification, 'PARTIAL_PROVENANCE', 'Added unrelated files should result in partial provenance');
  assert.ok(res2.addedFragments.length > 0, 'Should detect added fragments');

  // Case 3: Completely Different
  const base3 = new Map([['a.js', 'function x() { return 1; }']]);
  const target3 = new Map([['a.js', 'function y() { return 2; }']]);
  const res3 = compareRepositories(base3, target3);
  assert.strictEqual(res3.classification, 'DIFFERENT', 'Different repos should not match');

  // Case 4: File movement/renaming (but same content)
  const target4 = new Map([
    ['utils/a.js', 'function add(a, b) { return a + b; }'],
    ['core/b.js', 'function sub(a, b) { return a - b; }']
  ]);
  const res4 = compareRepositories(base1, target4);
  assert.strictEqual(res4.classification, 'EXACT_MATCH', 'File renaming/moving without content change is EXACT_MATCH on repo level');

  console.log('✅ Adversarial Test Passed.');
}

module.exports = runTest;
if (require.main === module) runTest();
