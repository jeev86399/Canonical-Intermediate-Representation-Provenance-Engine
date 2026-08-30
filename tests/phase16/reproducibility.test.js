const assert = require('assert');
const http = require('http');
const path = require('path');
const fs = require('fs');

function request(method, urlPath, body = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3001,
      path: urlPath,
      method,
      headers: { 'Content-Type': 'application/json' }
    };
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, data: JSON.parse(data) }); }
        catch (e) { resolve({ status: res.statusCode, data }); }
      });
    });
    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

function delay(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }

async function pollJob(jobId) {
  for (let i = 0; i < 20; i++) {
    const res = await request('GET', `/api/jobs/${jobId}/progress`);
    if (res.data.status === 'COMPLETED') {
      const resultRes = await request('GET', `/api/jobs/${jobId}/result`);
      return resultRes.data;
    }
    if (res.data.status === 'FAILED' || res.data.status === 'CANCELLED') {
      const jobRes = await request('GET', `/api/jobs/${jobId}`);
      throw new Error(`Job failed: ${res.data.status} | Reason: ${jobRes.data.error}`);
    }
    await delay(200);
  }
  throw new Error('Job timed out');
}

async function runTest() {
  console.log('Running E2E Reproducibility Test...');

  const baseDir1 = path.join(__dirname, 'mock-repo-base1');
  const targetDir1 = path.join(__dirname, 'mock-repo-target1');
  if (!fs.existsSync(baseDir1)) fs.mkdirSync(baseDir1);
  if (!fs.existsSync(targetDir1)) fs.mkdirSync(targetDir1);
  fs.writeFileSync(path.join(baseDir1, 'a.js'), 'function x() { return 1; }');
  fs.writeFileSync(path.join(targetDir1, 'a.js'), 'function x() { return 1; }');

  const baseDir2 = path.join(__dirname, 'mock-repo-base2');
  const targetDir2 = path.join(__dirname, 'mock-repo-target2');
  if (!fs.existsSync(baseDir2)) fs.mkdirSync(baseDir2);
  if (!fs.existsSync(targetDir2)) fs.mkdirSync(targetDir2);
  fs.writeFileSync(path.join(baseDir2, 'a.js'), 'function x() { return 1; }');
  fs.writeFileSync(path.join(targetDir2, 'a.js'), 'function x() { return 1; }');

  // Run 1
  const res1 = await request('POST', '/api/compare-repositories', { baseRepoPath: baseDir1, targetRepoPath: targetDir1 });
  console.log(`Run 1 Job ID: ${res1.data.jobId}, Cached: ${res1.data.cached}`);
  const result1 = await pollJob(res1.data.jobId);
  const receipt1 = result1.receipt;

  // Run 2
  const res2 = await request('POST', '/api/compare-repositories', { baseRepoPath: baseDir2, targetRepoPath: targetDir2 });
  console.log(`Run 2 Job ID: ${res2.data.jobId}, Cached: ${res2.data.cached}`);
  const result2 = await pollJob(res2.data.jobId);
  const receipt2 = result2.receipt;

  console.log('R1 Receipt:', receipt1.verificationId);
  console.log('R2 Receipt:', receipt2.verificationId);

  // Assert CONTENT IDENTITY matches
  assert.strictEqual(receipt1.evidenceDigest, receipt2.evidenceDigest, 'Evidence Digest must match across E2E runs');

  // Assert EVENT IDENTITY differs
  assert.notStrictEqual(receipt1.verificationId, receipt2.verificationId, 'Verification IDs must differ');
  assert.notStrictEqual(receipt1.generatedAt, receipt2.generatedAt, 'Timestamps must differ');

  // Assert Audit Log Valid
  const auditRes = await request('GET', '/api/verification/audit');
  assert.strictEqual(auditRes.data.status, 'AUDIT_CHAIN_VALID', 'Audit chain should remain valid');

  console.log('✅ E2E Reproducibility Test Passed.');
}

module.exports = runTest;
if (require.main === module) {
  runTest().then(() => process.exit(0)).catch(e => {
    console.error(e);
    process.exit(1);
  });
}
