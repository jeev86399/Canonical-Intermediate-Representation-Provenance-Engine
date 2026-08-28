const { analyzeSource } = require('./packages/provenance-pipeline');
console.log("Analyzing...");
const res = analyzeSource("function f(x, y) { if (x > y) return x; else return y; }");
console.log(res);
