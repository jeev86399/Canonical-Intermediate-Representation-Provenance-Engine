const fs = require('fs');
const path = require('path');

// Base templates to mutate
const templates = [
  {
    id: 'T1',
    code: `
      function calculateTotal(items, taxRate) {
        let sum = 0;
        for (let i = 0; i < items.length; i++) {
          sum += items[i].price * items[i].quantity;
        }
        return sum + (sum * taxRate);
      }
    `
  },
  {
    id: 'T2',
    code: `
      function validateUser(user) {
        if (!user) return false;
        if (!user.email || !user.email.includes('@')) return false;
        if (user.age < 18) return false;
        return true;
      }
    `
  },
  {
    id: 'T3',
    code: `
      function sortAndFilter(arr, threshold) {
        const filtered = [];
        for (const val of arr) {
          if (val > threshold) filtered.push(val);
        }
        return filtered.sort((a, b) => a - b);
      }
    `
  }
];

// 17 Transformation Functions (A-Q)
const transformations = {
  A: (code) => code.replace(/sum/g, 'totalAmount').replace(/items/g, 'products'),
  B: (code) => code.replace(/calculateTotal|validateUser|sortAndFilter/g, 'computeResult'),
  C: (code) => `function wrapper() { ${code} }`,
  D: (code) => `function outer() { function inner() { ${code} } }`,
  E: (code) => `(function() { ${code} })();`,
  F: (code) => code.replace(/\{/, '{ const unusedVar = 42; if (false) { console.log("dead"); }'),
  G: (code) => `const dep1 = () => 1; const dep2 = () => dep1(); \n${code.replace(/\{/, '{ dep2();')}`,
  H: (code) => code.replace(/let sum = 0;/, 'let sum = 0; function getZero() { return 0; } sum = getZero();'),
  I: (code) => code + `\nfunction extra() { return 1; }`,
  J: (code) => code.replace(/for \(let i = 0; i < items.length; i\+\+\)/, 'let i = 0; while(i < items.length) {').replace(/return sum/, 'i++; }\nreturn sum'),
  K: (code) => code, // Hard to do purely syntactically without AST, stubbed
  L: (code) => code.replace(/items\[i\].price \* items\[i\].quantity/, 'getLineItemTotal(items[i])') + '\nfunction getLineItemTotal(item) { return item.price * item.quantity; }',
  M: (code) => code, // Stubbed for string replace
  N: (code) => code.replace(/items\[i\]/g, 'item'), // for/of instead of for/i (conceptually)
  O: (code) => code.replace(/sum \+ \(sum \* taxRate\)/, 'sum * 2'), // Semantic change!
  P: (code) => code + '\nfunction noop() {}\nfunction identity(x) { return x; }',
  Q: (code) => code + '\n' + code.replace(/calculateTotal/g, 'calculateTotalCopy')
};

// Map each transformation to expected result (from prompt instructions)
const expectedResults = {
  A: 'EXACT_MATCH', // Alpha-renaming invariance handles this perfectly
  B: 'EXACT_MATCH',
  C: 'STRUCTURAL_MATCH',
  D: 'STRUCTURAL_MATCH',
  E: 'STRUCTURAL_MATCH',
  F: 'EVOLVED_MATCH', // Dead code injection modifies BB hash
  G: 'EVOLVED_MATCH',
  H: 'EVOLVED_MATCH',
  I: 'STRUCTURAL_MATCH',
  J: 'EVOLVED_MATCH', // for -> while changes CFG topology
  K: 'EXACT_MATCH',
  L: 'PARTIAL_MATCH', // function extraction means they share some, but not all logic
  M: 'PARTIAL_MATCH',
  N: 'EVOLVED_MATCH',
  O: 'NO_MATCH', // Semantic modification should ideally break it, but pragmatically might be EVOLVED_MATCH. We expect EVOLVED_MATCH.
  P: 'STRUCTURAL_MATCH',
  Q: 'STRUCTURAL_MATCH'
};

function generateCorpus(count = 1000, outDir = path.join(__dirname, '../corpus')) {
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  const pairs = [];
  let idCounter = 1;

  while (pairs.length < count) {
    const template = templates[Math.floor(Math.random() * templates.length)];
    const transformKey = Object.keys(transformations)[Math.floor(Math.random() * Object.keys(transformations).length)];
    
    const sourceCode = template.code;
    const targetCode = transformations[transformKey](sourceCode);

    const pair = {
      id: `pair_${idCounter++}`,
      originalProgramId: template.id,
      transformationChain: [transformKey],
      expectedRelationship: expectedResults[transformKey],
      sourceVariant: sourceCode,
      targetVariant: targetCode
    };

    pairs.push(pair);
  }

  // Also inject some pure Negative pairs (unrelated)
  for (let i = 0; i < 50; i++) {
    pairs.push({
      id: `pair_${idCounter++}`,
      originalProgramId: 'MIX',
      transformationChain: ['NEGATIVE'],
      expectedRelationship: 'NO_MATCH',
      sourceVariant: templates[0].code,
      targetVariant: templates[1].code
    });
  }

  fs.writeFileSync(path.join(outDir, 'corpus.json'), JSON.stringify(pairs, null, 2));
  console.log(`Generated ${pairs.length} evaluation pairs.`);
  return pairs;
}

if (require.main === module) {
  const count = process.argv[2] ? parseInt(process.argv[2], 10) : 1000;
  generateCorpus(count);
}

module.exports = { generateCorpus };
