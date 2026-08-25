const { execSync } = require('child_process');
const path = require('path');

const scripts = [
  'before-after.js',
  'history.js',
  'cross-repo.js',
  'attacks.js',
  'stress-test.js',
  'indexing.js',
  'format-evidence.js',
  'reproducibility.js',
  'security.js'
];

console.log("========================================");
console.log("   CIPE PHASE 10: FULL PIPELINE SUITE   ");
console.log("========================================\n");

let passed = 0;
let failed = 0;

for (const script of scripts) {
  const scriptPath = path.join(__dirname, script);
  console.log(`>>> Running ${script} ...`);
  try {
    execSync(`node ${scriptPath}`, { stdio: 'inherit' });
    passed++;
  } catch (e) {
    console.error(`\n[!] ${script} FAILED.\n`);
    failed++;
  }
  console.log('\n----------------------------------------\n');
}

console.log(`\n========================================`);
console.log(`   SUITE RESULT: ${passed} PASSED, ${failed} FAILED`);
console.log(`========================================\n`);

if (failed > 0) {
  process.exit(1);
}
