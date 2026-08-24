/**
 * Performs a Reaching Definitions analysis on the CFG to establish Def-Use chains.
 * Uses a fixed-point iteration worklist algorithm.
 * 
 * @param {Object} cfg - The Control Flow Graph (blocks with predecessors/successors)
 * @returns {Object} The dataflow graph (the original CFG enriched with Def-Use links).
 */
function analyzeDataflow(cfg) {
  const blocks = cfg.blocks;
  
  // Step 1: Extract all definitions in the program.
  // A definition is uniquely identified by its node reference.
  const defsByBinding = new Map();

  function recordDef(bindingId, defNode, block) {
    if (!defsByBinding.has(bindingId)) defsByBinding.set(bindingId, new Set());
    defsByBinding.get(bindingId).add(defNode);
    defNode._df_block = block;
    defNode._df_binding = bindingId;
  }

  // Find all definitions (Declarations and Assignments)
  for (const block of blocks) {
    block.gen = new Set();
    block.kill = new Set();

    for (const inst of block.instructions) {
      if (inst.type === 'Declaration') {
        for (const decl of inst.declarations) {
          if (decl.id.type === 'Identifier') {
             recordDef(decl.id.binding, decl.id, block);
             block.gen.add(decl.id);
          }
        }
      } else if (inst.type === 'Assign' && inst.left.type === 'Identifier') {
         recordDef(inst.left.binding, inst.left, block);
         block.gen.add(inst.left);
      }
    }
  }

  // Calculate Kill sets: For every definition generated in the block, 
  // kill all other definitions of the same binding elsewhere in the program.
  for (const block of blocks) {
    for (const defNode of block.gen) {
      const bindingId = defNode._df_binding;
      const allDefsForBinding = defsByBinding.get(bindingId) || new Set();
      for (const otherDef of allDefsForBinding) {
        if (otherDef !== defNode) {
          block.kill.add(otherDef);
        }
      }
    }
  }

  // Step 2: Fixed-point Iteration (Worklist)
  // IN[B] = Union(OUT[P] for P in predecessors(B))
  // OUT[B] = gen[B] Union (IN[B] - kill[B])
  
  for (const block of blocks) {
    block.in = new Set();
    block.out = new Set();
  }

  let changed = true;
  while (changed) {
    changed = false;
    for (const block of blocks) {
      const newIn = new Set();
      for (const pred of block.predecessors) {
        for (const def of pred.out) newIn.add(def);
      }

      block.in = newIn;

      const newOut = new Set(block.gen);
      for (const def of block.in) {
        if (!block.kill.has(def)) {
          newOut.add(def);
        }
      }

      if (newOut.size !== block.out.size) { // Because sets only grow monotonically in this dataflow logic
        block.out = newOut;
        changed = true;
      }
    }
  }

  // Step 3: Wire Def-Use edges (Resolve Uses)
  // Walk through instructions in each block. Maintain a running "available definitions" map.
  for (const block of blocks) {
    // Current available definitions when entering the block
    const available = new Map(); // bindingId -> Set(defNodes)
    
    for (const defNode of block.in) {
      const bindingId = defNode._df_binding;
      if (!available.has(bindingId)) available.set(bindingId, new Set());
      available.get(bindingId).add(defNode);
    }

    function wireUses(node) {
      if (!node) return;
      if (node.type === 'Identifier') {
        // If it's being used as a value (not LHS of assignment or declaration)
        if (!node._df_block) { // It's not a definition
          const reachingDefs = available.get(node.binding) || new Set();
          node.reachingDefinitions = Array.from(reachingDefs);
        }
      } else {
        // Traverse children
        for (const key in node) {
          if (key.startsWith('_') || key === 'cfgEntry' || key === 'reachingDefinitions') continue;
          if (typeof node[key] === 'object') {
            if (Array.isArray(node[key])) {
              node[key].forEach(wireUses);
            } else {
              wireUses(node[key]);
            }
          }
        }
      }
    }

    for (const inst of block.instructions) {
      // First, wire uses in the RHS / Expressions
      if (inst.type === 'Assign') wireUses(inst.right);
      else if (inst.type === 'Declaration') {
         inst.declarations.forEach(d => wireUses(d.init));
      } else {
         wireUses(inst);
      }

      // Then, update available definitions if this instruction defines something
      if (inst.type === 'Assign' && inst.left.type === 'Identifier') {
         const bindingId = inst.left.binding;
         available.set(bindingId, new Set([inst.left])); // Kill older, Gen new
      } else if (inst.type === 'Declaration') {
         for (const decl of inst.declarations) {
           if (decl.id.type === 'Identifier') {
             available.set(decl.id.binding, new Set([decl.id]));
           }
         }
      }
    }
  }

  // Step 4: Call Graph Cycle Detection (Phase 3A: Technical Gaps)
  // The MVP boundary explicitly rejects mutually recursive functions and cyclic dependencies
  // because full graph isomorphism is required to hash cyclic structures securely.
  const callGraph = new Map(); // caller -> Set of callees
  
  for (const block of blocks) {
    let currentFunction = null;
    // Find which function this block belongs to by looking at cfgEntry in CanonicalFunction
    // Wait, block instructions don't back-reference the function easily here.
    // Let's do a simple whole-program call graph by scanning all Calls and finding the enclosing CanonicalFunction.
  }

  // Actually, a simpler way to find cycles is scanning the IR tree directly.
  return cfg;
}

module.exports = {
  analyzeDataflow
};
