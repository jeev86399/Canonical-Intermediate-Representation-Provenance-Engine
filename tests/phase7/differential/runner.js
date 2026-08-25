const fs = require('fs');
const path = require('path');
const { generateWLCDHFingerprint } = require('../../phase6/engine.js');
const parser = require('../../../packages/parser/index.js');
const scopeEngine = require('../../../packages/scope-engine/index.js');
const canonicalIr = require('../../../packages/canonical-ir/index.js');
const cfgEngine = require('../../../packages/cfg-engine/index.js');
const dataflowEngine = require('../../../packages/dataflow-engine/index.js');

function processCode(code) {
    try {
        const ast = parser.parse(code);
        const scopedAst = scopeEngine.analyze(ast);
        const canonAst = canonicalIr.transform(scopedAst);
        const cfg = cfgEngine.generate(canonAst);
        const dfg = dataflowEngine.analyze(cfg);
        const fp = generateWLCDHFingerprint(dfg);
        return Array.from(fp.values()).sort().join(',');
    } catch (e) {
        return 'ERROR: ' + e.message;
    }
}

const tests = [
    {
        name: 'Variable Renaming',
        codeA: 'function f() { let x = 1; return x; }',
        codeB: 'function f() { let y = 1; return y; }',
        expected: 'EQUIVALENT'
    },
    {
        name: 'Function Renaming',
        codeA: 'function foo() { return 2; }',
        codeB: 'function bar() { return 2; }',
        expected: 'EQUIVALENT'
    },
    {
        name: 'Independent Function Reordering',
        codeA: 'function a() { return 1; } function b() { return 2; }',
        codeB: 'function b() { return 2; } function a() { return 1; }',
        expected: 'EQUIVALENT'
    },
    {
        name: 'Expression Operand Reordering (Commutative)',
        codeA: 'function f() { return 1 + 2; }',
        codeB: 'function f() { return 2 + 1; }',
        expected: 'EQUIVALENT'
    },
    {
        name: 'Supported Syntax Normalization (Arrow vs Declaration)',
        codeA: 'function f() { return 1; }',
        codeB: 'const f = () => { return 1; }',
        expected: 'EQUIVALENT'
    },
    {
        name: 'Literal Changes',
        codeA: 'function f() { return 1; }',
        codeB: 'function f() { return 2; }',
        expected: 'DIFFERENT'
    },
    {
        name: 'Operator Changes',
        codeA: 'function f() { return 1 + 2; }',
        codeB: 'function f() { return 1 - 2; }',
        expected: 'DIFFERENT'
    },
    {
        name: 'Control Flow Restructuring',
        codeA: 'function f(x) { if(x) { return 1; } else { return 2; } }',
        codeB: 'function f(x) { if(!x) { return 2; } else { return 1; } }',
        expected: 'EQUIVALENT' // actually our engine doesn't normalize if(!x) so it will be DIFFERENT. Let's see what it outputs.
    }
];

let md = '# Phase 7: Differential Testing Report\n\n';
md += '| Transformation | Expected | Actual Result | Pass/Fail |\n';
md += '|----------------|----------|---------------|-----------|\n';

tests.forEach(t => {
    const resA = processCode(t.codeA);
    const resB = processCode(t.codeB);
    const actual = (resA === resB) ? 'EQUIVALENT' : 'DIFFERENT';
    const pass = (actual === t.expected) ? 'PASS' : 'FAIL';
    md += `| ${t.name} | ${t.expected} | ${actual} | ${pass} |\n`;
});

const dir = path.join(__dirname, '../../../docs/experiments/phase7');
if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
fs.writeFileSync(path.join(dir, 'differential-report.md'), md);
console.log('Differential testing complete.');
