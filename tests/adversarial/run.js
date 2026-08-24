const fs = require('fs');
const path = require('path');
const { parseSource } = require('../../packages/parser');
const { analyzeScope } = require('../../packages/scope-engine');
const { generateCanonicalIR } = require('../../packages/canonical-ir');
const { generateCFG } = require('../../packages/cfg-engine');
const { analyzeDataflow } = require('../../packages/dataflow-engine');
const { extractFragments } = require('../../packages/fragment-engine');
const { generateFingerprint } = require('../../packages/fingerprint-engine');
const { verifyProvenance } = require('../../packages/provenance-engine');

function runPipeline(code) {
  try {
    const parsed = parseSource(code);
    const scopedAst = analyzeScope(parsed.ast).ast;
    const ir = generateCanonicalIR(scopedAst);
    const cfg = generateCFG(ir);
    const dataflow = analyzeDataflow(cfg);
    const fragments = extractFragments(dataflow);
    const fingerprintData = generateFingerprint(fragments);
    return { success: true, fingerprintData };
  } catch (err) {
    return { success: false, error: err.message, type: err.name };
  }
}

const originalCode = `
function processPayment(user, amount) {
  let fee = amount * 0.05;
  let total = amount + fee;
  if (user.isPremium) {
    total = amount;
  }
  return total;
}
`;

const attacks = [
  {
    name: 'Function Extraction (Inlining reverse)',
    code: `
function calcFee(amount) { return amount * 0.05; }
function processPayment(user, amount) {
  let fee = calcFee(amount);
  let total = amount + fee;
  if (user.isPremium) {
    total = amount;
  }
  return total;
}
`
  },
  {
    name: 'Wrapper Function Injection (IIFE)',
    code: `
const processPayment = (function() {
  return function(user, amount) {
    let fee = amount * 0.05;
    let total = amount + fee;
    if (user.isPremium) {
      total = amount;
    }
    return total;
  };
})();
`
  },
  {
    name: 'Dead Code / Junk Graph Injection',
    code: `
function processPayment(user, amount) {
  let junk1 = 100;
  let junk2 = junk1 * 2;
  let fee = amount * 0.05;
  let total = amount + fee;
  if (user.isPremium) {
    total = amount;
    let junk3 = total * junk2;
  }
  return total;
}
`
  },
  {
    name: 'Control-Flow Obfuscation (Ternary)',
    code: `
function processPayment(user, amount) {
  let fee = amount * 0.05;
  let total = amount + fee;
  total = user.isPremium ? amount : total;
  return total;
}
`
  },
  {
    name: 'Fragmented Copying (Interleaved logic)',
    code: `
function doEverything(user, amount, otherData) {
  let step1 = otherData + 1;
  let fee = amount * 0.05;
  let step2 = step1 * 2;
  let total = amount + fee;
  console.log(step2);
  if (user.isPremium) {
    total = amount;
  }
  return total;
}
`
  }
];

async function runAttacks() {
  const origPipeline = runPipeline(originalCode);
  
  let markdown = `# CIPE Adversarial Evasion Results\n\n`;
  markdown += `*Goal: This suite actively attempts to defeat CIPE's provenance detection to identify weaknesses for Phase 4 audit.*\n\n`;
  markdown += `| Attack Vector | Status | Confidence | Evaded? |\n`;
  markdown += `|---|---|---|---|\n`;

  let evadedCount = 0;

  for (const attack of attacks) {
    const mutPipeline = runPipeline(attack.code);
    let actualStatus = 'ERROR';
    let confidence = 0;

    if (mutPipeline.success) {
      const report = verifyProvenance(origPipeline.fingerprintData, mutPipeline.fingerprintData);
      actualStatus = report.status;
      confidence = report.confidence;
    } else {
      actualStatus = mutPipeline.type;
    }

    // A successful evasion is when CIPE returns DIFFERENT or a very low confidence PARTIAL_MATCH
    // for code that semantically executes the exact same core algorithm.
    const evaded = actualStatus === 'DIFFERENT' || (actualStatus === 'PARTIAL_MATCH' && confidence < 0.25);
    if (evaded) evadedCount++;

    const emoji = evaded ? '🚨 YES (Weakness)' : '🛡️ NO (Detected)';
    markdown += `| ${attack.name} | ${actualStatus} | ${(confidence * 100).toFixed(1)}% | ${emoji} |\n`;
  }

  markdown += `\n## Vulnerability Summary\n`;
  markdown += `Total successful evasions: ${evadedCount} out of ${attacks.length}\n`;
  
  fs.mkdirSync(path.join(__dirname, '../../docs/experiments'), { recursive: true });
  fs.writeFileSync(path.join(__dirname, '../../docs/experiments/adversarial-results.md'), markdown);
  console.log(`Adversarial testing complete. Evasions: ${evadedCount}/${attacks.length}`);
}

runAttacks();
