import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';

export default function Evidence() {
  const { id } = useParams();
  const [receipt, setReceipt] = useState(null);
  const [manifest, setManifest] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    Promise.all([
      fetch(`http://localhost:3001/api/verification/${id}/receipt`).then(r => r.ok ? r.json() : null),
      fetch(`http://localhost:3001/api/verification/${id}`).then(r => r.ok ? r.json() : null)
    ])
    .then(([rData, mData]) => {
      if (!rData || !mData) throw new Error('Failed to load evidence');
      setReceipt(rData);
      setManifest(mData);
    })
    .catch(e => setError(e.message));
  }, [id]);

  if (error) return <div className="error-alert">{error}</div>;
  if (!receipt || !manifest) return <div>Loading evidence...</div>;

  const { matchData } = manifest;

  return (
    <div className="evidence-container">
      <header className="page-header">
        <h1>Verification Evidence</h1>
        <p>Verification ID: {receipt.verificationId}</p>
        <h2 className={`status-badge ${receipt.result === 'EXACT_MATCH' ? 'text-success' : receipt.result === 'PARTIAL_PROVENANCE' ? 'text-warning' : 'text-danger'}`}>
          {receipt.result.replace(/_/g, ' ')}
        </h2>
      </header>

      <section className="evidence-section card">
        <h3>DETERMINISTIC EVIDENCE</h3>
        <div className="grid-2">
          <div>
            <p><strong>Evidence Digest (SHA-256):</strong></p>
            <code className="hash-block">{receipt.evidenceDigest}</code>
          </div>
          <div>
            <p><strong>Engine Version:</strong> {receipt.engineVersion}</p>
            <p><strong>Canonicalization:</strong> {receipt.canonicalizationVersion}</p>
            <p><strong>Fingerprint:</strong> {receipt.fingerprintVersion}</p>
          </div>
        </div>
      </section>

      <section className="evidence-section card">
        <h3>EVENT METADATA (Non-Semantic)</h3>
        <p><strong>Generated At:</strong> {new Date(receipt.generatedAt).toISOString()}</p>
        <p><strong>Worker ID:</strong> {receipt.executionMetadata?.workerId || 'UNKNOWN'}</p>
      </section>

      <section className="evidence-section">
        <h3>Fragment Provenance</h3>
        
        <div className="fragment-group">
          <h4>Matched Fragments ({matchData.matchedFragments.length})</h4>
          <div className="fragment-list">
            {matchData.matchedFragments.map(f => (
              <div key={f} className="fragment-item success-bg">
                <span>{f}</span>
                <span className="badge">MATCHED</span>
              </div>
            ))}
          </div>
        </div>

        <div className="fragment-group">
          <h4>Missing Fragments ({matchData.missingFragments.length})</h4>
          <div className="fragment-list">
            {matchData.missingFragments.map(f => (
              <div key={f} className="fragment-item danger-bg">
                <span>{f}</span>
                <span className="badge">MISSING</span>
              </div>
            ))}
          </div>
        </div>

        <div className="fragment-group">
          <h4>Added Fragments ({matchData.addedFragments.length})</h4>
          <div className="fragment-list">
            {matchData.addedFragments.map(f => (
              <div key={f} className="fragment-item warning-bg">
                <span>{f}</span>
                <span className="badge">ADDED</span>
              </div>
            ))}
          </div>
        </div>
      </section>
      
      <div style={{ marginTop: '2rem' }}>
        <Link to="/history" className="btn btn-secondary">Back to History</Link>
      </div>
    </div>
  );
}
