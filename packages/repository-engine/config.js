/**
 * Security Boundaries for Repository Ingestion.
 * Strict limits to prevent DoS, memory exhaustion, and path traversal.
 */
module.exports = {
  MAX_FILE_SIZE_BYTES: 1024 * 1024, // 1MB max per JS file
  MAX_REPO_FILES: 10000,            // 10k files max per repo
  MAX_TOTAL_SIZE_BYTES: 100 * 1024 * 1024, // 100MB max total source
  MAX_DEPTH: 10,                    // Max directory depth
  ALLOWED_EXTENSIONS: ['.js', '.jsx', '.ts', '.tsx', '.mjs', '.cjs'],
  IGNORED_DIRECTORIES: new Set([
    'node_modules',
    '.git',
    'dist',
    'build',
    'coverage',
    'out'
  ])
};
