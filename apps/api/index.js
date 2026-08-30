const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const path = require('path');

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

// Phase 15/16 Evidence & Audit
const { VerificationAuditLog } = require('../../packages/verification-engine/audit');
const auditLog = new VerificationAuditLog(path.join(__dirname, 'audit.log'));

// Phase 13 Job Endpoints (Updated for Phase 16)
app.post('/api/analyze', (req, res) => {
  try {
    const { source } = req.body;
    if (!source) return res.status(400).json({ error: 'INVALID_INPUT', details: 'source is required' });
    
    const pipeline = runPipeline(source, 'analyze.js');
    res.json({
      status: 'COMPLETED',
      result: {
        fileCount: 1,
        fragmentCount: pipeline.fragments.length,
        fragments: pipeline.fingerprintData.fragments.map(f => ({ hash: f.hash, type: f.type }))
      }
    });
  } catch (err) {
    res.status(422).json({ error: 'ANALYSIS_ERROR', details: err.message });
  }
});

app.post('/api/analyze-repository', (req, res) => {
  const { repository, commit } = req.body;
  if (!repository) return res.status(400).json({ error: 'INVALID_INPUT', details: 'repository required' });
  
  const job = jobEngine.createJob(repository, commit);
  res.json({ jobId: job.jobId, status: job.status, cached: !!job.cached });
});

app.post('/api/compare-repositories', (req, res) => {
  const { baseRepoPath, targetRepoPath } = req.body;
  if (!baseRepoPath || !targetRepoPath) {
    return res.status(400).json({ error: 'INVALID_INPUT', details: 'baseRepoPath and targetRepoPath required' });
  }

  // Basic path traversal sanity check before passing to engine
  if (baseRepoPath.includes('..') || targetRepoPath.includes('..')) {
    return res.status(403).json({ error: 'PATH_SECURITY_VIOLATION' });
  }
  
  const job = jobEngine.createCompareJob(baseRepoPath, targetRepoPath);
  res.json({ jobId: job.jobId, status: job.status, cached: !!job.cached });
});

app.get('/api/jobs/:id', (req, res) => {
  const job = jobEngine.getJob(req.params.id);
  if (!job) return res.status(404).json({ error: 'INVALID_INPUT', details: 'Job not found' });
  res.json(job);
});

app.post('/api/jobs/:id/cancel', (req, res) => {
  const success = jobEngine.cancelJob(req.params.id);
  if (!success) return res.status(404).json({ error: 'INVALID_INPUT', details: 'Job not found' });
  res.json({ success: true, status: 'CANCELLED' });
});

app.get('/api/jobs/:id/progress', (req, res) => {
  const job = jobEngine.getJob(req.params.id);
  if (!job) return res.status(404).json({ error: 'INVALID_INPUT', details: 'Job not found' });
  res.json({ progress: job.progress, status: job.status });
});

// Store completed verification receipts for history
const verificationHistory = new Map();

app.get('/api/jobs/:id/result', (req, res) => {
  const job = jobEngine.getJob(req.params.id);
  if (!job) return res.status(404).json({ error: 'INVALID_INPUT', details: 'Job not found' });
  if (job.status !== 'COMPLETED') return res.status(400).json({ error: 'VERIFICATION_ERROR', details: 'Job not completed' });
  
  // If it's a COMPARE job, append to audit log automatically on first retrieve
  if (job.type === 'COMPARE' && job.result && job.result.receipt && !job.audited) {
    try {
      const chainHash = auditLog.append(job.result.receipt);
      job.result.auditHash = chainHash;
      job.audited = true;
      // Save to history
      verificationHistory.set(job.result.receipt.verificationId, {
        jobId: job.jobId,
        receipt: job.result.receipt,
        auditHash: chainHash
      });
    } catch(e) {
      console.error('Audit log error', e);
    }
  }

  res.json(job.result);
});

app.get('/api/verification/history', (req, res) => {
  const history = Array.from(verificationHistory.values()).map(entry => ({
    verificationId: entry.receipt.verificationId,
    timestamp: entry.receipt.generatedAt,
    classification: entry.receipt.result,
    engineVersion: entry.receipt.engineVersion,
    auditHash: entry.auditHash
  }));
  res.json({ history, source: 'IN_MEMORY' });
});

app.get('/api/verification/audit', (req, res) => {
  try {
    const isValid = auditLog.verifyLogIntegrity();
    res.json({ 
      status: isValid ? 'AUDIT_CHAIN_VALID' : 'AUDIT_CHAIN_INVALID',
      lastHash: auditLog._getLastHash()
    });
  } catch(e) {
    res.status(500).json({ error: 'INTERNAL_ERROR', details: 'Failed to verify audit log' });
  }
});

app.get('/api/verification/:id', (req, res) => {
  const entry = verificationHistory.get(req.params.id);
  if (!entry) return res.status(404).json({ error: 'INVALID_INPUT', details: 'Verification not found' });
  res.json(entry.receipt.manifest);
});

app.get('/api/verification/:id/receipt', (req, res) => {
  const entry = verificationHistory.get(req.params.id);
  if (!entry) return res.status(404).json({ error: 'INVALID_INPUT', details: 'Verification not found' });
  res.json(entry.receipt);
});

// Phase 12 legacy endpoints...
app.post('/api/provenance/query', (req, res) => {
  res.status(501).json({ error: 'Not implemented in this demo route. Use analyze route.' });
});

app.get('/api/repositories/:id/history', (req, res) => {
  res.json({ history: [] }); 
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`CIPE API Server running on port ${PORT}`);
});
