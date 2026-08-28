#!/usr/bin/env node

const path = require('path');
const fs = require('fs');
const gitEngine = require('../packages/git-engine');
const provenancePipeline = require('../packages/provenance-pipeline');

function run() {
  const repoPath = process.argv[2] || process.cwd();
  
  try {
    const history = gitEngine.getCommitHistory(repoPath);
    if (history.length < 1) {
      console.log('FAIL: No commit history found.');
      process.exit(1);
    }
    
    const latestCommit = history[0];
    const parentCommit = gitEngine.getParentCommit(repoPath, latestCommit) || (history.length > 1 ? history[1] : null);
    
    if (!parentCommit) {
      console.log('WARNING: No parent commit found. Cannot compare.');
      process.exit(0);
    }
    
    const changedFiles = gitEngine.getChangedFiles(repoPath, latestCommit);
    const jsFiles = changedFiles.filter(f => f.file.endsWith('.js'));
    
    let allPass = true;
    let hasWarning = false;
    let reviewRequired = false;
    let fail = false;
    
    const report = [];
    
    for (const f of jsFiles) {
      const oldSource = gitEngine.getFileAtCommit(repoPath, parentCommit, f.file) || '';
      const newSource = gitEngine.getFileAtCommit(repoPath, latestCommit, f.file) || '';
      
      const oldAnalysis = provenancePipeline.analyzeSource(oldSource);
      const newAnalysis = provenancePipeline.analyzeSource(newSource);
      
      let evidence = null;
      
      if ((oldAnalysis.error && oldSource) || (newAnalysis.error && newSource)) {
        console.error('FAIL flag set due to analysis error in file:', f.file, oldAnalysis.error, newAnalysis.error);
        fail = true;
      } else {
        evidence = provenancePipeline.compareSources(oldSource, newSource);

        
        report.push({
          file: f.file,
          evidence
        });
        
        if (evidence.verificationResult === 'INVALID_SOURCE') {
          if (!oldSource || !newSource) {
            // It's just an added or deleted file, treat as NO_MATCH
            evidence.verificationResult = 'NO_MATCH';
          } else {
            console.error('FAIL flag set due to INVALID_SOURCE in file:', f.file);
            fail = true;
          }
        }
        
        if (evidence.verificationResult === 'NO_MATCH' || evidence.verificationResult === 'EXACT_MATCH') {
          // OK
        } else if (evidence.verificationResult === 'PARTIAL_MATCH') {
          // Check thresholds
          if (evidence.addedFragments.length > 50) {
            reviewRequired = true;
          } else {
            hasWarning = true;
          }
        }
      }
    }
    
    console.log(JSON.stringify(report, null, 2));
    
    if (fail) {
      console.log('STATUS: FAIL');
      process.exit(1);
    } else if (reviewRequired) {
      console.log('STATUS: REVIEW_REQUIRED');
      process.exit(1);
    } else if (hasWarning) {
      console.log('STATUS: WARNING');
      process.exit(0);
    } else {
      console.log('STATUS: PASS');
      process.exit(0);
    }
    
  } catch (e) {
    console.log('FAIL: ' + e.message);
    process.exit(1);
  }
}

run();
