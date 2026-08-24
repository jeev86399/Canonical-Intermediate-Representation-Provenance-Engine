const crypto = require('crypto');

/**
 * Deterministically stringifies an object.
 */
function deterministicStringify(obj) {
  if (obj === null || obj === undefined) {
    return 'null';
  }
  if (typeof obj !== 'object') {
    return JSON.stringify(obj);
  }
  if (Array.isArray(obj)) {
    return '[' + obj.map(deterministicStringify).join(',') + ']';
  }
  
  const keys = Object.keys(obj).sort();
  const parts = [];
  for (const key of keys) {
    parts.push(JSON.stringify(key) + ':' + deterministicStringify(obj[key]));
  }
  return '{' + parts.join(',') + '}';
}

/**
 * Computes a SHA-256 hash for a given string.
 */
function sha256(data) {
  return crypto.createHash('sha256').update(data).digest('hex');
}

/**
 * Generates cryptographic fingerprints for fragments and a global multiset hash.
 * 
 * @param {Array} fragments - Array of unhashed fragments.
 * @returns {Object} Object containing the fragment hashes and the global fingerprint.
 */
function generateFingerprint(fragments) {
  const hashedFragments = [];
  const rawHashes = [];

  // 1. Hash each fragment deterministically
  for (const fragment of fragments) {
    const serialized = deterministicStringify(fragment);
    const hash = sha256(serialized);
    
    hashedFragments.push({
      hash,
      content: fragment
    });
    
    rawHashes.push(hash);
  }

  // 2. Multiset Accumulator (Sorted Concatenation Hash)
  // To ensure the global hash is strictly order-independent, we sort the individual fragment hashes.
  // Concatenating and hashing avoids collision attacks present in simple XOR or SUM accumulators.
  rawHashes.sort();
  
  const globalFingerprint = sha256(rawHashes.join(''));

  return {
    hashVersion: '1.0',
    globalFingerprint,
    fragments: hashedFragments,
    rawHashes
  };
}

module.exports = {
  generateFingerprint,
  deterministicStringify,
  sha256
};
