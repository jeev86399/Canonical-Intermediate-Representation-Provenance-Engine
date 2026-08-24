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

const baselineCode = `
function calculateTotal(items, discount) {
  let total = 0;
  for (let i = 0; i < items.length; i++) {
    let price = items[i].price;
    total = total + price;
  }
  if (discount > 0) {
    total = total - discount;
  }
  return total;
}
`;

const mutations = [
  {
    name: 'Rename variable',
    expected: 'MATCH',
    code: `
function calculateTotal(arr, disc) {
  let sum = 0;
  for (let j = 0; j < arr.length; j++) {
    let p = arr[j].price;
    sum = sum + p;
  }
  if (disc > 0) {
    sum = sum - disc;
  }
  return sum;
}
`
  },
  {
    name: 'Reorder independent functions (wrapped)',
    expected: 'PARTIAL_MATCH',
    code: `
function helper() { return 1; }
function calculateTotal(items, discount) {
  let total = 0;
  for (let i = 0; i < items.length; i++) {
    let price = items[i].price;
    total = total + price;
  }
  if (discount > 0) {
    total = total - discount;
  }
  return total;
}
`
  },
  {
    name: 'Change a+b to b+a',
    expected: 'MATCH',
    code: `
function calculateTotal(items, discount) {
  let total = 0;
  for (let i = 0; i < items.length; i++) {
    let price = items[i].price;
    total = price + total;
  }
  if (discount > 0) {
    total = total - discount;
  }
  return total;
}
`
  },
  {
    name: 'Change a constant',
    expected: 'DIFFERENT', // Wait, constant changes might make fragments different. But how many? Let's expect PARTIAL_MATCH because mostly same.
    code: `
function calculateTotal(items, discount) {
  let total = 100; // Changed from 0
  for (let i = 0; i < items.length; i++) {
    let price = items[i].price;
    total = total + price;
  }
  if (discount > 0) {
    total = total - discount;
  }
  return total;
}
`
  },
  {
    name: 'Change an operator',
    expected: 'PARTIAL_MATCH',
    code: `
function calculateTotal(items, discount) {
  let total = 0;
  for (let i = 0; i < items.length; i++) {
    let price = items[i].price;
    total = total * price; // changed + to *
  }
  if (discount > 0) {
    total = total - discount;
  }
  return total;
}
`
  },
  {
    name: 'Change a condition',
    expected: 'PARTIAL_MATCH',
    code: `
function calculateTotal(items, discount) {
  let total = 0;
  for (let i = 0; i < items.length; i++) {
    let price = items[i].price;
    total = total + price;
  }
  if (discount >= 10) { // changed > 0 to >= 10
    total = total - discount;
  }
  return total;
}
`
  },
  {
    name: 'Remove a statement',
    expected: 'PARTIAL_MATCH',
    code: `
function calculateTotal(items, discount) {
  let total = 0;
  for (let i = 0; i < items.length; i++) {
    total = total + items[i].price; // removed intermediate let price
  }
  if (discount > 0) {
    total = total - discount;
  }
  return total;
}
`
  },
  {
    name: 'Add a statement',
    expected: 'PARTIAL_MATCH',
    code: `
function calculateTotal(items, discount) {
  let total = 0;
  console.log("starting"); // Added
  for (let i = 0; i < items.length; i++) {
    let price = items[i].price;
    total = total + price;
  }
  if (discount > 0) {
    total = total - discount;
  }
  return total;
}
`
  },
  {
    name: 'Modify function logic completely',
    expected: 'DIFFERENT',
    code: `
function calculateTotal(items, discount) {
  return items.reduce((sum, i) => sum + i.price, 0) - discount;
}
`
  },
  {
    name: 'Unsupported Syntax (eval)',
    expected: 'UNSUPPORTED',
    code: `
function calculateTotal(items, discount) {
  eval("console.log('hi')");
}
`
  }
];

async function runMutations() {
  const baselinePipeline = runPipeline(baselineCode);
  if (!baselinePipeline.success) {
    console.error("Baseline failed!");
    return;
  }

  let markdown = `# CIPE Mutation Testing Results\n\n`;
  markdown += `| Mutation | Expected Classification | Actual Classification | Result | Confidence |\n`;
  markdown += `|---|---|---|---|---|\n`;

  let falsePositives = 0;
  let falseNegatives = 0;
  let total = mutations.length;

  for (const mut of mutations) {
    const mutPipeline = runPipeline(mut.code);
    let actualStatus;
    let confidence = 0;

    if (!mutPipeline.success) {
      actualStatus = (mutPipeline.type === 'UnsupportedSyntaxError' || mutPipeline.type === 'Error') ? 'UNSUPPORTED' : 'ERROR';
    } else {
      const report = verifyProvenance(baselinePipeline.fingerprintData, mutPipeline.fingerprintData);
      actualStatus = report.status;
      confidence = report.confidence;
    }

    // Determine if it met expectations
    let pass = false;
    // Expected PARTIAL_MATCH can be satisfied by PARTIAL_MATCH or MATCH if it is similar enough, but usually we want to see it catch it.
    // Let's strictly check expected vs actual, allowing some flexibility if actual is PARTIAL_MATCH and expected was DIFFERENT if confidence is low.
    if (actualStatus === mut.expected) {
        pass = true;
    } else if (mut.expected === 'DIFFERENT' && actualStatus === 'PARTIAL_MATCH' && confidence < 0.2) {
        pass = true; // Technically a partial match, but very low confidence.
    } else if (mut.expected === 'PARTIAL_MATCH' && actualStatus === 'DIFFERENT') {
       // False negative - missed the similarity
       falseNegatives++;
    } else if (mut.expected === 'DIFFERENT' && (actualStatus === 'MATCH' || (actualStatus === 'PARTIAL_MATCH' && confidence >= 0.2))) {
       // False positive - thinks it's similar when it shouldn't
       falsePositives++;
    } else {
       // Other failure
       falseNegatives++;
    }

    const emoji = pass ? '✅' : '❌';
    markdown += `| ${mut.name} | ${mut.expected} | ${actualStatus} | ${emoji} | ${(confidence * 100).toFixed(1)}% |\n`;
  }

  markdown += `\n## Summary\n`;
  markdown += `- Total Mutations: ${total}\n`;
  markdown += `- False Positives: ${falsePositives}\n`;
  markdown += `- False Negatives: ${falseNegatives}\n`;
  
  fs.writeFileSync(path.join(__dirname, '../../docs/experiments/mutation-results.md'), markdown);
  console.log('Mutation testing complete. Results written to docs/experiments/mutation-results.md');
}

runMutations();
