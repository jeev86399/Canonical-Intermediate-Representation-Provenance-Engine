const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

/**
 * Append-only Audit Log.
 * Stores verification receipts linked via cryptographic hash chain.
 * Used to ensure evidence tampering can be detected.
 */
class VerificationAuditLog {
  constructor(logFilePath) {
    this.logFilePath = logFilePath;
    this._initialize();
  }

  _initialize() {
    if (!fs.existsSync(this.logFilePath)) {
      // Create empty log
      fs.writeFileSync(this.logFilePath, '', 'utf8');
    }
  }

  /**
   * Reads the last entry to get the previous hash.
   */
  _getLastHash() {
    try {
      const content = fs.readFileSync(this.logFilePath, 'utf8').trim();
      if (!content) return 'GENESIS';
      
      const lines = content.split('\n');
      const lastLine = lines[lines.length - 1];
      const lastEntry = JSON.parse(lastLine);
      return lastEntry.chainHash;
    } catch (e) {
      return 'GENESIS';
    }
  }

  /**
   * Appends a verification receipt to the log, linking it to the previous hash.
   */
  append(receipt) {
    const previousHash = this._getLastHash();
    
    // Stringify receipt deterministically or just use JSON.stringify as it's the raw payload
    const receiptPayload = JSON.stringify(receipt);
    
    const hasher = crypto.createHash('sha256');
    hasher.update(previousHash);
    hasher.update(receiptPayload);
    const chainHash = hasher.digest('hex');

    const entry = {
      chainHash,
      previousHash,
      receipt
    };

    // Append atomic write (using newline delimited JSON)
    fs.appendFileSync(this.logFilePath, JSON.stringify(entry) + '\n', 'utf8');
    return chainHash;
  }

  /**
   * Verifies the entire audit log for tampering.
   */
  verifyLogIntegrity() {
    try {
      const content = fs.readFileSync(this.logFilePath, 'utf8').trim();
      if (!content) return true; // Empty is valid

      const lines = content.split('\n');
      let currentExpectedPrev = 'GENESIS';

      for (let i = 0; i < lines.length; i++) {
        const entry = JSON.parse(lines[i]);
        if (entry.previousHash !== currentExpectedPrev) {
          return false; // Chain broken
        }

        const hasher = crypto.createHash('sha256');
        hasher.update(entry.previousHash);
        hasher.update(JSON.stringify(entry.receipt));
        const computedHash = hasher.digest('hex');

        if (computedHash !== entry.chainHash) {
          return false; // Content tampered
        }
        currentExpectedPrev = entry.chainHash;
      }
      return true;
    } catch (e) {
      return false; // Parse error or tampering
    }
  }
}

module.exports = {
  VerificationAuditLog
};
