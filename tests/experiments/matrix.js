module.exports = [
  {
    category: 'variable renaming',
    original: `function calc(a, b) { let result = a + b; return result; }`,
    suspect: `function calc(x, y) { let sum = x + y; return sum; }`,
    expected: 'EXACT_MATCH'
  },
  {
    category: 'function renaming',
    original: `function validateUser(u) { return u.isValid; }`,
    suspect: `function checkUser(u) { return u.isValid; }`,
    expected: 'EXACT_MATCH'
  },
  {
    category: 'whitespace/comments',
    original: `function   foo( a )  { \n return a ; \n }`,
    suspect: `// My function\nfunction foo(a) { return a; }`,
    expected: 'EXACT_MATCH'
  },
  {
    category: 'independent function reordering',
    original: `function a() { return 1; } function b() { return 2; }`,
    suspect: `function b() { return 2; } function a() { return 1; }`,
    expected: 'PARTIAL_MATCH' // The inner blocks match perfectly, but root function IDs flip
  },
  {
    category: 'equivalent supported syntax transformations',
    original: `function multiply(a, b) { return a * b; }`,
    suspect: `const multiply = (a, b) => { return a * b; };`,
    expected: 'EXACT_MATCH'
  },
  {
    category: 'commutative expressions',
    original: `function area(w, h) { return w * h; }`,
    suspect: `function area(w, h) { return h * w; }`,
    expected: 'EXACT_MATCH'
  },
  {
    category: 'partial function copying',
    original: `function a() { return 1; } function b() { return 2; } function c() { return 3; }`,
    suspect: `function a() { return 1; }`,
    expected: 'PARTIAL_MATCH'
  },
  {
    category: 'multiple fragment copying',
    original: `function calc(a) { if (a>0) { return a+1; } return 0; }`,
    suspect: `function doSomething() {} function calc(a) { if (a>0) { return a+1; } return 0; }`,
    expected: 'PARTIAL_MATCH' 
  },
  {
    category: 'unrelated code insertion',
    original: `function getStatus() { return "OK"; }`,
    suspect: `function getStatus() { return "OK"; } function check() { return false; }`,
    expected: 'PARTIAL_MATCH'
  },
  {
    category: 'dependency modification',
    original: `function calc(a, b) { let x = a; return x; }`,
    suspect: `function calc(a, b) { let x = b; return x; }`,
    expected: 'NO_MATCH'
  },
  {
    category: 'meaningful algorithm modification',
    original: `function calc(a, b) { return a + b; }`,
    suspect: `function calc(a, b) { return a - b; }`,
    expected: 'NO_MATCH'
  },
  {
    category: 'unsupported constructs',
    original: `class A {}`,
    suspect: `class A {}`,
    expected: 'ERROR_UNSUPPORTED'
  },
  {
    category: 'nested control flow',
    original: `function check(x) { if(x > 0) { if(x < 10) return true; } return false; }`,
    suspect: `function check(a) { if(a > 0) { if(a < 10) return true; } return false; }`,
    expected: 'EXACT_MATCH'
  },
  {
    category: 'loops',
    original: `function sum(arr) { let total = 0; for(let i=0; i<arr.length; i++) { total += arr[i]; } return total; }`,
    suspect: `function sum(items) { let total = 0; for(let idx=0; idx<items.length; idx++) { total += items[idx]; } return total; }`,
    expected: 'EXACT_MATCH'
  },
  {
    category: 'shadowed variables',
    original: `function test() { let x = 1; if (true) { let x = 2; return x; } return x; }`,
    suspect: `function run() { let a = 1; if (true) { let a = 2; return a; } return a; }`,
    expected: 'EXACT_MATCH'
  },
  {
    category: 'closures',
    original: `function makeAdder(x) { return function(y) { return x + y; }; }`,
    suspect: `function createAdder(a) { return function(b) { return a + b; }; }`,
    expected: 'EXACT_MATCH'
  },
  {
    category: 'recursive functions',
    original: `function fact(n) { if (n <= 1) return 1; return n * fact(n - 1); }`,
    suspect: `function factorial(x) { if (x <= 1) return 1; return x * factorial(x - 1); }`,
    expected: 'EXACT_MATCH'
  },
  {
    category: 'cyclic dependency graphs',
    original: `function ping() { pong(); } function pong() { ping(); }`,
    suspect: `function ping() { pong(); } function pong() { ping(); }`,
    expected: 'ERROR_UNSUPPORTED'
  }
];
