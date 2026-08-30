const crypto = require('crypto');

/**
 * Part 7: Analysis Manifest
 * Creates a deterministic repository analysis manifest.
 */
function createManifest(data) {
  // We sort files to ensure order determinism
  const sortedAnalyzed = [...data.filesAnalyzed].sort((a, b) => a.file.localeCompare(b.file));
  const sortedSkipped = [...data.filesSkipped].sort((a, b) => a.file.localeCompare(b.file));

  const manifestCore = {
    repository: data.repository,
    commit: data.commit,
    cipeVersion: '1.0.0',
    canonicalIRVersion: 'CIPE-IR-1',
    fingerprintVersion: 'WLCDH-K2',
    toolVersion: 'Node-24',
    filesAnalyzed: sortedAnalyzed,
    filesSkipped: sortedSkipped
  };

  const hash = crypto.createHash('sha256');
  hash.update(JSON.stringify(manifestCore));
  const manifestId = hash.digest('hex');

  // We separate reproducibility identity from wall-clock metadata
  return {
    manifestId,
    timestamp: Date.now(),
    ...manifestCore
  };
}

module.exports = {
  createManifest
};
