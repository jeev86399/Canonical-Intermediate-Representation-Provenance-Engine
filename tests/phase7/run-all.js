const { execSync } = require('child_process');
const path = require('path');

const scripts = [
    'reproducibility.js',
    'differential/runner.js',
    'adversarial/runner.js',
    'partial/runner.js',
    'scalability/runner.js',
    'redteam/runner.js',
    'verifier/runner.js'
];

console.log('========================================');
console.log('   PHASE 7 ADVERSARIAL TEST RUNNER      ');
console.log('========================================\n');

for (const script of scripts) {
    const fullPath = path.join(__dirname, script);
    console.log(`\n>>> RUNNING: ${script}`);
    try {
        const out = execSync(`node ${fullPath}`, { stdio: 'inherit' });
    } catch (e) {
        console.error(`\n[ERROR] ${script} failed with code ${e.status}`);
    }
}

console.log('\n========================================');
console.log('   PHASE 7 EXPERIMENTS COMPLETED        ');
console.log('========================================');
