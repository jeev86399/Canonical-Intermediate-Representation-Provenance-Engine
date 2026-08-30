const fs = require('fs');
const path = require('path');
const config = require('./config');
const gitEngine = require('../git-engine');

/**
 * Validates a file path strictly.
 */
function isValidFile(filePath) {
  const ext = path.extname(filePath);
  return config.ALLOWED_EXTENSIONS.includes(ext);
}

/**
 * Ensures path doesn't escape base dir (Path Traversal protection)
 */
function isSafePath(base, target) {
  const resolvedBase = path.resolve(base);
  const resolvedTarget = path.resolve(base, target);
  return resolvedTarget.startsWith(resolvedBase + path.sep) || resolvedTarget === resolvedBase;
}

/**
 * Ingests a local directory securely.
 */
function ingestLocalDirectory(dirPath, depth = 0) {
  if (depth > config.MAX_DEPTH) throw new Error('MAX_DEPTH exceeded');

  const resolved = path.resolve(dirPath);
  if (!isSafePath(resolved, resolved)) throw new Error('Path traversal detected');

  let stat;
  try {
    // Check lstat to detect symlinks (do not follow them for security)
    stat = fs.lstatSync(resolved);
  } catch (e) {
    throw new Error(`Cannot access path: ${resolved}`);
  }

  if (stat.isSymbolicLink()) {
    throw new Error('Symlinks are not allowed for ingestion');
  }

  if (!stat.isDirectory()) {
    throw new Error('Path is not a directory');
  }

  const files = [];
  let totalSize = 0;

  function traverse(currentPath, currentDepth) {
    if (currentDepth > config.MAX_DEPTH) return;
    if (files.length >= config.MAX_REPO_FILES) throw new Error('MAX_REPO_FILES exceeded');
    if (totalSize >= config.MAX_TOTAL_SIZE_BYTES) throw new Error('MAX_TOTAL_SIZE_BYTES exceeded');

    const entries = fs.readdirSync(currentPath, { withFileTypes: true });

    for (const entry of entries) {
      if (config.IGNORED_DIRECTORIES.has(entry.name)) continue;

      const fullPath = path.join(currentPath, entry.name);
      
      if (entry.isSymbolicLink()) {
        continue; // Skip symlinks silently or fail? For safety, skip.
      }

      if (entry.isDirectory()) {
        traverse(fullPath, currentDepth + 1);
      } else if (entry.isFile()) {
        if (isValidFile(entry.name)) {
          const fileStat = fs.statSync(fullPath);
          if (fileStat.size > config.MAX_FILE_SIZE_BYTES) {
            throw new Error(`MAX_FILE_SIZE_BYTES exceeded for ${entry.name}`);
          }
          files.push(fullPath);
          totalSize += fileStat.size;
        }
      }
    }
  }

  traverse(resolved, depth);
  return files;
}

/**
 * Reads file securely
 */
function readSourceFile(filePath) {
  const stat = fs.lstatSync(filePath);
  if (stat.isSymbolicLink()) throw new Error('Symlink detected during read');
  if (stat.size > config.MAX_FILE_SIZE_BYTES) throw new Error('File too large');

  const content = fs.readFileSync(filePath, 'utf8');
  if (content.indexOf('\0') !== -1) throw new Error('Binary file masquerading as JS detected');
  return content;
}

/**
 * Fetches files for a specific git commit, safely.
 */
function getGitSnapshot(repoPath, commitHash) {
  // Uses git-engine to get files
  const changedFiles = gitEngine.getChangedFiles(repoPath, commitHash);
  const jsFiles = changedFiles.filter(f => isValidFile(f.file));
  
  if (jsFiles.length > config.MAX_REPO_FILES) {
    throw new Error('MAX_REPO_FILES exceeded in Git commit');
  }

  const snapshot = new Map();
  let totalSize = 0;

  for (const f of jsFiles) {
    if (f.status === 'D') continue; // Deleted
    
    // getFileAtCommit prevents path traversal by resolving inside git context via git show
    const content = gitEngine.getFileAtCommit(repoPath, commitHash, f.file);
    if (!content) continue;
    
    if (content.length > config.MAX_FILE_SIZE_BYTES) {
      throw new Error(`MAX_FILE_SIZE_BYTES exceeded for ${f.file} via git`);
    }
    if (content.indexOf('\0') !== -1) {
      throw new Error('Binary file masquerading as JS detected via git');
    }

    totalSize += content.length;
    if (totalSize > config.MAX_TOTAL_SIZE_BYTES) {
      throw new Error('MAX_TOTAL_SIZE_BYTES exceeded in Git commit');
    }

    snapshot.set(f.file, content);
  }

  return snapshot;
}

module.exports = {
  ingestLocalDirectory,
  readSourceFile,
  getGitSnapshot,
  isValidFile,
  isSafePath,
  config
};
