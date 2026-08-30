const assert = require('assert');
const http = require('http');

function request(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3001,
      path,
      method,
      headers: {
        'Content-Type': 'application/json'
      }
    };
    
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data) });
        } catch (e) {
          resolve({ status: res.statusCode, data });
        }
      });
    });
    
    req.on('error', reject);
    
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function runTest() {
  console.log('Running E2E API Test (Input Bounds, Timeouts, Errors)...');

  // Test 1: Invalid Input (Missing Source)
  const res1 = await request('POST', '/api/analyze', {});
  assert.strictEqual(res1.status, 400);
  assert.strictEqual(res1.data.error, 'INVALID_INPUT');

  // Test 2: Path Security Violation
  const res2 = await request('POST', '/api/compare-repositories', {
    baseRepoPath: '/repo/a',
    targetRepoPath: '../../etc/passwd'
  });
  assert.strictEqual(res2.status, 403);
  assert.strictEqual(res2.data.error, 'PATH_SECURITY_VIOLATION');

  // Test 3: Valid Single Analysis
  const res3 = await request('POST', '/api/analyze', { source: 'function add(a,b) { return a+b; }' });
  assert.strictEqual(res3.status, 200);
  assert.strictEqual(res3.data.status, 'COMPLETED');
  assert.ok(res3.data.result.fragmentCount > 0);

  // Test 4: Verify 404s
  const res4 = await request('GET', '/api/jobs/invalid-id');
  assert.strictEqual(res4.status, 404);
  assert.strictEqual(res4.data.error, 'INVALID_INPUT');

  console.log('✅ E2E API Test Passed.');
}

module.exports = runTest;
if (require.main === module) runTest();
