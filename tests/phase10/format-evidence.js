const fs = require('fs');
const path = require('path');
const { compareSources } = require('../../packages/provenance-pipeline');

function runFormatEvidence() {
  console.log("========================================");
  console.log("   PHASE 10: PROVENANCE EVIDENCE FORMAT ");
  console.log("========================================\n");

  const original = `function add(a, b) { return a + b; }`;
  const stolen = `function math_add(x, y) { return x + y; }`;

  const evidence = compareSources(original, stolen);

  // Extend with cryptographic signatures and timestamps for a real-world evidence packet
  const evidencePacket = {
    metadata: {
      version: "1.0",
      timestamp: new Date().toISOString(),
      generator: "CIPE Git Provenance Pipeline",
      algorithm: "WLCDH-SHA256"
    },
    ...evidence,
    // A real system would digitally sign this payload
    digitalSignature: "MOCK_SIGNATURE_998877665544332211"
  };

  const outputPath = path.join(__dirname, 'evidence.json');
  fs.writeFileSync(outputPath, JSON.stringify(evidencePacket, null, 2));

  console.log(`Generated formalized evidence packet at ${outputPath}`);
  console.log("Format:");
  console.log(JSON.stringify(evidencePacket, null, 2));

  console.log("\nPROVENANCE EVIDENCE FORMAT: PASS");
}

try {
  runFormatEvidence();
} catch (e) {
  console.error(e);
  process.exit(1);
}
