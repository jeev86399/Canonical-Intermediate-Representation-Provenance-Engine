/**
 * Common Fragment Suppression (Phase 12)
 *
 * Implements a frequency-based weighting model to suppress common boilerplate,
 * preventing independent equivalent algorithms from generating false positives.
 */

class CommonFragmentSuppressor {
  constructor() {
    this.frequencyMap = new Map();
    this.totalCorpusSize = 0;
  }

  /**
   * Train the suppressor on a corpus of known boilerplate or independent code.
   * @param {Array<Object>} corpusFragments - List of all fragments in the training corpus
   */
  train(corpusFragments) {
    for (const frag of corpusFragments) {
      const count = this.frequencyMap.get(frag.hash) || 0;
      this.frequencyMap.set(frag.hash, count + 1);
    }
    // We approximate corpus size by the number of unique "documents" or just total fragments.
    // For simplicity, we track total fragments processed.
    this.totalCorpusSize += corpusFragments.length;
  }

  /**
   * Identifies fingerprints that appear so frequently they should be classified as common boilerplate.
   * @param {Number} thresholdPercentage - e.g., 0.05 means appears more than 5% of the time
   * @returns {Set<String>} Set of common fingerprints
   */
  getCommonFingerprints(thresholdPercentage = 0.05) {
    const common = new Set();
    if (this.totalCorpusSize === 0) return common;

    const absoluteThreshold = Math.max(2, this.totalCorpusSize * thresholdPercentage);

    for (const [hash, count] of this.frequencyMap.entries()) {
      if (count >= absoluteThreshold) {
        common.add(hash);
      }
    }
    return common;
  }

  /**
   * Calculates a uniqueness weight for a specific fragment.
   * 1.0 = extremely rare (high evidence)
   * 0.0 = ubiquitous (no evidence)
   * 
   * @param {String} hash 
   * @returns {Number} Weight between 0 and 1
   */
  getWeight(hash) {
    const count = this.frequencyMap.get(hash) || 0;
    if (count === 0) return 1.0; // Unseen, max weight
    if (this.totalCorpusSize === 0) return 1.0;

    const freq = count / this.totalCorpusSize;
    
    // Inverse Document Frequency (IDF) style weighting
    // tf-idf: idf = log(N / df)
    // We normalize to [0, 1] for easier reasoning.
    const maxLog = Math.log(this.totalCorpusSize + 1);
    const weight = Math.log(this.totalCorpusSize / count) / maxLog;
    
    return Math.max(0, Math.min(1.0, weight));
  }
}

module.exports = {
  CommonFragmentSuppressor
};
