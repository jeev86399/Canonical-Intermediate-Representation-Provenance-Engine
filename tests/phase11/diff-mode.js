const { analyzeSource, compareFragments } = require('../../packages/provenance-pipeline');

function runTest() {
  const baseCode = `
    function calculateTotal(items) {
      let total = 0;
      for (const item of items) {
        total += item.price;
      }
      return total;
    }
  `;

  const s1Code = `
    function calculateTotal(items, discount) {
      let total = 0;
      for (const item of items) {
        total += item.price;
      }
      return total - (discount || 0);
    }
  `;

  const s2Code = baseCode + `
    function calculateTax(total) {
      return total * 0.2;
    }
  `;

  const s3Code = ``;

  const s4Code = `
    const calculateTotal = items => items.reduce((acc, curr) => acc + curr.price, 0);
  `;

  const scenarios = [
    { name: 'Base + minor edit', code: s1Code },
    { name: 'Base + new function', code: s2Code },
    { name: 'Base + removed', code: s3Code },
    { name: 'Base + refactor', code: s4Code }
  ];

  const baseAnalysis = analyzeSource(baseCode);
  let passed = 0;

  for (const s of scenarios) {
    try {
      const sAnalysis = analyzeSource(s.code);
      const comparison = compareFragments(baseAnalysis.fragments, sAnalysis.fragments);
      
      console.log(`\nScenario: ${s.name}`);
      console.log(`Preserved fragments: ${comparison.matched.length}`);
      console.log(`Added fragments: ${comparison.added.length}`);
      console.log(`Removed fragments: ${comparison.removed.length}`);
      passed++;
    } catch (e) {
      console.log(`FAIL in ${s.name}: ${e.message}`);
    }
  }

  if (passed === scenarios.length) {
    console.log('\nDIFF MODE: PASS');
    process.exit(0);
  } else {
    console.log('\nDIFF MODE: FAIL');
    process.exit(1);
  }
}

runTest();
