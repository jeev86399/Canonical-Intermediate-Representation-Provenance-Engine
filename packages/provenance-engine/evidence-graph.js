/**
 * Evidence Graph Builder (Phase 12)
 *
 * Constructs a structured graph representation of provenance evidence,
 * linking repositories, commits, files, fragments, and fingerprints.
 */

function buildEvidenceGraph(targetMetadata, suspectMetadata, verificationResult, matchedRare, matchedCommon) {
  // targetMetadata and suspectMetadata should have: repositoryId, commitHash, filePath, fragments[]
  
  const graph = {
    nodes: [],
    edges: []
  };

  const addNode = (id, type, properties) => {
    graph.nodes.push({ id, type, properties });
  };

  const addEdge = (source, target, relationship) => {
    graph.edges.push({ source, target, relationship });
  };

  // 1. Repositories
  const targetRepoId = `repo:${targetMetadata.repositoryId}`;
  const suspectRepoId = `repo:${suspectMetadata.repositoryId}`;
  addNode(targetRepoId, 'Repository', { name: targetMetadata.repositoryId });
  addNode(suspectRepoId, 'Repository', { name: suspectMetadata.repositoryId });

  // 2. Commits
  const targetCommitId = `commit:${targetMetadata.repositoryId}:${targetMetadata.commitHash}`;
  const suspectCommitId = `commit:${suspectMetadata.repositoryId}:${suspectMetadata.commitHash}`;
  addNode(targetCommitId, 'Commit', { hash: targetMetadata.commitHash });
  addNode(suspectCommitId, 'Commit', { hash: suspectMetadata.commitHash });
  addEdge(targetCommitId, targetRepoId, 'BELONGS_TO');
  addEdge(suspectCommitId, suspectRepoId, 'BELONGS_TO');

  // 3. Files
  const targetFileId = `file:${targetMetadata.commitHash}:${targetMetadata.filePath}`;
  const suspectFileId = `file:${suspectMetadata.commitHash}:${suspectMetadata.filePath}`;
  addNode(targetFileId, 'File', { path: targetMetadata.filePath });
  addNode(suspectFileId, 'File', { path: suspectMetadata.filePath });
  addEdge(targetFileId, targetCommitId, 'PART_OF');
  addEdge(suspectFileId, suspectCommitId, 'PART_OF');

  // 4. Fragments & Fingerprints
  const matchedRareSet = new Set(matchedRare);
  const matchedCommonSet = new Set(matchedCommon);

  const processFragments = (fragments, fileId, prefix) => {
    fragments.forEach((frag, idx) => {
      const fragId = `frag:${prefix}:${idx}:${frag.hash}`;
      const fingerprintId = `fingerprint:${frag.hash}`;
      
      addNode(fragId, 'Fragment', { type: frag.content?.type || 'Logical', size: frag.content?.size || 0 });
      addEdge(fragId, fileId, 'EXTRACTED_FROM');

      // Add fingerprint node if not exists
      if (!graph.nodes.find(n => n.id === fingerprintId)) {
        let fpType = 'UNIQUE';
        if (matchedCommonSet.has(frag.hash)) fpType = 'COMMON_BOILERPLATE';
        else if (matchedRareSet.has(frag.hash)) fpType = 'SHARED_EVIDENCE';
        
        addNode(fingerprintId, 'Fingerprint', { hash: frag.hash, type: fpType });
      }

      addEdge(fragId, fingerprintId, 'HAS_FINGERPRINT');
    });
  };

  processFragments(targetMetadata.fragments || [], targetFileId, 'target');
  processFragments(suspectMetadata.fragments || [], suspectFileId, 'suspect');

  // 5. Verification Result
  const resultId = `result:${Date.now()}`;
  addNode(resultId, 'VerificationResult', {
    status: verificationResult.status,
    reasoning: verificationResult.reasoning
  });
  addEdge(resultId, suspectFileId, 'VERIFIES');
  addEdge(resultId, targetFileId, 'AGAINST');

  return graph;
}

module.exports = {
  buildEvidenceGraph
};
