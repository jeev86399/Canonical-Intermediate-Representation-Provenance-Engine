# Phase 7: Canonicalization Soundness Audit

To ensure the canonical IR preserves functional logic without over-normalizing, we formally evaluated the supported transformations.

| SOURCE FORM | CANONICAL FORM | WHY EQUIVALENT | ASSUMPTIONS | KNOWN COUNTEREXAMPLES |
|-------------|----------------|----------------|-------------|-----------------------|
| \`function foo() {}\` | \`const fn = () => {}\` | Both produce identical callable objects within local scope. | \`this\` binding is irrelevant (WLCDH does not model \`this\` dynamics). | \`foo.prototype\` constructor usage (rejected by parser). |
| \`for(let i=0; i<x; i++)\` | \`let i=0; while(i<x) { ... i++ }\` | Identical control-flow jumps and identical dataflow mutations. | Iterator scope is bounded identically. | Block-scoped \`const\` inside loop body requires specific variable versioning. |
| \`x + y\` | \`y + x\` | Addition is commutative in JS unless strings are involved. | Variables contain numbers. | String concatenation (\`'a' + 'b' !== 'b' + 'a'\`). Currently engine treats \`+\` commutatively globally, leading to potential FP on string operations. |
| \`if(a) { x } else { y }\` | \`if(a) { x } else { y }\` | Unmodified. | None. | Engine does NOT normalize \`if(!a) { y } else { x }\`. They are treated as distinct AST nodes (\`UnaryExpression\` vs absent). |
| \`let a = 1; let b = 2;\` | \`const a = 1; const b = 2;\` (where unmutated) | SSA canonicalization standardizes single assignments. | Variables are not dynamically evaluated via \`eval\`. | Mutated variables maintain \`let\` semantics internally. |

## Audit Conclusion
The Canonicalization engine is safe for the restricted subset of JavaScript it processes. 
**Required Fix for Production**: The commutative sorting of the \`+\` operator must be restricted if static typing cannot guarantee numeric operands, otherwise \`'a' + 'b'\` and \`'b' + 'a'\` will collide.
