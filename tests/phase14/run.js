const runTamper = require('./tamper/tamper-evidence.test.js');
const runReproducibility = require('./reproducibility/reproducibility.test.js');
const runFalsePositive = require('./false-positive-study.js');

function runAll() {
  console.log('==================================================');
  console.log('   CIPE PHASE 14: VERIFIED PROVENANCE PIPELINE');
  console.log('==================================================\n');

  let failed = false;
  try {
    runTamper();
  } catch (e) {
    console.error('Tamper test failed:', e);
    failed = true;
  }

  try {
    runReproducibility();
  } catch (e) {
    console.error('Reproducibility test failed:', e);
    failed = true;
  }

  try {
    runFalsePositive();
  } catch (e) {
    console.error('False Positive test failed:', e);
    failed = true;
  }

  console.log('\n==================================================');
  console.log('FINAL ACCEPTANCE CRITERIA');
  console.log('==================================================');
  if (failed) {
    console.log('PHASE 14 STATUS: FAIL');
    process.exit(1);
  } else {
    console.log('PHASE 14 STATUS: PASS');
    console.log('TAMPER DETECTION: PASS');
    console.log('REPRODUCIBILITY: PASS');
    console.log('FALSE POSITIVES/NEGATIVES: BOUNDED');
    process.exit(0);
  }
}

runAll();
