/**
 * @cipe/provenance-index
 * In-memory fragment index for scalable provenance search.
 * Supports O(1) fingerprint lookups, batch queries, common fragment detection,
 * and baseline linear scan for benchmarking.
 */

const HEX64_REGEX = /^[a-f0-9]{64}$/;
const MAX_METADATA_SIZE = 10240; // 10KB
const MAX_RECORDS_PER_FRAGMENT = 500;
const DANGEROUS_PATH_PATTERNS = ['../', ';', '|', '&', '$', '\0', '`'];

class ProvenanceIndex {
  constructor() {
    this.index = new Map();        // fingerprint -> metadata[]
    this.repositories = new Set(); // unique repository IDs
    this.totalFragments = 0;
  }

  /**
   * Validate a fingerprint string.
   */
  _validateFingerprint(fingerprint) {
    if (typeof fingerprint !== 'string' || !HEX64_REGEX.test(fingerprint)) {
      throw new Error(`Invalid fingerprint: must be 64-char hex string, got "${String(fingerprint).substring(0, 20)}..."`);
    }
  }

  /**
   * Validate metadata object.
   */
  _validateMetadata(metadata) {
    if (!metadata || typeof metadata !== 'object') {
      throw new Error('Metadata must be a non-null object');
    }
    const metaString = JSON.stringify(metadata);
    if (metaString.length > MAX_METADATA_SIZE) {
      throw new Error(`Metadata too large: ${metaString.length} bytes exceeds ${MAX_METADATA_SIZE} limit`);
    }
    // Check for path traversal
    if (metadata.filePath) {
      for (const pattern of DANGEROUS_PATH_PATTERNS) {
        if (metadata.filePath.includes(pattern)) {
          throw new Error(`Malformed file path: contains dangerous pattern "${pattern}"`);
        }
      }
    }
    if (metadata.repositoryId) {
      for (const pattern of DANGEROUS_PATH_PATTERNS) {
        if (String(metadata.repositoryId).includes(pattern)) {
          throw new Error(`Malformed repository ID: contains dangerous pattern "${pattern}"`);
        }
      }
    }
  }

  /**
   * Add a fragment with metadata to the index.
   */
  addFragment(fingerprint, metadata) {
    this._validateFingerprint(fingerprint);
    this._validateMetadata(metadata);

    if (!this.index.has(fingerprint)) {
      this.index.set(fingerprint, []);
    }

    const records = this.index.get(fingerprint);
    if (records.length >= MAX_RECORDS_PER_FRAGMENT) {
      throw new Error(`Flooding detected: fragment ${fingerprint.substring(0, 16)}... has ${records.length} records`);
    }

    records.push({ ...metadata });
    this.totalFragments++;

    if (metadata.repositoryId) {
      this.repositories.add(metadata.repositoryId);
    }
  }

  /**
   * O(1) lookup returning all matching metadata entries.
   */
  queryFragment(fingerprint) {
    this._validateFingerprint(fingerprint);
    return this.index.get(fingerprint) || [];
  }

  /**
   * Batch lookup. Returns Map<fingerprint, metadata[]>.
   */
  queryBatch(fingerprints) {
    const results = new Map();
    for (const fp of fingerprints) {
      try {
        this._validateFingerprint(fp);
        const entries = this.index.get(fp) || [];
        if (entries.length > 0) {
          results.set(fp, entries);
        }
      } catch (e) {
        // Skip invalid fingerprints in batch
      }
    }
    return results;
  }

  /**
   * Get index statistics.
   */
  getStats() {
    return {
      totalFragments: this.totalFragments,
      uniqueFingerprints: this.index.size,
      repositories: this.repositories.size
    };
  }

  /**
   * Serialize the index to a JSON-serializable object.
   */
  exportIndex() {
    const entries = [];
    for (const [fp, metadataList] of this.index) {
      entries.push({ fingerprint: fp, records: metadataList });
    }
    return {
      version: '1.0',
      totalFragments: this.totalFragments,
      repositories: Array.from(this.repositories),
      entries
    };
  }

  /**
   * Deserialize and load an exported index.
   */
  importIndex(data) {
    if (!data || typeof data !== 'object' || !Array.isArray(data.entries)) {
      throw new Error('Corrupted index data: invalid format');
    }
    this.clear();
    for (const entry of data.entries) {
      if (!entry.fingerprint || !Array.isArray(entry.records)) {
        throw new Error('Corrupted index data: invalid entry');
      }
      this._validateFingerprint(entry.fingerprint);
      this.index.set(entry.fingerprint, entry.records);
      this.totalFragments += entry.records.length;
      for (const record of entry.records) {
        if (record.repositoryId) {
          this.repositories.add(record.repositoryId);
        }
      }
    }
  }

  /**
   * Find high-frequency fragments appearing in more than `threshold` fraction of repositories.
   * Returns array of { fingerprint, repositoryCount, totalRepositories, fraction }.
   */
  identifyCommonFragments(threshold = 0.3) {
    const totalRepos = this.repositories.size;
    if (totalRepos === 0) return [];

    const commonFragments = [];
    for (const [fp, records] of this.index) {
      const repoSet = new Set(records.map(r => r.repositoryId).filter(Boolean));
      const fraction = repoSet.size / totalRepos;
      if (fraction > threshold) {
        commonFragments.push({
          fingerprint: fp,
          repositoryCount: repoSet.size,
          totalRepositories: totalRepos,
          fraction,
          classification: 'COMMON_FRAGMENT'
        });
      }
    }
    return commonFragments;
  }

  /**
   * Linear scan through ALL fragments (for benchmark comparison).
   */
  baselineSearch(queryFingerprint) {
    this._validateFingerprint(queryFingerprint);
    let comparisons = 0;
    const results = [];
    for (const [fp, records] of this.index) {
      comparisons++;
      if (fp === queryFingerprint) {
        results.push(...records);
      }
    }
    return { results, comparisons };
  }

  /**
   * Reset the index.
   */
  clear() {
    this.index.clear();
    this.repositories.clear();
    this.totalFragments = 0;
  }
}

// Export a factory function and the class
module.exports = {
  ProvenanceIndex,
  createIndex: () => new ProvenanceIndex(),
  // Default shared instance
  defaultIndex: new ProvenanceIndex()
};
