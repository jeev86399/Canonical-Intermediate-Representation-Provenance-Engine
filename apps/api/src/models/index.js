const mongoose = require('mongoose');

// ============================================================
// Phase 11: Unified Domain Models for Scalable Provenance Index
// ============================================================

// --- Repository ---
const RepositorySchema = new mongoose.Schema({
  name: { type: String, required: true },
  url: { type: String, default: '' },
  language: { type: String, default: 'javascript' },
  lastAnalyzedCommit: { type: String, default: '' },
  totalFragments: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});
RepositorySchema.index({ name: 1 }, { unique: true });

// --- Commit ---
const CommitSchema = new mongoose.Schema({
  repositoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Repository', required: true },
  hash: { type: String, required: true },
  parentHash: { type: String, default: '' },
  timestamp: { type: Date, default: Date.now },
  author: { type: String, default: '' },
  message: { type: String, default: '' }
});
CommitSchema.index({ repositoryId: 1, hash: 1 }, { unique: true });

// --- File ---
const FileSchema = new mongoose.Schema({
  commitId: { type: mongoose.Schema.Types.ObjectId, ref: 'Commit', required: true },
  repositoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Repository', required: true },
  path: { type: String, required: true },
  language: { type: String, default: 'javascript' },
  globalFingerprint: { type: String, default: '' },
  fragmentCount: { type: Number, default: 0 },
  status: { type: String, enum: ['PENDING', 'ANALYZED', 'ERROR'], default: 'PENDING' }
});
FileSchema.index({ commitId: 1, path: 1 });
FileSchema.index({ globalFingerprint: 1 });

// --- Fragment (Phase 11 provenance index schema) ---
const FragmentSchema = new mongoose.Schema({
  fingerprint: { type: String, required: true, index: true },
  fragmentType: { type: String, enum: ['BasicBlock', 'Function', 'Program'], default: 'BasicBlock' },
  canonicalVersion: { type: String, required: true, default: 'CIPE-9-WLCDH' },
  algorithmVersion: { type: String, required: true, default: '1.0' },
  repositoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Repository' },
  commitHash: { type: String, default: '' },
  filePath: { type: String, default: '' },
  blockIndex: { type: Number, default: 0 },
  dependencyContext: { type: [String], default: [] },
  controlFlowContext: { type: [String], default: [] },
  isCommonFragment: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});
// Hash index for O(1) fingerprint lookups
FragmentSchema.index({ fingerprint: 'hashed' });
// Compound index for repository-scoped queries
FragmentSchema.index({ repositoryId: 1, filePath: 1 });
// Compound index for version-aware lookups
FragmentSchema.index({ fingerprint: 1, canonicalVersion: 1 });

// --- Verification ---
const VerificationSchema = new mongoose.Schema({
  sourceRepositoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Repository' },
  targetRepositoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Repository' },
  status: {
    type: String,
    enum: ['EXACT_MATCH', 'STRUCTURAL_MATCH', 'PARTIAL_MATCH', 'NO_MATCH', 'UNSUPPORTED'],
    required: true
  },
  confidence: { type: Number, default: 0 },
  matchedFragments: { type: Number, default: 0 },
  totalFragments: { type: Number, default: 0 },
  evidence: {
    matched: { type: [String], default: [] },
    added: { type: [String], default: [] },
    removed: { type: [String], default: [] }
  },
  canonicalVersion: { type: String, default: 'CIPE-9-WLCDH' },
  algorithmVersion: { type: String, default: '1.0' },
  createdAt: { type: Date, default: Date.now }
});
VerificationSchema.index({ sourceRepositoryId: 1, targetRepositoryId: 1 });

// --- Legacy schemas (preserved for backward compatibility) ---
const ProjectSchema = new mongoose.Schema({
  name: String,
  ownerId: String,
  language: String,
  sourceHash: String,
  sourceCode: String,
  irVersion: String,
  createdAt: { type: Date, default: Date.now }
});

const ArtifactSchema = new mongoose.Schema({
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project' },
  ast: Object,
  canonicalIr: Object,
  cfg: Object,
  dependencies: Array,
  status: String
});

const FingerprintSchema = new mongoose.Schema({
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project' },
  fragmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Fragment' },
  type: String,
  algorithmVersion: String,
  value: String
});

// Register models
const Repository = mongoose.model('Repository', RepositorySchema);
const Commit = mongoose.model('Commit', CommitSchema);
const File = mongoose.model('File', FileSchema);
const Fragment = mongoose.model('Fragment', FragmentSchema);
const Verification = mongoose.model('Verification', VerificationSchema);

// Legacy
const Project = mongoose.model('Project', ProjectSchema);
const Artifact = mongoose.model('Artifact', ArtifactSchema);
const Fingerprint = mongoose.model('Fingerprint', FingerprintSchema);

module.exports = {
  // Phase 11 models
  Repository,
  Commit,
  File,
  Fragment,
  Verification,
  // Legacy models
  Project,
  Artifact,
  Fingerprint
};
