const { analyzeSource } = require('../../packages/provenance-pipeline');

function runReproducibilityTest() {
  console.log("========================================");
  console.log("   PHASE 10: REPRODUCIBILITY EXPERIMENT ");
  console.log("========================================\n");

  const source = `
    function process(data, key) {
      let result = 0;
      for (let i = 0; i < data.length; i++) {
        let temp = data[i] ^ key;
        result += temp;
      }
      return result;
    }
  `;

  const ITERATIONS = 100;
  console.log(`Running ${ITERATIONS} deterministic iterations...`);
  
  const baseAnalysis = analyzeSource(source);
  const baseFingerprint = baseAnalysis.fingerprint;

  for (let i = 1; i <= ITERATIONS; i++) {
    const analysis = analyzeSource(source);
    if (analysis.fingerprint !== baseFingerprint) {
      console.log(`\nREPRODUCIBILITY FAILED on iteration ${i}!`);
      console.log(`Expected: ${baseFingerprint}`);
      console.log(`Got:      ${analysis.fingerprint}`);
      process.exit(1);
    }
    
    if (analysis.fragments.length !== baseAnalysis.fragments.length) {
      console.log(`\nREPRODUCIBILITY FAILED (Fragment Count Mismatch) on iteration ${i}!`);
      process.exit(1);
    }
  }

  console.log(`\nAll ${ITERATIONS} iterations produced identical fingerprint: ${baseFingerprint}`);
  console.log("REPRODUCIBILITY: PASS");
}

try {
  runReproducibilityTest();
} catch (e) {
  console.error(e);
  process.exit(1);
}
