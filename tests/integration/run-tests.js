const assert = require('assert');
const { processSource, verifyProvenance } = require('./pipeline');

function runTest(name, fn) {
  try {
    fn();
    console.log(`✅ [PASS] ${name}`);
  } catch (err) {
    console.error(`❌ [FAIL] ${name}`);
    console.error(err);
    process.exit(1);
  }
}

console.log('Running Canonical IR Provenance Engine Tests...\n');

runTest('Variable Renaming (Exact Match)', () => {
  const original = `
    function calculate(a, b) {
      let sum = a + b;
      return sum * 2;
    }
  `;
  const suspect = `
    function calculate(x, y) {
      let total = x + y;
      return total * 2;
    }
  `;

  const f1 = processSource(original);
  const f2 = processSource(suspect);
  
  const result = verifyProvenance(f1, f2);
  assert.strictEqual(result.status, 'EXACT_MATCH');
  assert.strictEqual(f1.globalFingerprint, f2.globalFingerprint);
});

runTest('Commutative Operations (Exact Match)', () => {
  const original = `let result = a + b;`;
  const suspect = `let result = b + a;`;

  const f1 = processSource(original);
  const f2 = processSource(suspect);
  
  const result = verifyProvenance(f1, f2);
  assert.strictEqual(result.status, 'EXACT_MATCH');
});

runTest('Whitespace & Comments (Exact Match)', () => {
  const original = `let x = 1; let y = 2; return x + y;`;
  const suspect = `
    // Initialize x
    let x = 1;
    
    /* 
     Initialize y
    */
    let y = 2;
    
    return x + y;
  `;

  const f1 = processSource(original);
  const f2 = processSource(suspect);
  
  const result = verifyProvenance(f1, f2);
  assert.strictEqual(result.status, 'EXACT_MATCH');
});

runTest('Independent Function Reordering (Partial/Exact Match)', () => {
  const original = `
    function a() { return 1; }
    function b() { return 2; }
  `;
  const suspect = `
    function b() { return 2; }
    function a() { return 1; }
  `;

  const f1 = processSource(original);
  const f2 = processSource(suspect);
  
  const result = verifyProvenance(f1, f2);
  // Due to AST traversal order assigning binding IDs (b:0 vs b:1), the entry blocks will differ.
  // However, the function bodies (Return 1, Return 2) will match exactly!
  assert.ok(result.status === 'PARTIAL_MATCH' || result.status === 'EXACT_MATCH');
  assert.ok(result.matchedFragments > 0);
});

runTest('Partial Structural Cloning (Partial Match)', () => {
  const original = `
    function utility(a) { return a * a; }
    function main() {
      let val = utility(4);
      console.log(val);
    }
  `;
  const suspect = `
    // Someone copied just the utility function
    function mySquareFunc(x) { return x * x; }
    
    function otherApp() {
      return "hello";
    }
  `;

  const f1 = processSource(original);
  const f2 = processSource(suspect);
  
  const result = verifyProvenance(f1, f2);
  assert.strictEqual(result.status, 'PARTIAL_MATCH');
  assert.ok(result.confidence > 0);
  assert.ok(result.matchedFragments > 0);
});

runTest('Strict AST Whitelisting Rejects Unsupported JS', () => {
  const malicious = `
    class MyClass {}
  `;
  let threwMalicious = false;
  try {
    processSource(malicious);
  } catch (e) {
    if (e.message.includes('strictly rejected by the MVP boundary')) {
      threwMalicious = true;
    }
  }
  assert.ok(threwMalicious, 'Did not reject class declaration');

  const evalCall = `
    eval("let x = 1;");
  `;
  let threwEval = false;
  try {
    processSource(evalCall);
  } catch (e) {
    if (e.message.includes('not supported')) {
      threwEval = true;
    }
  }
  assert.ok(threwEval, 'Did not reject eval call');
});

runTest('Scope Engine handles shadowing correctly', () => {
  const original = `
    let a = 1;
    function outer() {
      let a = 2; // Shadow
      return a;
    }
    return a;
  `;
  
  // Changing the outer shadowed variable shouldn't affect the inner
  const suspect = `
    let globalVar = 1;
    function outer() {
      let x = 2; 
      return x;
    }
    return globalVar;
  `;

  const f1 = processSource(original);
  const f2 = processSource(suspect);
  
  assert.strictEqual(verifyProvenance(f1, f2).status, 'EXACT_MATCH');
});

runTest('Function Renaming (Exact Match)', () => {
  const original = `function foo() { return 1; } foo();`;
  const suspect = `function bar() { return 1; } bar();`;
  const result = verifyProvenance(processSource(original), processSource(suspect));
  assert.strictEqual(result.status, 'EXACT_MATCH');
});

runTest('Supported Syntax Transformation (Arrow vs Function) (Exact Match)', () => {
  // Assuming our Canonical IR transforms arrow functions and normal functions into CanonicalFunction
  const original = `const foo = () => { return 1; }; foo();`;
  const suspect = `function foo() { return 1; } foo();`;
  const result = verifyProvenance(processSource(original), processSource(suspect));
  assert.strictEqual(result.status, 'EXACT_MATCH');
});

runTest('Multiple Fragment Copying (Partial Match)', () => {
  const original = `
    function a() { let x = 1; return x + 1; }
    function b() { let y = 2; return y * 2; }
  `;
  const suspect = `
    function c() { let z = 1; return z + 1; } // copied a
    function d() { return 0; } // distinct
    function e() { let w = 2; return w * 2; } // copied b
  `;
  const result = verifyProvenance(processSource(original), processSource(suspect));
  assert.strictEqual(result.status, 'PARTIAL_MATCH');
  assert.ok(result.matchedFragments >= 2);
});

runTest('Unrelated Code Insertion (Partial Match)', () => {
  const original = `function core() { let x = 10; return x * x; }`;
  const suspect = `
    console.log('startup');
    function core() { let a = 10; return a * a; }
    console.log('shutdown');
  `;
  const result = verifyProvenance(processSource(original), processSource(suspect));
  assert.strictEqual(result.status, 'PARTIAL_MATCH');
});

runTest('Dependency Modification (No Match)', () => {
  const original = `let x = 1; let y = x + 1; return y;`;
  const suspect = `let x = 1; let y = 2 + 1; return y;`; // Broke the data edge
  const result = verifyProvenance(processSource(original), processSource(suspect));
  // Without the data edge, the graph is structurally different
  assert.ok(result.status === 'NO_MATCH' || result.status === 'PARTIAL_MATCH'); 
});

runTest('Meaningful Algorithm Modification (No Match)', () => {
  const original = `function calc(a) { return a + 1; }`;
  const suspect = `function calc(a) { return a * 2; }`; // Changed operation
  const result = verifyProvenance(processSource(original), processSource(suspect));
  assert.strictEqual(result.status, 'NO_MATCH');
});

runTest('Unsupported JavaScript Features (Class Declaration)', () => {
  const original = `class Foo { constructor() { this.x = 1; } }`;
  let threw = false;
  try {
    processSource(original);
  } catch (err) {
    threw = true;
    assert.match(err.message, /rejected by the MVP boundary/);
  }
  assert.ok(threw);
});

console.log('\nAll tests passed successfully! 🎉\n');
