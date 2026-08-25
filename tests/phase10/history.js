const path = require('path');
const { getCommitHistory, getFileAtCommit } = require('../../packages/git-engine');
const { analyzeSource } = require('../../packages/provenance-pipeline');

function runHistoryTest() {
  console.log("========================================");
  console.log("   PHASE 10: MULTI-COMMIT HISTORY       ");
  console.log("========================================");

  const repoPath = path.join(__dirname, 'dummy-repo');
  const history = getCommitHistory(repoPath).reverse(); // oldest to newest

  const globalFragmentIndex = new Map(); // fragmentHash -> { firstSeenCommit, firstSeenFile }

  for (let i = 0; i < history.length; i++) {
    const commit = history[i];
    console.log(`\nCommit [${i+1}/${history.length}]: ${commit}`);
    
    // In a real repo we would git ls-tree to find all JS files. 
    // Here we just track math.js.
    const file = 'math.js';
    const source = getFileAtCommit(repoPath, commit, file);
    
    if (!source) continue;

    const analysis = analyzeSource(source);
    
    let addedInThisCommit = 0;
    let preservedFromPast = 0;

    for (const frag of analysis.fragments) {
      if (globalFragmentIndex.has(frag)) {
        preservedFromPast++;
      } else {
        addedInThisCommit++;
        globalFragmentIndex.set(frag, { firstSeenCommit: commit, firstSeenFile: file });
      }
    }

    console.log(`  Canonical Fingerprint: ${analysis.fingerprint || 'null'}`);
    console.log(`  Total Fragments: ${analysis.fragments.length}`);
    console.log(`  Newly Added:     ${addedInThisCommit}`);
    console.log(`  Preserved:       ${preservedFromPast}`);
  }

  // Answer the question: "Which logical fragments existed in earlier commits and where do they appear later?"
  console.log(`\nTotal unique structural fragments discovered across history: ${globalFragmentIndex.size}`);
  
  if (globalFragmentIndex.size > 0) {
    console.log("MULTI-COMMIT HISTORY: PASS");
  } else {
    console.log("MULTI-COMMIT HISTORY: FAIL");
    process.exit(1);
  }
}

try {
  runHistoryTest();
} catch (e) {
  console.error(e.message);
  process.exit(1);
}
