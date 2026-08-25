const crypto = require('crypto');

function sha256(str) {
  return crypto.createHash('sha256').update(str).digest('hex');
}

/**
 * Erase all variable bindings and internal dataflow markers for pure structural stringification.
 */
function scrubIdentifiers(node) {
  if (!node) return node;
  if (Array.isArray(node)) return node.map(scrubIdentifiers);
  if (typeof node === 'object') {
    const clean = {};
    const keys = Object.keys(node).sort();
    for (const key of keys) {
      if (key === 'binding' || key === 'reachingDefinitions' || key.startsWith('_') || key === 'cfgEntry') continue;
      clean[key] = scrubIdentifiers(node[key]);
    }
    return clean;
  }
  return node;
}

/**
 * Weisfeiler-Lehman Contextual Dataflow Hashing (WLCDH)
 */
function runWLCDH(cfg, K = 2) {
  const blocks = cfg.blocks;
  
  // Initialize S0
  for (const block of blocks) {
    const cleanInstructions = scrubIdentifiers(block.instructions);
    block.signatures = [ sha256(JSON.stringify(cleanInstructions)) ];
    
    // Discover incoming dataflow edges for this block by inspecting all uses
    block.incomingDataflowBlocks = new Set();
    
    function extractDataflow(node) {
      if (!node) return;
      if (Array.isArray(node)) { node.forEach(extractDataflow); return; }
      if (typeof node === 'object') {
        if (node.reachingDefinitions) {
          for (const def of node.reachingDefinitions) {
            if (def._df_block) block.incomingDataflowBlocks.add(def._df_block);
          }
        }
        for (const key in node) {
          if (key === 'cfgEntry' || key.startsWith('_')) continue;
          extractDataflow(node[key]);
        }
      }
    }
    extractDataflow(block.instructions);
  }

  // Iterative Contextual Aggregation
  for (let k = 1; k <= K; k++) {
    for (const block of blocks) {
      const Din = Array.from(block.incomingDataflowBlocks)
        .map(b => b.signatures[k-1])
        .sort();
      
      const Cin = block.predecessors
        .map(b => b.signatures[k-1])
        .sort();
      
      const payload = block.signatures[k-1] + '|D:' + Din.join(',') + '|C:' + Cin.join(',');
      block.signatures.push(sha256(payload));
    }
  }

  // Collect final fragment set (S^K)
  const finalHashes = blocks.map(b => b.signatures[K]).sort();
  
  return {
    rawHashes: finalHashes,
    globalHash: sha256(finalHashes.join(''))
  };
}

/**
 * Compare two WLCDH fingerprints for partial provenance.
 */
function verifyWLCDH(fingerprintA, fingerprintB) {
  const setA = new Set(fingerprintA.rawHashes);
  const setB = new Set(fingerprintB.rawHashes);
  
  let intersection = 0;
  for (const hash of setA) {
    if (setB.has(hash)) intersection++;
  }
  
  const minSize = Math.min(setA.size, setB.size);
  const confidence = minSize === 0 ? 0 : (intersection / minSize);
  
  let status = 'NO_MATCH';
  if (confidence === 1.0) status = 'EXACT_MATCH';
  else if (confidence > 0.1 || intersection > 5) status = 'PARTIAL_MATCH';
  
  return {
    status,
    confidence,
    matched: intersection,
    totalA: setA.size,
    totalB: setB.size
  };
}

module.exports = {
  runWLCDH,
  verifyWLCDH
};
