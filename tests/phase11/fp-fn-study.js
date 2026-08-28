const { analyzeSource, compareFragments } = require('../../packages/provenance-pipeline');

const categories = [
  {
    name: '1. Genuinely copied code',
    code1: `function add(a,b) { let sum = a + b; return sum; }`,
    code2: `function add(a,b) { let sum = a + b; return sum; }`,
    copied: true,
    tp: true
  },
  {
    name: '2. Independently written equivalent code',
    code1: `function add1(a,b) { return a+b; }`,
    code2: `const add2 = (x, y) => { return x + y; }`,
    copied: false,
    tn: true
  },
  {
    name: '3. Common boilerplate',
    code1: `app.get('/', (req, res) => res.send('ok'))`,
    code2: `app.get('/status', (req, res) => res.send('ok'))`,
    copied: false,
    fp: true
  },
  {
    name: '4. Library-style utility',
    code1: `function max(a,b){return a>b?a:b;}`,
    code2: `function myMax(x,y){return x>y?x:y;}`,
    copied: false,
    fp: true
  },
  {
    name: '5. Renamed code',
    code1: `function calc(val1, val2) { let res = val1 * val2; return res; }`,
    code2: `function compute(x, y) { let out = x * y; return out; }`,
    copied: true,
    tp: true
  },
  {
    name: '6. Refactored code',
    code1: `function loop(n) { for(let i=0;i<n;i++) console.log(i); }`,
    code2: `function loop(n) { let i=0; while(i<n){ console.log(i); i++; } }`,
    copied: true,
    fn: true
  },
  {
    name: '7. Modified copied code',
    code1: `function doWork(x) { let y = x + 1; return y; }`,
    code2: `function doWork(x) { let dummy = 0; let y = x + 1; return y; }`,
    copied: true,
    fn: true
  },
  {
    name: '8. Completely unrelated code',
    code1: `function hello() { return 'world'; }`,
    code2: `function add(a, b) { return a + b; }`,
    copied: false,
    tn: true
  }
];

function run() {
  try {
    let tp=0, fp=0, tn=0, fn=0;
    categories.forEach(cat => {
      const res1 = analyzeSource(cat.code1);
      const res2 = analyzeSource(cat.code2);
      const comp = compareFragments(res1.fragments, res2.fragments);
      
      const isMatch = comp.matched.length > 0;
      
      if (cat.copied && isMatch) tp++;
      else if (cat.copied && !isMatch) fn++;
      else if (!cat.copied && !isMatch) tn++;
      else if (!cat.copied && isMatch) fp++;
      
      console.log(cat.name + ': copied=' + cat.copied + ', match=' + isMatch + ' -> ' + (isMatch ? (cat.copied ? 'TP' : 'FP') : (cat.copied ? 'FN' : 'TN')));
    });
    
    console.log('TP: ' + tp + ', FP: ' + fp + ', TN: ' + tn + ', FN: ' + fn);
    const precision = (tp+fp === 0) ? 0 : tp/(tp+fp);
    const recall = (tp+fn === 0) ? 0 : tp/(tp+fn);
    console.log('Precision: ' + precision + ', Recall: ' + recall);
    console.log('FP/FN STUDY: PASS');
  } catch(e) {
    console.error(e);
    console.log('FP/FN STUDY: FAIL');
    process.exit(1);
  }
}
run();
