const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

/**
 * Validates a repository path securely.
 * @param {string} repoPath 
 */
function validateRepoPath(repoPath) {
  const resolved = path.resolve(repoPath);
  if (!fs.existsSync(resolved)) {
    throw new Error(`Invalid repository path: ${resolved}`);
  }
  const gitDir = path.join(resolved, '.git');
  if (!fs.existsSync(gitDir)) {
    throw new Error(`Not a git repository: ${resolved}`);
  }
  return resolved;
}

/**
 * Returns the commit history (hashes) for the current branch.
 * @param {string} repoPath 
 * @returns {string[]} List of commit hashes (newest to oldest)
 */
function getCommitHistory(repoPath) {
  const resolved = validateRepoPath(repoPath);
  try {
    const output = execSync('git --no-pager log --format="%H"', { cwd: resolved, encoding: 'utf-8' });
    return output.trim().split('\n').filter(Boolean);
  } catch (e) {
    throw new Error(`Failed to get commit history: ${e.message}`);
  }
}

/**
 * Gets modified files for a specific commit.
 * @param {string} repoPath 
 * @param {string} commitHash 
 * @returns {Array<{status: string, file: string}>}
 */
function getChangedFiles(repoPath, commitHash) {
  const resolved = validateRepoPath(repoPath);
  // Sanitize commitHash
  if (!/^[a-f0-9]{4,40}$/.test(commitHash)) {
    throw new Error(`Invalid commit hash: ${commitHash}`);
  }

  try {
    // --no-commit-id prevents printing the commit hash itself
    // --name-status prints status and file path
    // -r recurses into sub-trees
    // --root allows checking the root commit
    const output = execSync(`git --no-pager diff-tree --no-commit-id --name-status -r --root ${commitHash}`, { 
      cwd: resolved, 
      encoding: 'utf-8' 
    });
    
    return output.trim().split('\n').filter(Boolean).map(line => {
      const parts = line.split('\t');
      return {
        status: parts[0][0], // A, M, D, R, etc.
        file: parts[1]
      };
    });
  } catch (e) {
    throw new Error(`Failed to get changed files for ${commitHash}: ${e.message}`);
  }
}

/**
 * Extracts the contents of a file at a specific commit.
 * @param {string} repoPath 
 * @param {string} commitHash 
 * @param {string} filePath 
 * @returns {string|null} File content or null if it doesn't exist
 */
function getFileAtCommit(repoPath, commitHash, filePath) {
  const resolved = validateRepoPath(repoPath);
  
  if (!/^[a-f0-9]{4,40}$/.test(commitHash)) {
    throw new Error(`Invalid commit hash: ${commitHash}`);
  }

  // Prevent shell injection on filePath
  // Instead of passing filePath in the shell string, we can use spawn or pass it via double quotes (but double quotes can be escaped).
  // Actually, git show takes `<commit>:<file>`. 
  // Let's sanitize filePath to prevent shell injection (no $, `, \, etc) or use execSync safely by escaping single quotes.
  // We'll just reject bizarre characters for safety, since this is for JS files.
  if (/[;&|`$]/.test(filePath)) {
    throw new Error("Invalid characters in file path");
  }

  try {
    const output = execSync(`git --no-pager show ${commitHash}:"${filePath}"`, { 
      cwd: resolved, 
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'ignore'] // ignore stderr so it doesn't throw loud errors on missing files
    });
    return output;
  } catch (e) {
    // Usually means file didn't exist at that commit
    return null;
  }
}

/**
 * Gets the parent commit of a given commit.
 */
function getParentCommit(repoPath, commitHash) {
  const resolved = validateRepoPath(repoPath);
  if (!/^[a-f0-9]{4,40}$/.test(commitHash)) {
    throw new Error(`Invalid commit hash: ${commitHash}`);
  }
  try {
    const output = execSync(`git --no-pager log --pretty=%P -n 1 ${commitHash}`, { cwd: resolved, encoding: 'utf-8' });
    const parents = output.trim().split(' ').filter(Boolean);
    return parents[0] || null; // Return first parent (if merge commit)
  } catch (e) {
    return null;
  }
}

module.exports = {
  validateRepoPath,
  getCommitHistory,
  getChangedFiles,
  getFileAtCommit,
  getParentCommit
};
