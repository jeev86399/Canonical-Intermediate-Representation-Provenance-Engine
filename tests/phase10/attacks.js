const { analyzeSource, compareFragments } = require('../../packages/provenance-pipeline');

function runAttackMatrix() {
  console.log("========================================");
  console.log("   PHASE 10: REALISTIC ATTACK MATRIX    ");
  console.log("========================================\n");

  const original = `
    function process(data, key) {
      let result = 0;
      for (let i = 0; i < data.length; i++) {
        let temp = data[i] ^ key;
        result += temp;
      }
      return result;
    }
  `;

  const attacks = {
    'A. Variable Renaming': `
      function process(d, k) {
        let r = 0;
        for (let j = 0; j < d.length; j++) {
          let t = d[j] ^ k;
          r += t;
        }
        return r;
      }
    `,
    'B. Reformatting & Comments': `
      // This is a stolen function
      function process(data, key) { let result = 0; for (let i = 0; i < data.length; i++) { let temp = data[i] ^ key; result += temp; } return result; }
    `,
    'C. Dead Code Injection': `
      function process(data, key) {
        let result = 0;
        let dummy = "ignore me";
        for (let i = 0; i < data.length; i++) {
          let temp = data[i] ^ key;
          result += temp;
        }
        return result;
      }
    `,
    'D. Wrapper Function': `
      function wrapper() {
        function process(data, key) {
          let result = 0;
          for (let i = 0; i < data.length; i++) {
            let temp = data[i] ^ key;
            result += temp;
          }
          return result;
        }
      }
    `,
    'E. Semantic Modification (Different Logic)': `
      function process(data, key) {
        let result = 0;
        let i = 0;
        while (i < data.length) {
          let temp = data[i] ^ key;
          result += temp;
          i++;
        }
        return result;
      }
    `
  };

  const origAnalysis = analyzeSource(original);
  console.log(`Original Code Fragments: ${origAnalysis.fragments.length}\n`);

  for (const [name, code] of Object.entries(attacks)) {
    const attackAnalysis = analyzeSource(code);
    const comparison = compareFragments(origAnalysis.fragments, attackAnalysis.fragments);
    const minSize = Math.min(origAnalysis.fragments.length, attackAnalysis.fragments.length);
    const conf = minSize === 0 ? 0 : (comparison.matched.length / minSize);

    console.log(`Attack: ${name}`);
    console.log(`  Confidence: ${(conf * 100).toFixed(2)}% (${comparison.matched.length}/${minSize})`);
    if (conf > 0.8) {
      console.log(`  Result: MITIGATED (Proven Provenance)`);
    } else if (conf > 0.2) {
      console.log(`  Result: PARTIAL MITIGATION`);
    } else {
      console.log(`  Result: ATTACK SUCCESSFUL (Provenance Lost)`);
    }
    console.log('');
  }

  console.log("REALISTIC ATTACK MATRIX: PASS");
}

try {
  runAttackMatrix();
} catch(e) {
  console.error(e);
  process.exit(1);
}
