const { analyzeSource, compareSources } = require('../../packages/provenance-pipeline');

function runTest() {
  const code1 = `function hello() { return 'world'; }`;
  const code2 = `function hello(name) { return 'world, ' + name; }`;
  
  try {
    const analysis1 = analyzeSource(code1);
    const analysis2 = analyzeSource(code2);
    
    // 1. Every fingerprint is a valid SHA-256 hex string
    if (!/^[a-f0-9]{64}$/.test(analysis1.fingerprint)) {
      throw new Error("Invalid fingerprint format");
    }
    
    // 2. The canonicalVersion matches 'CIPE-9-WLCDH'
    const evidence = compareSources(code1, code2);
    if (evidence.canonicalVersion !== 'CIPE-9-WLCDH') {
      throw new Error("Invalid canonicalVersion");
    }
    
    // 3. Changing source code produces different fingerprints
    if (analysis1.fingerprint === analysis2.fingerprint) {
      throw new Error("Same fingerprint for different code");
    }
    
    // 4. Identical source code always produces identical fingerprints
    const analysis1_copy = analyzeSource(code1);
    if (analysis1.fingerprint !== analysis1_copy.fingerprint) {
      throw new Error("Non-deterministic fingerprints");
    }
    
    // 5. The evidence packet contains algorithm version info
    if (!evidence.canonicalVersion) {
      throw new Error("Missing algorithm version info");
    }
    
    console.log("VERSIONING: PASS");
    process.exit(0);
  } catch (e) {
    console.log("VERSIONING: FAIL - " + e.message);
    process.exit(1);
  }
}

runTest();
