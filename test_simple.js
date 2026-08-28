const { analyzeSource } = require('./packages/provenance-pipeline');
console.log("Analyzing...");
const res = analyzeSource("function foo(a) { return a; }");
console.log(res);
