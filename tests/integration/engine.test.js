const { processSource, verifyProvenance } = require('./pipeline');

describe('Canonical IR Provenance Engine (Strict Tests)', () => {

  test('Variable Renaming (Exact Match)', () => {
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
    expect(result.status).toBe('EXACT_MATCH');
    expect(f1.globalFingerprint).toBe(f2.globalFingerprint);
  });

  test('Commutative Operations (Exact Match)', () => {
    const original = `let result = a + b;`;
    const suspect = `let result = b + a;`;

    const f1 = processSource(original);
    const f2 = processSource(suspect);
    
    const result = verifyProvenance(f1, f2);
    expect(result.status).toBe('EXACT_MATCH');
  });

  test('Whitespace & Comments (Exact Match)', () => {
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
    expect(result.status).toBe('EXACT_MATCH');
  });

  test('Independent Function Reordering (Exact Match)', () => {
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
    expect(result.status).toBe('EXACT_MATCH');
  });

  test('Partial Structural Cloning (Partial Match)', () => {
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
    expect(result.status).toBe('PARTIAL_MATCH');
    expect(result.confidence).toBeGreaterThan(0);
    expect(result.matchedFragments).toBeGreaterThan(0);
  });

  test('Strict AST Whitelisting Rejects Unsupported JS', () => {
    const malicious = `
      class MyClass {}
    `;
    expect(() => processSource(malicious)).toThrow('strictly rejected by the MVP boundary');

    const evalCall = `
      eval("let x = 1;");
    `;
    expect(() => processSource(evalCall)).toThrow('not supported');
  });

  test('Scope Engine handles shadowing correctly', () => {
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
    
    expect(verifyProvenance(f1, f2).status).toBe('EXACT_MATCH');
  });

});
