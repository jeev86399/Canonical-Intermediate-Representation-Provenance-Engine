/**
 * Provenance Lineage Tracker (Phase 12)
 *
 * Tracks the evolution of fragments across commits and repositories.
 * Identifies transitions: ORIGIN, COPIED, MODIFIED, MOVED, SPLIT, MERGED, DISAPPEARED, REAPPEARED, UNKNOWN
 */

/**
 * Traces a specific logical fragment across a timeline of commits.
 * 
 * @param {String} targetHash - The fingerprint of the fragment to trace
 * @param {Array<Object>} timeline - Chronological array of commit metadata containing fragments
 * @returns {Array<Object>} List of lineage events
 */
function traceLineage(targetHash, timeline) {
  if (!timeline || timeline.length === 0) {
    return [{ event: 'UNKNOWN', reasoning: 'No timeline provided' }];
  }

  const events = [];
  let currentlyExists = false;
  let firstSeen = false;
  let lastSeenFilePath = null;

  for (const point of timeline) {
    const { repositoryId, commitHash, files } = point;
    // files is an array of { filePath, fragments: [] }
    
    let foundInCurrentPoint = false;
    let foundFilePath = null;
    
    for (const file of files) {
      const hasFrag = file.fragments.some(f => f.hash === targetHash);
      if (hasFrag) {
        foundInCurrentPoint = true;
        foundFilePath = file.filePath;
        break;
      }
    }

    const eventCtx = { repositoryId, commitHash, filePath: foundFilePath };

    if (foundInCurrentPoint) {
      if (!firstSeen) {
        firstSeen = true;
        currentlyExists = true;
        lastSeenFilePath = foundFilePath;
        events.push({ event: 'ORIGIN', ...eventCtx, reasoning: 'Fragment first appeared in history.' });
      } else if (!currentlyExists) {
        currentlyExists = true;
        lastSeenFilePath = foundFilePath;
        events.push({ event: 'REAPPEARED', ...eventCtx, reasoning: 'Fragment was absent in previous commit but is now present.' });
      } else {
        // Existed before, exists now
        if (foundFilePath !== lastSeenFilePath && lastSeenFilePath !== null) {
          events.push({ event: 'MOVED', ...eventCtx, fromPath: lastSeenFilePath, reasoning: 'Fragment file location changed.' });
          lastSeenFilePath = foundFilePath;
        } else {
          // It's just persisted, usually we don't need a specific event for "STILL_EXISTS" unless it was modified.
          // But since the hash is the same, it's NOT modified. It's an exact match.
        }
      }
    } else {
      // Not found in current point
      if (firstSeen && currentlyExists) {
        currentlyExists = false;
        events.push({ event: 'DISAPPEARED', repositoryId, commitHash, reasoning: 'Fragment is no longer present.' });
      }
    }
  }

  if (events.length === 0) {
    events.push({ event: 'INSUFFICIENT_EVIDENCE', reasoning: 'Fragment never found in provided timeline.' });
  }

  return events;
}

/**
 * Compares two fragments to determine if one is a modified/split/merged version of the other.
 * This requires AST-level analysis or partial structural analysis.
 * For Phase 12, we can return UNKNOWN if we don't have enough evidence.
 */
function classifyTransition(oldFragments, newFragments) {
  // This is a stub for advanced structural transition classification (SPLIT, MERGED, MODIFIED)
  // which requires deep graph analysis.
  return 'INSUFFICIENT_EVIDENCE';
}

module.exports = {
  traceLineage,
  classifyTransition
};
