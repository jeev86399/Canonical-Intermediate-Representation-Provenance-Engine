const { sha256, deterministicStringify } = require('../fingerprint-engine/index');

/**
 * Extracts independent logical fragments from the enriched Dataflow/CFG graph.
 * 
 * @param {Object} dataflowGraph - The CFG annotated with reaching definitions.
 * @returns {Array} An array of unhashed Fragment objects.
 */
function extractFragments(dataflowGraph) {
  const fragments = [];

  // Step 0: Assign deterministic block IDs based on content to achieve true order-independence
  for (const block of dataflowGraph.blocks) {
    const sanitizedInsts = block.instructions.map(inst => sanitizeForHashing(inst));
    block._contentHash = sha256(deterministicStringify(sanitizedInsts));
    // Fallback counter in case of identical blocks in different contexts to prevent edge collapse?
    // Actually, graph structural matching thrives on identical blocks having identical IDs.
    block.canonicalId = block._contentHash; 
  }

  // 1. Extract Block Fragments (The content nodes)
  for (const block of dataflowGraph.blocks) {
    fragments.push({
      type: 'BlockFragment',
      blockId: block.canonicalId,
      instructions: block.instructions.map(inst => sanitizeForHashing(inst))
    });

    // 2. Extract Control Edge Fragments
    for (const succ of block.successors) {
      fragments.push({
        type: 'ControlEdgeFragment',
        sourceId: block.canonicalId,
        targetId: succ.canonicalId
      });
    }
  }

  // 3. Extract Data Dependency Edge Fragments
  // By scanning the sanitized instructions (or original) for reachingDefinitions
  for (const block of dataflowGraph.blocks) {
    function findDefUses(node) {
      if (!node) return;
      if (node.type === 'Identifier' && node.reachingDefinitions) {
        for (const def of node.reachingDefinitions) {
           fragments.push({
             type: 'DataEdgeFragment',
             sourceId: def._df_block.canonicalId, // Where it was defined
             targetId: block.canonicalId,         // Where it is used
             binding: node.binding                // What variable ties them
           });
        }
      } else {
        for (const key in node) {
          if (key.startsWith('_') || key === 'reachingDefinitions' || key === 'cfgEntry') continue;
          if (typeof node[key] === 'object') {
            if (Array.isArray(node[key])) {
              node[key].forEach(findDefUses);
            } else {
              findDefUses(node[key]);
            }
          }
        }
      }
    }

    block.instructions.forEach(findDefUses);
  }

  return fragments;
}

/**
 * Strips circular runtime metadata from Canonical IR nodes so they can be hashed.
 */
function sanitizeForHashing(node) {
  if (!node) return null;
  if (typeof node !== 'object') return node;

  if (Array.isArray(node)) {
    return node.map(sanitizeForHashing);
  }

  const sanitized = {};
  for (const key in node) {
    if (
      key === 'reachingDefinitions' || 
      key === '_df_block' || 
      key === '_df_binding' ||
      key === '_lexicalEnv' ||
      key === 'cfgEntry'
    ) {
      continue;
    }
    sanitized[key] = sanitizeForHashing(node[key]);
  }
  return sanitized;
}

module.exports = {
  extractFragments
};
