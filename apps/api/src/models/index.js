const mongoose = require('mongoose');

const ProjectSchema = new mongoose.Schema({
  name: String,
  ownerId: String,
  language: String,
  sourceHash: String,
  sourceCode: String, // Storing source directly for the MVP code editor
  irVersion: String,
  createdAt: { type: Date, default: Date.now }
});

const ArtifactSchema = new mongoose.Schema({
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project' },
  ast: Object,
  canonicalIr: Object,
  cfg: Object,
  dependencies: Array,
  status: String // 'PENDING', 'ANALYZED', 'ERROR'
});

const FragmentSchema = new mongoose.Schema({
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project' },
  type: String,
  canonicalDigest: String,
  context: Object,
  dependencies: Array
});

const FingerprintSchema = new mongoose.Schema({
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project' }, // Denormalized for easier cleanup/queries
  fragmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Fragment' }, // Null for root fingerprint
  type: String, // 'root', 'Function', 'BasicBlock'
  algorithmVersion: String,
  value: String
});

const VerificationSchema = new mongoose.Schema({
  sourceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project' },
  targetId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project' },
  status: String, // MATCH, PARTIAL_MATCH, DIFFERENT, UNSUPPORTED
  matchedFragments: Array,
  dependencyEvidence: Array,
  transformationClasses: Array,
  limitations: Array,
  createdAt: { type: Date, default: Date.now }
});

const Project = mongoose.model('Project', ProjectSchema);
const Artifact = mongoose.model('Artifact', ArtifactSchema);
const Fragment = mongoose.model('Fragment', FragmentSchema);
const Fingerprint = mongoose.model('Fingerprint', FingerprintSchema);
const Verification = mongoose.model('Verification', VerificationSchema);

module.exports = {
  Project,
  Artifact,
  Fragment,
  Fingerprint,
  Verification
};
