const { parentPort, workerData } = require('worker_threads');
const { performance } = require('perf_hooks');
const { executeIncrementalAnalysis } = require('../provenance-engine/incremental');

async function runWorker() {
  const { jobId, repository, commit, limits } = workerData;
  const stageDurations = {};
  
  const measure = async (name, fn) => {
    const start = performance.now();
    const res = await fn();
    stageDurations[name] = (performance.now() - start).toFixed(2);
    return res;
  };

  try {
    parentPort.postMessage({ type: 'PROGRESS', progress: 10 });
    
    // Simulate git pulling & parsing via incremental engine
    const analysisResult = await measure('Incremental Analysis', () => 
      executeIncrementalAnalysis({ repository, commit, limits, reporter: (p) => {
        parentPort.postMessage({ type: 'PROGRESS', progress: 10 + (p * 0.8) });
      }})
    );

    parentPort.postMessage({ type: 'PROGRESS', progress: 95 });
    
    // Send success
    parentPort.postMessage({
      type: 'SUCCESS',
      result: {
        stageDurations,
        fileCount: analysisResult.fileCount,
        fragmentCount: analysisResult.fragmentCount,
        manifest: analysisResult.manifest,
        warnings: analysisResult.warnings
      }
    });

  } catch (error) {
    parentPort.postMessage({ type: 'ERROR', error: error.message || 'Worker crash' });
  }
}

runWorker();
