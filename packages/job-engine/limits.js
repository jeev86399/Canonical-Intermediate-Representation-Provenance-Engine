module.exports = {
  MAX_CONCURRENCY: parseInt(process.env.CIPE_MAX_CONCURRENCY || '5', 10),
  MAX_FILE_SIZE_BYTES: parseInt(process.env.CIPE_MAX_FILE_SIZE || '1048576', 10), // 1MB
  MAX_FILES: parseInt(process.env.CIPE_MAX_FILES || '5000', 10),
  MAX_ANALYSIS_TIME_MS: parseInt(process.env.CIPE_MAX_ANALYSIS_TIME || '300000', 10), // 5 min
  MAX_AST_DEPTH: parseInt(process.env.CIPE_MAX_AST_DEPTH || '200', 10),
  MAX_FRAGMENTS_PER_FILE: parseInt(process.env.CIPE_MAX_FRAGMENTS || '10000', 10)
};
