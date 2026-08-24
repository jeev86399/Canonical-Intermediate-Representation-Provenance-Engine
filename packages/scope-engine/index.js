const traverse = require('@babel/traverse').default;

class LexicalEnvironment {
  constructor(parent = null) {
    this.parent = parent;
    this.depth = parent ? parent.depth + 1 : 0;
    this.bindings = new Map();
    this.bindingCounter = 0;
  }

  declare(name) {
    if (!this.bindings.has(name)) {
      this.bindings.set(name, `d:${this.depth}/b:${this.bindingCounter++}`);
    }
  }

  resolve(name) {
    if (this.bindings.has(name)) {
      return this.bindings.get(name);
    }
    if (this.parent) {
      return this.parent.resolve(name);
    }
    return `unresolved:${name}`;
  }
}

/**
 * Analyzes the AST and computes a deterministic scope and binding graph.
 * Annotates Identifier nodes in the AST with canonical identities using a strict LexicalEnvironment stack.
 * 
 * @param {Object} ast - The babel AST.
 * @returns {Object} The annotated AST and scope metadata.
 */
function analyzeScope(ast) {
  let currentEnv = new LexicalEnvironment();

  traverse(ast, {
    enter(path) {
      const createsScope = 
        path.isProgram() ||
        path.isFunction() || 
        path.isBlockStatement() || 
        path.isCatchClause() || 
        path.isForStatement() || 
        path.isWhileStatement();

      if (createsScope) {
        currentEnv = new LexicalEnvironment(currentEnv);
        path.node._lexicalEnv = currentEnv;

        // Hoist function and var declarations within this block/program
        const body = path.node.body || (path.node.block && path.node.block.body);
        if (Array.isArray(body)) {
          body.forEach(stmt => {
            if (stmt.type === 'FunctionDeclaration' && stmt.id) {
              currentEnv.declare(stmt.id.name);
            } else if (stmt.type === 'VariableDeclaration' && stmt.kind === 'var') {
              stmt.declarations.forEach(decl => {
                if (decl.id.type === 'Identifier') currentEnv.declare(decl.id.name);
              });
            }
          });
        }
      }

      // Handle block-scoped let/const declarations (not hoisted)
      if (path.isVariableDeclarator()) {
        if (path.parent.kind !== 'var' && path.node.id.type === 'Identifier') {
          currentEnv.declare(path.node.id.name);
        }
      } else if (path.isFunctionDeclaration()) {
        // Function name is already hoisted
        // Params belong to inner scope (currentEnv because we pushed above)
        path.node.params.forEach(param => {
          if (param.type === 'Identifier') currentEnv.declare(param.name);
        });
      } else if (path.isArrowFunctionExpression() || path.isFunctionExpression()) {
        path.node.params.forEach(param => {
          if (param.type === 'Identifier') currentEnv.declare(param.name);
        });
      }
    },
    
    exit(path) {
      // Resolve identifiers on the way out to ensure declarations are processed
      if (path.isIdentifier()) {
        // Skip identifiers that are properties of a MemberExpression (e.g., obj.prop)
        if (path.parentPath.isMemberExpression() && path.parentPath.node.property === path.node && !path.parentPath.node.computed) {
          return;
        }
        // Skip identifiers that are keys in an object literal
        if (path.parentPath.isObjectProperty() && path.parentPath.node.key === path.node && !path.parentPath.node.computed) {
          return;
        }

        path.node._canonicalBinding = currentEnv.resolve(path.node.name);
      }

      if (path.node._lexicalEnv === currentEnv) {
        currentEnv = currentEnv.parent;
      }
    }
  });

  return { ast };
}

module.exports = {
  analyzeScope,
  LexicalEnvironment
};
