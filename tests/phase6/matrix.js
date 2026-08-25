module.exports = [
  {
    category: 'A. Variable renaming',
    expected: 'EXACT_MATCH',
    original: `function sum(a, b) { let result = a + b; return result; }`,
    suspect: `function sum(x, y) { let r = x + y; return r; }`
  },
  {
    category: 'B. Function renaming',
    expected: 'EXACT_MATCH',
    original: `function compute() { return 1; }`,
    suspect: `function doMath() { return 1; }`
  },
  {
    category: 'C. Independent function reordering',
    expected: 'EXACT_MATCH',
    original: `function a() { return 1; } function b() { return 2; }`,
    suspect: `function b() { return 2; } function a() { return 1; }`
  },
  {
    category: 'D. Supported syntax transformation',
    expected: 'EXACT_MATCH',
    original: `function check(x) { if (x) return 1; else return 0; }`,
    suspect: `function check(x) { return x ? 1 : 0; }`
  },
  {
    category: 'E. IIFE wrapping',
    expected: 'EXACT_MATCH',
    original: `let x = 5; console.log(x);`,
    suspect: `(function() { let x = 5; console.log(x); })();`
  },
  {
    category: 'F. Dependency-order injection (Dummy Variable)',
    expected: 'EXACT_MATCH',
    original: `function math(a) { let x = a * 2; return x; }`,
    suspect: `function math(a) { let dummy = 0; let x = a * 2; return x; }`
  },
  {
    category: 'G. Dead-code dilution',
    expected: 'PARTIAL_MATCH',
    original: `function math(a) { let x = a * 2; return x; }`,
    suspect: `function math(a) { let x = a * 2; return x; } function unused() { return 42; }`
  },
  {
    category: 'H. Partial function copying',
    expected: 'PARTIAL_MATCH',
    original: `function a() { return 1; } function b() { return 2; }`,
    suspect: `function a() { return 1; } function c() { return 3; }`
  },
  {
    category: 'I. Multiple-fragment copying',
    expected: 'PARTIAL_MATCH',
    original: `let a = 1; let b = 2; let c = 3;`,
    suspect: `let a = 1; let z = 99; let c = 3;`
  },
  {
    category: 'J. Dependency modification',
    expected: 'NO_MATCH',
    original: `function math(a) { let x = a * 2; let y = x + 1; return y; }`,
    suspect: `function math(a) { let x = a * 2; let y = a + 1; return y; }` // y uses a instead of x
  },
  {
    category: 'K. Algorithm modification',
    expected: 'NO_MATCH',
    original: `function math(a) { return a * 2; }`,
    suspect: `function math(a) { return a * 3; }`
  },
  {
    category: 'L. Nested control flow',
    expected: 'EXACT_MATCH',
    original: `function check(x) { if (x > 0) { if (x > 10) return 2; else return 1; } return 0; }`,
    suspect: `function check(y) { if (y > 0) { if (y > 10) return 2; else return 1; } return 0; }`
  },
  {
    category: 'M. Recursive functions',
    expected: 'EXACT_MATCH',
    original: `function fib(n) { if (n < 2) return n; return fib(n-1) + fib(n-2); }`,
    suspect: `function fibonacci(x) { if (x < 2) return x; return fibonacci(x-1) + fibonacci(x-2); }`
  },
  {
    category: 'N. Large unrelated code insertion',
    expected: 'PARTIAL_MATCH',
    original: `function importantAlgorithm(data) { let x = data * 2; return x + 5; }`,
    suspect: `function logger() { console.log("Init"); } function importantAlgorithm(d) { let y = d * 2; return y + 5; } function cleanup() { process.exit(); }`
  },
  {
    category: 'O. Fragment relocation',
    expected: 'EXACT_MATCH',
    original: `function core() { let a = 1; let b = 2; return a + b; }`,
    suspect: `function shell() { function core() { let x = 1; let y = 2; return x + y; } return core(); }` // Wait, if we wrap it, it's PARTIAL_MATCH since we added shell.
    // Let's modify O so that the core algorithm is moved but the file is exactly the same fragments.
    // original: a() { return 1; } b() { return 2; }
    // suspect: b() { return 2; } a() { return 1; } -> Covered by C.
    // Let's make O: extracting inline code into a function (though that changes structure).
    // Let's just use a block move.
  }
];

module.exports[14] = {
  category: 'O. Fragment relocation',
  expected: 'EXACT_MATCH',
  original: `let a = 1; let b = 2; { let c = 3; }`,
  suspect: `{ let c = 3; } let a = 1; let b = 2;`
};
