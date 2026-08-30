const { spawn } = require('child_process');
const path = require('path');

async function runScript(scriptPath) {
  return new Promise((resolve, reject) => {
    console.log(`\n▶️ RUNNING: ${scriptPath}`);
    const child = spawn('node', [scriptPath], { stdio: 'inherit' });
    child.on('close', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${scriptPath} failed with code ${code}`));
    });
  });
}

async function runAll() {
  console.log('\n==================================================');
  console.log('   CIPE PHASE 16 & FULL REGRESSION SUITE');
  console.log('==================================================\n');

  // Start the API server in background
  const server = spawn('node', [path.join(__dirname, '../../apps/api/index.js')], { stdio: 'inherit' });
  
  // Wait a moment for server to bind
  await new Promise(r => setTimeout(r, 5000));

  let failed = false;
  try {
    const tests = [
      'e2e-api.test.js',
      'reproducibility.test.js',
      'performance.test.js'
    ];
    
    console.log('--- PHASE 16 E2E TESTS ---\n');
    for (const test of tests) {
      console.log(`▶️ RUNNING: ${path.join(__dirname, test)}`);
      await new Promise((resolve, reject) => {
        const child = spawn('node', [path.join(__dirname, test)], { stdio: 'inherit' });
        child.on('exit', (code) => {
          if (code !== 0) reject(new Error(`${test} failed with code ${code}`));
          else resolve();
        });
      });
      console.log();
    }
  } catch (e) {
    console.error(`TEST SUITE FAILED: ${e}`);
    failed = true;
  } finally {
    server.kill();
  }

  console.log('\n==================================================');
  console.log('FINAL ACCEPTANCE CRITERIA');
  console.log('==================================================');
  if (failed) {
    console.log('PHASE 16 STATUS: FAIL\n');
    process.exit(1);
  } else {
    console.log('✅ End-to-End Metrics & Tracing Validated.');
    console.log('✅ Immutable Provenance Receipts Validated.');
    console.log('✅ Deterministic Audit Logging Validated.');
    console.log('✅ Production Scalability Validated.');
    console.log('\nPHASE 16 STATUS: PASS\n');
    process.exit(0);
  }
}

runAll();
