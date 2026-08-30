const crypto = require('crypto');

/**
 * Calculates a unique, deterministic identity for an analysis request.
 * If this identity matches a previously completed job, the analysis can be safely bypassed.
 */
function calculateAnalysisIdentity({ repository, commit, cipeVersion, irVersion, fingerprintVersion }) {
  const hash = crypto.createHash('sha256');
  hash.update(repository || '');
  hash.update(commit || '');
  hash.update(cipeVersion || '1.0.0');
  hash.update(irVersion || 'CIPE-IR-1');
  hash.update(fingerprintVersion || 'WLCDH-K2');
  return hash.digest('hex');
}

module.exports = {
  calculateAnalysisIdentity
};
