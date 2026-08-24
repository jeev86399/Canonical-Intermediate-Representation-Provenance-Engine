const { UnsupportedSyntaxError } = require('../shared/index');

const IR_VERSION = '0.1';

/**
 * Converts an annotated Babel AST into a Canonical IR representation.
 * 
 * @param {Object} ast - The annotated Babel AST.
 * @returns {Object} The canonical IR.
 */
function generateCanonicalIR(ast) {
  // Sort program body nodes to support independent function reordering (Phase 3B)
  const sortedBody = ast.program.body.map(convertNode).sort((a, b) => {
    // Sort functions by their canonical name to make root order-independent
    const aStr = a.type === 'CanonicalFunction' ? (a.id ? a.id.binding : '') : JSON.stringify(a);
    const bStr = b.type === 'CanonicalFunction' ? (b.id ? b.id.binding : '') : JSON.stringify(b);
    return aStr > bStr ? 1 : -1;
  });

  return {
    irVersion: IR_VERSION,
    type: 'Program',
    body: sortedBody
  };
}

function convertNode(node) {
  if (!node) return null;
  // If we already converted it (some nodes share references)
  if (node._canonicalType) return node;

  switch (node.type) {
    case 'VariableDeclaration':
      // Supported Syntax Transformation: Normalize variable-assigned functions to match FunctionDeclaration
      if (node.declarations.length === 1 && 
          node.declarations[0].init && 
          (node.declarations[0].init.type === 'ArrowFunctionExpression' || 
           node.declarations[0].init.type === 'FunctionExpression')) {
        
        const init = node.declarations[0].init;
        return {
          type: 'CanonicalFunction',
          id: convertNode(node.declarations[0].id),
          params: init.params.map(convertNode),
          body: init.body.type === 'BlockStatement' 
            ? convertNode(init.body) 
            : { type: 'Block', statements: [{ type: 'Return', arg: convertNode(init.body) }] }
        };
      }

      return {
        type: 'Declaration',
        // 'kind' is kept, though var/let/const have different hoisting semantics.
        kind: node.kind, 
        declarations: node.declarations.map(decl => ({
          id: convertNode(decl.id),
          init: convertNode(decl.init)
        }))
      };

    case 'Identifier':
      // The crucial step: use the resolved lexical binding, discarding the variable name
      return {
        type: 'Identifier',
        binding: node._canonicalBinding || `unresolved:${node.name}`
      };

    case 'NumericLiteral':
    case 'StringLiteral':
    case 'BooleanLiteral':
    case 'NullLiteral':
      return {
        type: 'Literal',
        value: node.value
      };

    case 'BinaryExpression':
    case 'LogicalExpression': {
      let left = convertNode(node.left);
      let right = convertNode(node.right);
      
      // Strict Commutative Normalization
      const commutativeOps = new Set(['+', '*', '==', '===', '!=', '!==', '&', '|', '^']);
      if (commutativeOps.has(node.operator)) {
        const leftStr = JSON.stringify(left);
        const rightStr = JSON.stringify(right);
        if (leftStr > rightStr) {
          const temp = left;
          left = right;
          right = temp;
        }
      }

      return {
        type: 'BinaryOp',
        operator: node.operator,
        left,
        right
      };
    }

    case 'FunctionDeclaration':
    case 'FunctionExpression':
    case 'ArrowFunctionExpression':
      // Normalize different function forms into a generic CanonicalFunction
      return {
        type: 'CanonicalFunction',
        id: node.id ? convertNode(node.id) : null,
        params: node.params.map(convertNode),
        body: node.body.type === 'BlockStatement' 
          ? convertNode(node.body) 
          : { type: 'Block', statements: [{ type: 'Return', arg: convertNode(node.body) }] } // Arrow short-form
      };

    case 'BlockStatement':
      return {
        type: 'Block',
        statements: node.body.map(convertNode)
      };

    case 'ReturnStatement':
      return {
        type: 'Return',
        arg: convertNode(node.argument)
      };

    case 'IfStatement':
    case 'ConditionalExpression': // Normalize ternaries to branches as well
      return {
        type: 'Branch',
        condition: convertNode(node.test),
        trueBranch: convertNode(node.consequent),
        falseBranch: convertNode(node.alternate)
      };
      
    case 'WhileStatement':
    case 'DoWhileStatement':
    case 'ForStatement':
      // Loop Lowering: Treat all simple loops as a generic Loop construct
      // A full compiler would lower this to CFG blocks with backward edges.
      // Here we just normalize to a canonical Loop node before the CFG generator sees it.
      return {
        type: 'Loop',
        init: node.init ? convertNode(node.init) : null,
        test: node.test ? convertNode(node.test) : null,
        update: node.update ? convertNode(node.update) : null,
        body: convertNode(node.body)
      };

    case 'ExpressionStatement':
      return {
        type: 'ExpressionStmt',
        expression: convertNode(node.expression)
      };
      
    case 'CallExpression':
      return {
        type: 'Call',
        callee: convertNode(node.callee),
        args: node.arguments.map(convertNode)
      };

    case 'AssignmentExpression':
      return {
        type: 'Assign',
        operator: node.operator,
        left: convertNode(node.left),
        right: convertNode(node.right)
      };
      
    case 'ArrayExpression':
      return {
        type: 'Array',
        elements: node.elements.map(convertNode)
      };
      
    case 'ObjectExpression':
      return {
        type: 'Object',
        // Sort keys deterministically to normalize object literals
        properties: node.properties.map(convertNode).sort((a, b) => {
           return (a.key.name || a.key.value) > (b.key.name || b.key.value) ? 1 : -1;
        })
      };

    case 'ObjectProperty':
      return {
        type: 'Property',
        key: convertNode(node.key),
        value: convertNode(node.value)
      };

    case 'MemberExpression':
      return {
        type: 'Member',
        object: convertNode(node.object),
        property: convertNode(node.property)
      };

    case 'UpdateExpression':
    case 'UnaryExpression':
      return {
        type: 'UnaryOp',
        operator: node.operator,
        argument: convertNode(node.argument),
        prefix: node.prefix
      };

    case 'TemplateLiteral':
      return {
        type: 'Template',
        quasis: node.quasis.map(convertNode),
        expressions: node.expressions.map(convertNode)
      };
      
    case 'TemplateElement':
      return {
        type: 'TemplateElement',
        value: node.value.cooked
      };

    case 'BreakStatement':
    case 'ContinueStatement':
      return { type: node.type };

    default:
      throw new UnsupportedSyntaxError(`Node type ${node.type} is not yet supported in the canonical IR converter.`, node);
  }
}

module.exports = {
  generateCanonicalIR,
  IR_VERSION
};
