const { execSync } = require('child_process');
const path = require('path');

console.log("========================================");
console.log("   PHASE 9 SECURITY REGRESSION SUITE    ");
console.log("========================================\n");

const tests = [
  'serialization/runner.js',
  'fragment-collision/runner.js',
  'complexity-attacks/runner.js',
  'properties/runner.js',
  'reference/verifier.js'
];

for (const test of tests) {
  console.log(`>>> RUNNING: ${test}`);
  try {
    const output = execSync(`node ${path.join(__dirname, '..', test)}`, { encoding: 'utf-8' });
    console.log(output.trim());
    console.log();
  } catch (e) {
    console.error(`[ERROR] ${test} failed with code ${e.status}`);
    console.error(e.stderr || e.stdout);
    process.exit(1);
  }
}

console.log("========================================");
console.log("   ALL REGRESSION TESTS PASSED          ");
console.log("========================================");
