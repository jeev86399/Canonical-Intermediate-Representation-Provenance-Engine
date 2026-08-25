const { analyzeSource } = require('../../packages/provenance-pipeline');

function runSecurityTest() {
  console.log("========================================");
  console.log("   PHASE 10: SECURITY TESTING           ");
  console.log("========================================\n");

  // 1. Collision Resistance (Different Identifiers)
  // Even though identifiers are scrubbed, structural logic must prevent collisions between structurally different programs.
  const src1 = `function add(a, b) { return a + b; }`;
  const src2 = `function sub(a, b) { return a - b; }`;
  const src3 = `function mul(a, b) { return a * b; }`;
  
  const f1 = analyzeSource(src1).fingerprint;
  const f2 = analyzeSource(src2).fingerprint;
  const f3 = analyzeSource(src3).fingerprint;

  console.log("Checking basic operator structural uniqueness:");
  console.log(`  add: ${f1}`);
  console.log(`  sub: ${f2}`);
  console.log(`  mul: ${f3}`);
  
  if (f1 === f2 || f2 === f3 || f1 === f3) {
    console.log("SECURITY FAIL: Operator Collision Detected.");
    process.exit(1);
  } else {
    console.log("  -> OK (Operators generate unique structures)");
  }

  // 2. Intra-Block Injection Test (from Phase 9)
  console.log("\nChecking Intra-Block Injection resilience:");
  const orig = `function calc(a) { let x = a * 2; return x; }`;
  const injected = `function calc(a) { let dummy = 1; let x = a * 2; return x; }`;
  
  const fOrig = analyzeSource(orig).fingerprint;
  const fInj = analyzeSource(injected).fingerprint;
  
  if (fOrig === fInj) {
    console.log("SECURITY FAIL: Vulnerable to Intra-Block Injection.");
    process.exit(1);
  } else {
    console.log("  -> OK (Injection alters fragment hash)");
  }

  console.log("\nSECURITY TESTING: PASS");
}

try {
  runSecurityTest();
} catch (e) {
  console.error(e);
  process.exit(1);
}
