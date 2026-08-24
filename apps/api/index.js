const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

// CIPE Engine Packages
const { parseSource } = require('../../packages/parser/index.js');
const { analyzeScope } = require('../../packages/scope-engine/index.js');
const { generateCanonicalIR } = require('../../packages/canonical-ir/index.js');
const { generateCFG } = require('../../packages/cfg-engine/index.js');
const { analyzeDataflow } = require('../../packages/dataflow-engine/index.js');
const { extractFragments } = require('../../packages/fragment-engine/index.js');
const { generateFingerprint } = require('../../packages/fingerprint-engine/index.js');
const { verifyProvenance } = require('../../packages/provenance-engine/index.js');

const app = express();
// Phase 2D: Implement API size limits (50KB) to prevent AST-bombing
app.use(express.json({ limit: '50kb' }));
app.use(cors());

// Phase 2B: Database Schemas
const sourceMetadataSchema = new mongoose.Schema({
  timestamp: Date,
  length: Number,
  filename: String
});

const analysisRecordSchema = new mongoose.Schema({
  sourceCode: String, // Kept purely for the prototype/demo
  metadata: sourceMetadataSchema,
  globalFingerprint: String,
  createdAt: { type: Date, default: Date.now }
});

const AnalysisRecord = mongoose.model('AnalysisRecord', analysisRecordSchema);

const verificationReportSchema = new mongoose.Schema({
  suspectId: { type: mongoose.Schema.Types.ObjectId, ref: 'AnalysisRecord' },
  targetId: { type: mongoose.Schema.Types.ObjectId, ref: 'AnalysisRecord' },
  status: String,
  confidence: Number,
  matchedFragments: Number,
  totalFragments: Number,
  createdAt: { type: Date, default: Date.now }
});

const VerificationReport = mongoose.model('VerificationReport', verificationReportSchema);

// MongoDB connection with resilient fallback
let dbConnected = false;
mongoose.connect('mongodb://localhost:27017/cipe', {
  serverSelectionTimeoutMS: 2000 // Short timeout to fallback quickly if Mongo is down
}).then(() => {
  console.log('✅ Connected to MongoDB');
  dbConnected = true;
}).catch(err => {
  console.warn('⚠️ MongoDB connection failed. Running in memory-only mode for resiliency.', err.message);
  dbConnected = false;
});

// Pipeline execution helper
function runPipeline(code) {
  const parsed = parseSource(code);
  const scopedAst = analyzeScope(parsed.ast).ast;
  const ir = generateCanonicalIR(scopedAst);
  const cfg = generateCFG(ir);
  const dataflow = analyzeDataflow(cfg);
  const fragments = extractFragments(dataflow);
  const fingerprintData = generateFingerprint(fragments);
  
  return { parsed, ir, cfg, dataflow, fragments, fingerprintData };
}

// Phase 2A: End-to-End Integration
app.post('/api/analyze', async (req, res) => {
  try {
    const { code, filename = 'unknown.js' } = req.body;
    if (!code) {
      return res.status(400).json({ error: 'Source code is required.' });
    }

    const { parsed, ir, cfg, dataflow, fragments, fingerprintData } = runPipeline(code);

    let dbId = null;
    let databaseWarning = !dbConnected;

    // Phase 2B: Database persistence if available
    if (dbConnected) {
      try {
        const record = new AnalysisRecord({
          sourceCode: code,
          metadata: {
            timestamp: new Date(),
            length: code.length,
            filename
          },
          globalFingerprint: fingerprintData.globalFingerprint
        });
        await record.save();
        dbId = record._id;
      } catch (dbErr) {
        console.error('DB Save Error (Analysis):', dbErr.message);
        databaseWarning = true;
      }
    }

    // Clean cyclic references from graph structures for JSON serialization
    // (Fragment engine already sanitizes content for hashing)
    const safeDataflow = dataflow.blocks.map(b => ({
      id: b.id,
      canonicalId: b.canonicalId,
      instructions: fragments.filter(f => f.type === 'BlockFragment' && f.blockId === b.canonicalId)[0]?.instructions || [],
      successors: b.successors.map(s => s.id)
    }));

    res.json({
      dbId,
      databaseWarning,
      parserStatus: 'SUCCESS',
      metadata: parsed.metadata,
      irVersion: ir.irVersion,
      cfgNodeCount: dataflow.blocks.length,
      fragmentCount: fragments.length,
      globalFingerprint: fingerprintData.globalFingerprint,
      rawHashes: fingerprintData.rawHashes,
      safeDataflow // Sent back for UI rendering
    });
  } catch (error) {
    // Safely trap parser errors (like unsupported syntax)
    res.status(422).json({ error: error.message, type: error.name });
  }
});

app.post('/api/compare', async (req, res) => {
  try {
    const { targetCode, suspectCode } = req.body;
    if (!targetCode || !suspectCode) {
      return res.status(400).json({ error: 'Both targetCode and suspectCode are required.' });
    }

    const targetPipeline = runPipeline(targetCode);
    const suspectPipeline = runPipeline(suspectCode);

    const report = verifyProvenance(targetPipeline.fingerprintData, suspectPipeline.fingerprintData);

    let databaseWarning = !dbConnected;

    if (dbConnected) {
      try {
        // Find or create records just for audit logs
        // For production, these would be linked to real users/projects
        const trgRec = new AnalysisRecord({ sourceCode: targetCode, globalFingerprint: targetPipeline.fingerprintData.globalFingerprint });
        const susRec = new AnalysisRecord({ sourceCode: suspectCode, globalFingerprint: suspectPipeline.fingerprintData.globalFingerprint });
        await Promise.all([trgRec.save(), susRec.save()]);

        const dbReport = new VerificationReport({
          targetId: trgRec._id,
          suspectId: susRec._id,
          status: report.status,
          confidence: report.confidence,
          matchedFragments: report.matchedFragments,
          totalFragments: report.totalFragments
        });
        await dbReport.save();
      } catch (dbErr) {
        console.error('DB Save Error (Compare):', dbErr.message);
        databaseWarning = true;
      }
    }

    res.json({
      databaseWarning,
      status: report.status,
      confidence: report.confidence,
      matchedFragments: report.matchedFragments,
      totalFragments: report.totalFragments,
      evidence: report.evidence
    });
  } catch (error) {
    res.status(422).json({ error: error.message, type: error.name });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`CIPE API Server running on port ${PORT}`);
});
