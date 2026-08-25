const path = require('path');
const { getCommitHistory, getFileAtCommit, getParentCommit, getChangedFiles } = require('../../packages/git-engine');
const { compareSources } = require('../../packages/provenance-pipeline');

function runBeforeAfterTest() {
  console.log("========================================");
  console.log("   PHASE 10: BEFORE/AFTER PROVENANCE    ");
  console.log("========================================");

  const repoPath = path.join(__dirname, 'dummy-repo');
  const history = getCommitHistory(repoPath);

  if (history.length < 2) {
    throw new Error("Dummy repo requires at least 2 commits.");
  }

  const latestCommit = history[0];
  const parentCommit = getParentCommit(repoPath, latestCommit);

  console.log(`Comparing Commit: ${latestCommit}`);
  console.log(`Against Parent:   ${parentCommit}\n`);

  const changedFiles = getChangedFiles(repoPath, latestCommit).filter(f => f.file.endsWith('.js'));
  
  let allPass = true;

  for (const {status, file} of changedFiles) {
    console.log(`File: ${file} [${status}]`);
    
    const oldSource = status === 'A' ? '' : getFileAtCommit(repoPath, parentCommit, file);
    const newSource = status === 'D' ? '' : getFileAtCommit(repoPath, latestCommit, file);

    const evidence = compareSources(oldSource, newSource);
    
    console.log(`  Verification: ${evidence.verificationResult}`);
    console.log(`  Matched Fragments: ${evidence.matchedFragments.length}`);
    console.log(`  Added Fragments:   ${evidence.addedFragments.length}`);
    console.log(`  Removed Fragments: ${evidence.removedFragments.length}\n`);

    if (evidence.verificationResult === "INVALID_SOURCE" && status !== 'D') {
      allPass = false;
    }
  }

  if (allPass) {
    console.log("BEFORE/AFTER PROVENANCE: PASS");
  } else {
    console.log("BEFORE/AFTER PROVENANCE: FAIL");
    process.exit(1);
  }
}

try {
  runBeforeAfterTest();
} catch (e) {
  console.error(e.message);
  process.exit(1);
}
