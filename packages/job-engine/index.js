const { v4: uuidv4 } = require('uuid');
const { calculateAnalysisIdentity } = require('./idempotency');
const limits = require('./limits');
const { Worker } = require('worker_threads');
const path = require('path');

// In-memory job store for Phase 13 (in production, this would be Redis/MongoDB)
const jobs = new Map();
// Cache mapping analysisIdentity -> jobId
const analysisCache = new Map();

// Concurrency tracking
let activeJobs = 0;
const queue = [];

function createJob(repository, commit) {
  const identity = calculateAnalysisIdentity({ repository, commit });
  
  if (analysisCache.has(identity)) {
    const cachedJobId = analysisCache.get(identity);
    const cachedJob = jobs.get(cachedJobId);
    if (cachedJob && (cachedJob.status === 'COMPLETED' || cachedJob.status === 'RUNNING')) {
      return { ...cachedJob, cached: true };
    }
  }

  const job = {
    jobId: uuidv4(),
    repository,
    commit,
    createdAt: Date.now(),
    startedAt: null,
    completedAt: null,
    status: 'QUEUED',
    progress: 0,
    error: null,
    result: null,
    identity,
    telemetry: {
      queueTime: 0,
      executionTime: 0,
      stageDurations: {},
      fileCount: 0,
      fragmentCount: 0,
      warnings: []
    }
  };

  jobs.set(job.jobId, job);
  analysisCache.set(identity, job.jobId);
  
  queue.push(job.jobId);
  processQueue();
  
  return job;
}

function processQueue() {
  if (activeJobs >= limits.MAX_CONCURRENCY) return;
  if (queue.length === 0) return;

  const jobId = queue.shift();
  const job = jobs.get(jobId);
  if (!job || job.status === 'CANCELLED') {
    processQueue();
    return;
  }

  startJob(job);
}

function startJob(job) {
  activeJobs++;
  job.status = 'RUNNING';
  job.startedAt = Date.now();
  job.telemetry.queueTime = job.startedAt - job.createdAt;

  // Run in a worker thread for isolation (Part 13)
  const worker = new Worker(path.join(__dirname, 'worker.js'), {
    workerData: {
      jobId: job.jobId,
      repository: job.repository,
      commit: job.commit,
      limits
    }
  });

  const timeoutId = setTimeout(() => {
    worker.terminate();
    failJob(job, new Error('Job exceeded maximum analysis time'));
  }, limits.MAX_ANALYSIS_TIME_MS);

  worker.on('message', (msg) => {
    if (msg.type === 'PROGRESS') {
      job.progress = msg.progress;
    } else if (msg.type === 'SUCCESS') {
      clearTimeout(timeoutId);
      worker.terminate();
      completeJob(job, msg.result);
    } else if (msg.type === 'ERROR') {
      clearTimeout(timeoutId);
      failJob(job, new Error(msg.error));
    }
  });

  worker.on('error', (err) => {
    clearTimeout(timeoutId);
    failJob(job, err);
  });

  worker.on('exit', (code) => {
    clearTimeout(timeoutId);
    if (code !== 0 && job.status === 'RUNNING') {
      failJob(job, new Error(`Worker stopped with exit code ${code}`));
    }
  });

  job._worker = worker;
}

function completeJob(job, result) {
  if (job.status !== 'RUNNING') return;
  job.status = 'COMPLETED';
  job.progress = 100;
  job.completedAt = Date.now();
  job.telemetry.executionTime = job.completedAt - job.startedAt;
  
  // Map result telemetry
  job.telemetry.fileCount = result.fileCount || 0;
  job.telemetry.fragmentCount = result.fragmentCount || 0;
  job.telemetry.stageDurations = result.stageDurations || {};
  job.telemetry.warnings = result.warnings || [];
  
  job.result = result.manifest || result; // store manifest or output
  
  delete job._worker;
  activeJobs--;
  processQueue();
}

function failJob(job, error) {
  if (job.status !== 'RUNNING' && job.status !== 'QUEUED') return;
  job.status = 'FAILED';
  job.completedAt = Date.now();
  job.error = error.message;
  
  delete job._worker;
  activeJobs--;
  
  // Remove from cache so it can be retried
  if (analysisCache.get(job.identity) === job.jobId) {
    analysisCache.delete(job.identity);
  }
  
  processQueue();
}

function cancelJob(jobId) {
  const job = jobs.get(jobId);
  if (!job) return false;
  
  if (job.status === 'RUNNING' && job._worker) {
    job._worker.terminate();
    activeJobs--;
  } else if (job.status === 'QUEUED') {
    const idx = queue.indexOf(jobId);
    if (idx !== -1) queue.splice(idx, 1);
  }
  
  job.status = 'CANCELLED';
  job.completedAt = Date.now();
  delete job._worker;
  
  if (analysisCache.get(job.identity) === job.jobId) {
    analysisCache.delete(job.identity);
  }

  processQueue();
  return true;
}

function getJob(jobId) {
  const job = jobs.get(jobId);
  if (!job) return null;
  // Remove internal _worker ref before returning
  const { _worker, ...safeJob } = job;
  return safeJob;
}

// Simulated recovery on startup (Part 3)
function recoverJobs() {
  let recovered = 0;
  for (const [jobId, job] of jobs.entries()) {
    if (job.status === 'RUNNING') {
      // It was stuck running during a crash
      job.status = 'FAILED';
      job.error = 'Job recovered from system crash';
      if (analysisCache.get(job.identity) === job.jobId) {
        analysisCache.delete(job.identity);
      }
      recovered++;
    }
  }
  return recovered;
}

module.exports = {
  createJob,
  getJob,
  cancelJob,
  recoverJobs
};
