const { parentPort, workerData } = require('worker_threads');
const { performance } = require('perf_hooks');
const { compareRepositories } = require('../provenance-pipeline/repository-compare');
const { ingestLocalDirectory } = require('../repository-engine');
const { createRepositoryVerificationReceipt } = require('../verification-engine/receipt');

async function runWorker() {
  const { jobId, baseRepoPath, targetRepoPath } = workerData;
  const stageDurations = {};

  const measure = async (name, fn) => {
    const start = performance.now();
    const res = await fn();
    stageDurations[name] = (performance.now() - start).toFixed(2);
    return res;
  };

  try {
    parentPort.postMessage({ type: 'PROGRESS', progress: 10 });
    
    // 1. Ingest Base
    const baseMap = await measure('Ingest Base', async () => ingestLocalDirectory(baseRepoPath));
    parentPort.postMessage({ type: 'PROGRESS', progress: 30 });
    
    // 2. Ingest Target
    const targetMap = await measure('Ingest Target', async () => ingestLocalDirectory(targetRepoPath));
    parentPort.postMessage({ type: 'PROGRESS', progress: 50 });

    // 3. Compare
    const matchData = await measure('Compare', async () => compareRepositories(baseMap, targetMap));
    parentPort.postMessage({ type: 'PROGRESS', progress: 80 });

    // 4. Generate Receipt
    const executionMetadata = {
      workerId: process.pid,
      durationMs: stageDurations['Compare']
    };
    const receipt = await measure('Receipt Generation', async () => 
      createRepositoryVerificationReceipt({ classification: matchData.classification, matchData }, executionMetadata)
    );
    
    parentPort.postMessage({ type: 'PROGRESS', progress: 100 });

    parentPort.postMessage({
      type: 'SUCCESS',
      result: {
        stageDurations,
        receipt
      }
    });

  } catch (error) {
    parentPort.postMessage({ type: 'ERROR', error: error.message || 'Worker crash' });
  }
}

runWorker();
