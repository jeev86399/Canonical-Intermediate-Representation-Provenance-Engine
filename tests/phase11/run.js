#!/usr/bin/env node
/**
 * Phase 11 Test Orchestrator
 * Runs all Phase 11 test suites and produces a final PASS/FAIL summary.
 * Usage: npm run verify:phase11
 */
const { execSync } = require('child_process');
const path = require('path');

const tests = [
  { name: 'BASELINE VS INDEXED', file: 'baseline-vs-indexed.js' },
  { name: 'DATABASE DESIGN', file: 'database.js' },
  { name: 'PARTIAL PROVENANCE', file: 'partial-provenance.js' },
  { name: 'FP/FN STUDY', file: 'fp-fn-study.js' },
  { name: 'BOILERPLATE ANALYSIS', file: 'boilerplate.js' },
  { name: 'DIFF MODE', file: 'diff-mode.js' },
  { name: 'SECURITY', file: 'security.js' },
  { name: 'PERFORMANCE SCALING', file: 'performance.js' },
  { name: 'STORAGE COMPARISON', file: 'storage-comparison.js' },
  { name: 'VERSIONING', file: 'versioning.js' }
];

console.log("========================================");
console.log("   PHASE 11: FULL TEST SUITE            ");
console.log("========================================\n");

let passed = 0;
let failed = 0;
const results = [];

for (const test of tests) {
  const testPath = path.join(__dirname, test.file);
  process.stdout.write(`  Running ${test.name}... `);
  try {
    execSync(`node "${testPath}"`, {
      stdio: ['pipe', 'pipe', 'pipe'],
      timeout: 120000 // 2 minute timeout per test
    });
    console.log('PASS');
    results.push({ name: test.name, status: 'PASS' });
    passed++;
  } catch (e) {
    console.log('FAIL');
    const stderr = e.stderr ? e.stderr.toString().trim() : '';
    const stdout = e.stdout ? e.stdout.toString().trim() : '';
    if (stderr) console.log(`    Error: ${stderr.substring(0, 200)}`);
    else if (stdout) console.log(`    Output: ${stdout.substring(stdout.length - 200)}`);
    results.push({ name: test.name, status: 'FAIL' });
    failed++;
  }
}

console.log("\n========================================");
console.log("   PHASE 11: SUMMARY                    ");
console.log("========================================\n");

for (const r of results) {
  console.log(`  ${r.status === 'PASS' ? '✓' : '✗'} ${r.name}: ${r.status}`);
}

console.log(`\n  Total: ${passed + failed} | Passed: ${passed} | Failed: ${failed}`);
console.log(`\nPHASE 11 STATUS: ${failed === 0 ? 'PASS' : 'FAIL'}`);

if (failed > 0) process.exit(1);
