const runSecurity = require('./security.test.js');
const runAdversarial = require('./adversarial.test.js');
const runReproducibility = require('./reproducibility.test.js');
const runPerformance = require('./performance.test.js');

function runAll() {
  console.log('==================================================');
  console.log('   CIPE PHASE 15: REPOSITORY PROVENANCE PIPELINE');
  console.log('==================================================\n');

  let failed = false;
  
  const suites = [
    { name: 'Security', fn: runSecurity },
    { name: 'Adversarial', fn: runAdversarial },
    { name: 'Reproducibility', fn: runReproducibility },
    { name: 'Performance', fn: runPerformance }
  ];

  for (const suite of suites) {
    try {
      suite.fn();
    } catch (e) {
      console.error(`${suite.name} test failed:`, e);
      failed = true;
    }
  }

  // NOTE: In a true CI environment, we would also spawn `npm run verify:phase14` etc here
  // to ensure historical regressions don't occur.

  console.log('\n==================================================');
  console.log('FINAL ACCEPTANCE CRITERIA');
  console.log('==================================================');
  if (failed) {
    console.log('PHASE 15 STATUS: FAIL');
    process.exit(1);
  } else {
    console.log('PHASE 15 STATUS: PASS');
    console.log('SECURITY BOUNDARIES: ENFORCED');
    console.log('REPRODUCIBILITY: VERIFIED');
    console.log('PERFORMANCE: BENCHMARK GENERATED');
    process.exit(0);
  }
}

runAll();
