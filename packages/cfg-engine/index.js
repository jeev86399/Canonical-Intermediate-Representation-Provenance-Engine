let blockCounter = 0;

class BasicBlock {
  constructor(id = `B${blockCounter++}`) {
    this.id = id;
    this.instructions = [];
    this.successors = [];
    this.predecessors = [];
  }

  addInstruction(irNode) {
    this.instructions.push(irNode);
  }

  addSuccessor(block) {
    if (!this.successors.includes(block)) {
      this.successors.push(block);
      block.predecessors.push(this);
    }
  }
}

/**
 * Generates a Control Flow Graph (CFG) from the Canonical IR.
 * Splitting strictly on branches, loops, and returns.
 */
function generateCFG(canonicalIr) {
  blockCounter = 0;
  const blocks = [];
  
  function createBlock() {
    const block = new BasicBlock();
    blocks.push(block);
    return block;
  }

  const entryBlock = createBlock();
  let currentBlock = entryBlock;
  
  // Stacks for handling break/continue in loops
  const loopBreaks = [];
  const loopContinues = [];

  function buildCfg(node) {
    if (!node) return;

    switch (node.type) {
      case 'Program':
      case 'Block':
        for (const stmt of (node.body || node.statements)) {
          buildCfg(stmt);
          // If the block is unreachable (e.g. after return), stop appending instructions in this block
          if (currentBlock.isTerminated) break;
        }
        break;

      case 'Branch': {
        const conditionBlock = currentBlock;
        conditionBlock.addInstruction({ type: 'Condition', expression: node.condition });
        
        const trueBlock = createBlock();
        const falseBlock = createBlock();
        const mergeBlock = createBlock();

        conditionBlock.addSuccessor(trueBlock);
        conditionBlock.addSuccessor(falseBlock);

        currentBlock = trueBlock;
        buildCfg(node.trueBranch);
        if (!currentBlock.isTerminated) currentBlock.addSuccessor(mergeBlock);

        currentBlock = falseBlock;
        if (node.falseBranch) {
          buildCfg(node.falseBranch);
        }
        if (!currentBlock.isTerminated) currentBlock.addSuccessor(mergeBlock);

        currentBlock = mergeBlock;
        break;
      }

      case 'Loop': {
        if (node.init) buildCfg(node.init);

        const loopTestBlock = createBlock();
        const loopBodyBlock = createBlock();
        const loopEndBlock = createBlock(); // Break target
        
        if (!currentBlock.isTerminated) currentBlock.addSuccessor(loopTestBlock);
        
        currentBlock = loopTestBlock;
        if (node.test) currentBlock.addInstruction({ type: 'Condition', expression: node.test });
        
        currentBlock.addSuccessor(loopBodyBlock);
        currentBlock.addSuccessor(loopEndBlock); // Exit loop

        loopBreaks.push(loopEndBlock);
        loopContinues.push(loopTestBlock);

        currentBlock = loopBodyBlock;
        buildCfg(node.body);
        if (node.update) buildCfg(node.update);
        
        if (!currentBlock.isTerminated) currentBlock.addSuccessor(loopTestBlock); // Back edge

        loopBreaks.pop();
        loopContinues.pop();

        currentBlock = loopEndBlock;
        break;
      }

      case 'Return':
        currentBlock.addInstruction(node);
        currentBlock.isTerminated = true;
        break;
        
      case 'BreakStatement':
        if (loopBreaks.length > 0) {
           currentBlock.addSuccessor(loopBreaks[loopBreaks.length - 1]);
           currentBlock.isTerminated = true;
        }
        break;

      case 'ContinueStatement':
        if (loopContinues.length > 0) {
           currentBlock.addSuccessor(loopContinues[loopContinues.length - 1]);
           currentBlock.isTerminated = true;
        }
        break;

      case 'CanonicalFunction': {
        const fnEntry = createBlock();
        const previousBlock = currentBlock;
        currentBlock = fnEntry;
        
        buildCfg(node.body);
        currentBlock.isTerminated = true; // Implicit return at end of function
        
        currentBlock = previousBlock;
        currentBlock.addInstruction({
          ...node,
          cfgEntry: fnEntry 
        });
        break;
      }

      default:
        currentBlock.addInstruction(node);
        break;
    }
  }

  buildCfg(canonicalIr);

  // Phase 3A: Cycle Detection
  // The MVP boundary explicitly rejects mutually recursive functions and cyclic dependencies
  // because full graph isomorphism is required to hash cyclic structures securely.
  const callGraph = new Map();
  const visitedNode = new Set();
  
  function getFuncName(binding) {
    if (!binding) return 'anonymous';
    return binding.split('/').pop().replace('unresolved:', '');
  }

  function buildCallGraph(node, currentFunc) {
    if (!node || typeof node !== 'object') return;
    if (visitedNode.has(node)) return;
    visitedNode.add(node);
    
    if (node.type === 'CanonicalFunction') {
      const funcName = node.id ? getFuncName(node.id.binding) : 'anonymous';
      if (!callGraph.has(funcName)) callGraph.set(funcName, new Set());
      buildCallGraph(node.body, funcName);
    } else if (node.type === 'Call') {
      if (node.callee && node.callee.type === 'Identifier') {
        const calleeName = getFuncName(node.callee.binding);
        if (!callGraph.has(currentFunc)) callGraph.set(currentFunc, new Set());
        callGraph.get(currentFunc).add(calleeName);
      }
      if (node.args) node.args.forEach(arg => buildCallGraph(arg, currentFunc));
      buildCallGraph(node.callee, currentFunc);
    } else {
      for (const key in node) {
        if (key.startsWith('_') || key === 'cfgEntry' || key === 'reachingDefinitions') continue;
        if (typeof node[key] === 'object') {
          if (Array.isArray(node[key])) {
            node[key].forEach(child => buildCallGraph(child, currentFunc));
          } else {
            buildCallGraph(node[key], currentFunc);
          }
        }
      }
    }
  }

  buildCallGraph(canonicalIr, 'global');

  // DFS to find cycles in callGraph
  const visited = new Set();
  const recursionStack = new Set();

  function detectCycle(nodeName) {
    if (recursionStack.has(nodeName)) {
      console.log('CYCLE DETECTED:', Array.from(recursionStack), '->', nodeName);
      const { UnsupportedSyntaxError } = require('../shared/index');
      throw new UnsupportedSyntaxError("Graph Cycle Not Supported by MVP Boundary", null);
    }
    if (visited.has(nodeName)) return false;
    
    visited.add(nodeName);
    recursionStack.add(nodeName);

    const callees = callGraph.get(nodeName) || new Set();
    for (const callee of callees) {
      if (callee === nodeName) continue; // MVP handles self-recursion fine
      if (detectCycle(callee)) return true;
    }

    recursionStack.delete(nodeName);
    return false;
  }

  for (const funcName of callGraph.keys()) {
    detectCycle(funcName);
  }

  return {
    entry: entryBlock,
    blocks
  };
}

module.exports = {
  generateCFG,
  BasicBlock
};
