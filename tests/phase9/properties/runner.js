const { runWLCDH } = require('../engine');

function testProperties() {
  console.log("Running Property-Based Tests...");

  // We define property invariants that must hold true.

  // PROPERTY 1: Identical source -> identical fingerprint
  const b1 = { instructions: { type: "CallExpression" }, predecessors: [] };
  const p1a = runWLCDH({ blocks: [b1] }, 1);
  const p1b = runWLCDH({ blocks: [{ instructions: { type: "CallExpression" }, predecessors: [] }] }, 1);
  if (p1a.globalHash !== p1b.globalHash) throw new Error("Property 1 Failed");

  // PROPERTY 4: Meaningful dependency modification -> different fingerprint
  const b2 = { instructions: { type: "BinaryExpression", operator: "+", left: {}, right: {} }, predecessors: [] };
  // P4a: Left depends on nothing
  const p4a = runWLCDH({ blocks: [b2] }, 1);
  // P4b: Left depends on a previous block
  const b3 = { instructions: { type: "BinaryExpression", operator: "+", left: { reachingDefinitions: [{_df_block: {signatures:['hashA']}}] }, right: {} }, predecessors: [] };
  const p4b = runWLCDH({ blocks: [b3] }, 1);
  if (p4a.globalHash === p4b.globalHash) throw new Error("Property 4 Failed");

  // PROPERTY 5: Meaningful control-flow modification -> different fingerprint
  const b4 = { instructions: { type: "ReturnStatement" }, predecessors: [] };
  const p5a = runWLCDH({ blocks: [b4] }, 1);
  const b5 = { instructions: { type: "ReturnStatement" }, predecessors: [{signatures:['hashA']}] };
  const p5b = runWLCDH({ blocks: [b5] }, 1);
  if (p5a.globalHash === p5b.globalHash) throw new Error("Property 5 Failed");

  console.log("All topological invariants hold.");
}

try {
  testProperties();
} catch (e) {
  console.error(e.message);
  process.exit(1);
}
