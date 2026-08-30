const assert = require('assert');
const path = require('path');
const { isSafePath, isValidFile, ingestLocalDirectory } = require('../../packages/repository-engine');

function runTest() {
  console.log('Running Security Test (Path Traversal & Boundaries)...');

  // 1. Path Traversal Test
  const base = '/repo/src';
  assert.strictEqual(isSafePath(base, 'file.js'), true, 'Valid relative path should be safe');
  assert.strictEqual(isSafePath(base, 'subdir/file.js'), true, 'Valid subdirectory should be safe');
  assert.strictEqual(isSafePath(base, '../file.js'), false, 'Path traversal should be blocked');
  assert.strictEqual(isSafePath(base, '../../etc/passwd'), false, 'Deep path traversal should be blocked');

  // 2. Extension Validation
  assert.strictEqual(isValidFile('index.js'), true, 'JS should be allowed');
  assert.strictEqual(isValidFile('index.tsx'), true, 'TSX should be allowed');
  assert.strictEqual(isValidFile('image.png'), false, 'PNG should be blocked');
  assert.strictEqual(isValidFile('malware.exe'), false, 'EXE should be blocked');

  // 3. Max Depth Test
  try {
    ingestLocalDirectory(__dirname, 11); // Force depth 11
    assert.fail('Should have thrown MAX_DEPTH exceeded');
  } catch (e) {
    assert.strictEqual(e.message, 'MAX_DEPTH exceeded');
  }

  console.log('✅ Security Test Passed.');
}

module.exports = runTest;
if (require.main === module) runTest();
