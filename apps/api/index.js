const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

// Phase 12 Rate Limiter (Memory-based token bucket)
const rateLimits = new Map();
function rateLimit(req, res, next) {
  const ip = req.ip || 'unknown';
  const now = Date.now();
  const windowMs = 60000; // 1 minute
  const maxReq = 100;
  
  if (!rateLimits.has(ip)) {
    rateLimits.set(ip, { count: 1, resetAt: now + windowMs });
    return next();
  }
  
  const limit = rateLimits.get(ip);
  if (now > limit.resetAt) {
    limit.count = 1;
    limit.resetAt = now + windowMs;
    return next();
  }
  
  limit.count++;
  if (limit.count > maxReq) {
    return res.status(429).json({ error: 'Too Many Requests', retryAfter: (limit.resetAt - now) / 1000 });
  }
  next();
}

// CIPE Engine Packages
const { parseSource } = require('../../packages/parser');
const { analyzeScope } = require('../../packages/scope-engine');
const { generateCanonicalIR } = require('../../packages/canonical-ir');
const { generateCFG } = require('../../packages/cfg-engine');
const { analyzeDataflow } = require('../../packages/dataflow-engine');
const { extractFragments } = require('../../packages/fragment-engine');
const { generateFingerprint } = require('../../packages/fingerprint-engine');

// Phase 12 Provenance Engine
const { verifyProvenance } = require('../../packages/provenance-engine');

// Phase 13 Job Engine
const jobEngine = require('../../packages/job-engine');
jobEngine.recoverJobs();

const app = express();
app.use(express.json({ limit: '50kb' }));
app.use(cors());
app.use(rateLimit); // Apply globally for API hardening

// MongoDB setup...
let dbConnected = false;
mongoose.connect('mongodb://localhost:27017/cipe', {
  serverSelectionTimeoutMS: 2000
}).then(() => {
  console.log('✅ Connected to MongoDB');
  dbConnected = true;
}).catch(err => {
  console.warn('⚠️ MongoDB connection failed. Running in memory-only mode for resiliency.');
  dbConnected = false;
});

function runPipeline(code, filePath = 'unknown.js') {
  const parsed = parseSource(code, filePath);
  const scopedAst = analyzeScope(parsed.ast).ast;
  const ir = generateCanonicalIR(scopedAst);
  const cfg = generateCFG(ir);
  const dataflow = analyzeDataflow(cfg);
  const fragments = extractFragments(dataflow);
  const fingerprintData = generateFingerprint(fragments);
  
  return { parsed, ir, cfg, dataflow, fragments, fingerprintData };
}

// Timeout wrapper
const timeout = (ms) => new Promise((_, reject) => setTimeout(() => reject(new Error('Request Timeout')), ms));

app.post('/api/provenance/verify', async (req, res) => {
  try {
    const { targetSource, suspectSource, targetMeta, suspectMeta } = req.body;
    if (!targetSource || !suspectSource) {
      return res.status(400).json({ error: 'Both targetSource and suspectSource are required.' });
    }

    // Wrap in timeout (e.g., 5 seconds)
    const verificationTask = async () => {
      const targetPipeline = runPipeline(targetSource, targetMeta?.filePath || 'target.js');
      const suspectPipeline = runPipeline(suspectSource, suspectMeta?.filePath || 'suspect.js');

      const targetData = {
        repositoryId: targetMeta?.repositoryId || 'R1',
        commitHash: targetMeta?.commitHash || 'C1',
        filePath: targetMeta?.filePath || 'target.js',
        fragments: targetPipeline.fingerprintData.fragments.map(f => ({ hash: f.hash, content: f.content }))
      };

      const suspectData = {
        repositoryId: suspectMeta?.repositoryId || 'R2',
        commitHash: suspectMeta?.commitHash || 'C2',
        filePath: suspectMeta?.filePath || 'suspect.js',
        fragments: suspectPipeline.fingerprintData.fragments.map(f => ({ hash: f.hash, content: f.content }))
      };

      return verifyProvenance(targetData, suspectData);
    };

    const report = await Promise.race([verificationTask(), timeout(5000)]);
    res.json(report);

  } catch (error) {
    // Deterministic safe errors
    res.status(422).json({ error: 'Verification failed', details: error.message, type: error.name || 'Error' });
  }
});

// Phase 12: Research Export Endpoint
app.get('/api/provenance/export', (req, res) => {
  try {
    const fs = require('fs');
    const path = require('path');
    const format = req.query.format || 'json';
    const resultsPath = path.join(__dirname, '../../tests/phase12/corpus/results.json');
    const detailsPath = path.join(__dirname, '../../tests/phase12/corpus/details.csv');

    if (format === 'csv') {
      if (!fs.existsSync(detailsPath)) return res.status(404).json({ error: 'CSV not found' });
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="experiments.csv"');
      return res.send(fs.readFileSync(detailsPath));
    } else {
      if (!fs.existsSync(resultsPath)) return res.status(404).json({ error: 'JSON not found' });
      res.json(JSON.parse(fs.readFileSync(resultsPath, 'utf8')));
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to export results', details: error.message });
  }
});

// Phase 13 Job Endpoints
app.post('/api/repositories/analyze', (req, res) => {
  const { repository, commit } = req.body;
  if (!repository) return res.status(400).json({ error: 'repository required' });
  
  const job = jobEngine.createJob(repository, commit);
  res.json({ jobId: job.jobId, status: job.status, cached: !!job.cached });
});

app.get('/api/jobs/:id', (req, res) => {
  const job = jobEngine.getJob(req.params.id);
  if (!job) return res.status(404).json({ error: 'Job not found' });
  res.json(job);
});

app.post('/api/jobs/:id/cancel', (req, res) => {
  const success = jobEngine.cancelJob(req.params.id);
  if (!success) return res.status(404).json({ error: 'Job not found' });
  res.json({ success: true, status: 'CANCELLED' });
});

app.get('/api/jobs/:id/progress', (req, res) => {
  const job = jobEngine.getJob(req.params.id);
  if (!job) return res.status(404).json({ error: 'Job not found' });
  res.json({ progress: job.progress, status: job.status });
});

app.get('/api/jobs/:id/result', (req, res) => {
  const job = jobEngine.getJob(req.params.id);
  if (!job) return res.status(404).json({ error: 'Job not found' });
  if (job.status !== 'COMPLETED') return res.status(400).json({ error: 'Job not completed' });
  res.json(job.result);
});

app.post('/api/provenance/query', (req, res) => {
  res.status(501).json({ error: 'Not implemented in this demo route. Use analyze route.' });
});

app.get('/api/repositories/:id/history', (req, res) => {
  res.json({ history: [] }); // Stub for API compliance
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`CIPE API Server running on port ${PORT}`);
});
