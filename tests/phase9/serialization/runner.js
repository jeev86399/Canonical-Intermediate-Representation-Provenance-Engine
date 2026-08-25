const fs = require('fs');
const path = require('path');
const { runWLCDH } = require('../engine');

function testSerialization() {
  console.log("Running Serialization Ambiguity Tests...");
  
  // 1. Key Ordering
  const cfg1 = { blocks: [ { instructions: { type: "Call", callee: "foo", args: [] }, predecessors: [] } ] };
  const cfg2 = { blocks: [ { instructions: { args: [], callee: "foo", type: "Call" }, predecessors: [] } ] };
  
  const res1 = runWLCDH(cfg1, 0);
  const res2 = runWLCDH(cfg2, 0);
  
  if (res1.globalHash !== res2.globalHash) throw new Error("Key ordering serialization failed!");
  
  // 2. Empty Arrays vs Null
  // The parser guarantees array for args, but we must ensure we don't treat [] the same as undefined if semantically different.
  const cfg3 = { blocks: [ { instructions: { type: "Call", args: [] }, predecessors: [] } ] };
  const cfg4 = { blocks: [ { instructions: { type: "Call" }, predecessors: [] } ] };
  
  const res3 = runWLCDH(cfg3, 0);
  const res4 = runWLCDH(cfg4, 0);
  
  if (res3.globalHash === res4.globalHash) throw new Error("Ambiguity between [] and undefined!");

  // 3. String escaping
  const cfg5 = { blocks: [ { instructions: { type: "Literal", value: "hello\nworld" }, predecessors: [] } ] };
  const cfg6 = { blocks: [ { instructions: { type: "Literal", value: "hello\\nworld" }, predecessors: [] } ] };
  
  const res5 = runWLCDH(cfg5, 0);
  const res6 = runWLCDH(cfg6, 0);
  
  if (res5.globalHash === res6.globalHash) throw new Error("String escape ambiguity!");

  console.log("Serialization tests passed. Output is unambiguous.");
}

try {
  testSerialization();
} catch (e) {
  console.error(e.message);
  process.exit(1);
}
