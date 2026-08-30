const crypto = require('crypto');

/**
 * Part 8: Content-Addressable Results
 * Mock CAS (Content-Addressable Storage) to deduplicate storage of derived analysis artifacts.
 */
const storage = new Map();

function saveContent(data) {
  const contentString = JSON.stringify(data);
  const hash = crypto.createHash('sha256').update(contentString).digest('hex');
  
  // Deduplication check
  if (!storage.has(hash)) {
    storage.set(hash, contentString);
  }
  
  return hash;
}

function getContent(hash) {
  const data = storage.get(hash);
  return data ? JSON.parse(data) : null;
}

function getStoreSize() {
  return storage.size;
}

module.exports = {
  saveContent,
  getContent,
  getStoreSize
};
