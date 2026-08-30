const assert = require('assert');
const http = require('http');
const path = require('path');
const fs = require('fs');
const { performance } = require('perf_hooks');

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
  for (let i = 0; i < 50; i++) {
    const res = await request('GET', `/api/jobs/${jobId}/progress`);
    if (res.data.status === 'COMPLETED') {
      const resultRes = await request('GET', `/api/jobs/${jobId}/result`);
      return resultRes.data;
    }
    if (res.data.status === 'FAILED' || res.data.status === 'CANCELLED') {
      const jobRes = await request('GET', `/api/jobs/${jobId}`);
      throw new Error(`Job failed: ${res.data.status} | Reason: ${jobRes.data.error}`);
    }
    await delay(100);
  }
  throw new Error('Job timed out');
}

async function runTest() {
  console.log('Running E2E Performance Test...');

  const baseDir = path.join(__dirname, 'mock-perf-base');
  const targetDir = path.join(__dirname, 'mock-perf-target');

  if (!fs.existsSync(baseDir)) fs.mkdirSync(baseDir);
  if (!fs.existsSync(targetDir)) fs.mkdirSync(targetDir);

  // Generate 100 simple files
  for (let i = 0; i < 100; i++) {
    const code = `function func${i}() { return ${i}; }`;
    fs.writeFileSync(path.join(baseDir, `file${i}.js`), code);
    fs.writeFileSync(path.join(targetDir, `file${i}.js`), code);
  }

  const start = performance.now();
  const res = await request('POST', '/api/compare-repositories', { baseRepoPath: baseDir, targetRepoPath: targetDir });
  const result = await pollJob(res.data.jobId);
  const end = performance.now();

  const totalTime = end - start;
  console.log(`Total E2E Pipeline (100 files): ${totalTime.toFixed(2)}ms`);
  
  // Save benchmark
  const docsDir = path.join(__dirname, '../../docs/phase16');
  if (!fs.existsSync(docsDir)) fs.mkdirSync(docsDir, { recursive: true });
  fs.writeFileSync(path.join(docsDir, 'E2E_PERFORMANCE.json'), JSON.stringify({
    totalTimeMs: totalTime,
    files: 100,
    fragments: result.receipt.manifest.matchData.matchedFragments.length
  }, null, 2));

  assert.ok(totalTime < 5000, 'E2E Pipeline should complete in under 5 seconds');
  console.log('✅ E2E Performance Test Passed.');
}

module.exports = runTest;
if (require.main === module) runTest();
