const assert = require('assert');
const { generateExplanation } = require('../../packages/verification-engine/explanation');

function runTest() {
  console.log('Running False Positive Study (Explanation Verification)...');

  // Case 1: Exact Match
  const receiptExact = {
    result: 'EXACT_MATCH',
    manifest: {
      matchData: {
        matchedFragments: ['f1', 'f2'],
        missingFragments: [],
        addedFragments: [],
        controlFlowRelationships: ['c1'],
        dataFlowRelationships: []
      }
    }
  };
  const expExact = generateExplanation(receiptExact);
  assert.ok(expExact.includes('2 structural fragments matched'));
  assert.ok(expExact.includes('1 control-flow edges matched'));
  assert.ok(!expExact.includes('expected fragments missing'));
  
  // Case 2: False Negative (Missing fragments but should be exact match)
  const receiptPartial = {
    result: 'PARTIAL_MATCH',
    manifest: {
      matchData: {
        matchedFragments: ['f1'],
        missingFragments: ['f2'],
        addedFragments: ['f3'],
        controlFlowRelationships: [],
        dataFlowRelationships: []
      }
    }
  };
  const expPartial = generateExplanation(receiptPartial);
  assert.ok(expPartial.includes('1 structural fragments matched'));
  assert.ok(expPartial.includes('1 expected fragments missing'));
  assert.ok(expPartial.includes('1 unrelated fragments added in target'));

  console.log('✅ False Positive/Negative Explanation Engine Test Passed.');
}

module.exports = runTest;
if (require.main === module) runTest();
