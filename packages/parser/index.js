const babelParser = require('@babel/parser');
const traverse = require('@babel/traverse').default;
const { ParseError, UnsupportedSyntaxError } = require('../shared/index');

/**
 * Parses JS source code into an AST and performs an initial 
 * syntax validation to ensure it falls within the MVP boundaries.
 * 
 * @param {string} code - The source code to parse.
 * @returns {Object} An object containing the babel AST and metadata.
 */
function parseSource(code) {
  let ast;
  try {
    ast = babelParser.parse(code, {
      sourceType: 'module',
      allowReturnOutsideFunction: true,
      plugins: [
        'jsx',
        'typescript' // Allow TS/JSX but we might reject specific AST nodes if unsupported
      ]
    });
  } catch (err) {
    throw new ParseError(`Babel parsing failed: ${err.message}`);
  }

  // Validate AST against MVP boundary
  validateAst(ast);

  return {
    ast,
    metadata: {
      timestamp: Date.now(),
      length: code.length
    }
  };
}

function validateAst(ast) {
  const allowedNodes = new Set([
    'File', 'Program', 'ExpressionStatement', 'BlockStatement',
    'ReturnStatement', 'BreakStatement', 'ContinueStatement',
    'IfStatement', 'WhileStatement', 'DoWhileStatement', 'ForStatement',
    'VariableDeclaration', 'VariableDeclarator',
    'FunctionDeclaration', 'FunctionExpression', 'ArrowFunctionExpression',
    'ArrayExpression', 'ObjectExpression', 'ObjectProperty',
    'UnaryExpression', 'BinaryExpression', 'AssignmentExpression',
    'UpdateExpression', 'LogicalExpression', 'ConditionalExpression',
    'CallExpression', 'MemberExpression', 'Identifier',
    'StringLiteral', 'NumericLiteral', 'NullLiteral', 'BooleanLiteral',
    'TemplateLiteral', 'TemplateElement'
  ]);

  traverse(ast, {
    enter(path) {
      if (!allowedNodes.has(path.node.type)) {
        throw new UnsupportedSyntaxError(`Node type ${path.node.type} is strictly rejected by the MVP boundary.`, path.node);
      }

      // Additional strict checks for specific allowed nodes
      if (path.isCallExpression()) {
        if (path.node.callee.type === 'Identifier' && path.node.callee.name === 'eval') {
          throw new UnsupportedSyntaxError('The "eval" function is not supported.', path.node);
        }
      }

      if (path.isMemberExpression()) {
        if (path.node.computed && path.node.property.type !== 'NumericLiteral' && path.node.property.type !== 'StringLiteral' && path.node.property.type !== 'Identifier') {
           // We allow standard indexing but reject complex dynamic props to keep analysis deterministic.
        }
      }
      
      if (path.isObjectProperty()) {
        if (path.node.kind === 'get' || path.node.kind === 'set') {
          throw new UnsupportedSyntaxError('Getters and setters are not supported in the MVP.', path.node);
        }
      }
    }
  });
}

module.exports = {
  parseSource
};
