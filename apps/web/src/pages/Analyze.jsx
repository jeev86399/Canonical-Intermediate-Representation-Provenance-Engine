import React, { useState } from 'react';

export default function Analyze() {
  const [source, setSource] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleAnalyze = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('http://localhost:3001/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ source })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.details || data.error);
      setResult(data.result);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="analyze-container">
      <header className="page-header">
        <h1>Single Source Analysis</h1>
        <p>Analyze canonical fragments of a raw snippet</p>
      </header>
      
      <div className="editor-section">
        <textarea 
          className="code-input"
          value={source}
          onChange={e => setSource(e.target.value)}
          placeholder="Paste JavaScript code here..."
        />
        <button className="btn btn-primary" onClick={handleAnalyze} disabled={loading || !source.trim()}>
          {loading ? 'Analyzing...' : 'Analyze Source'}
        </button>
      </div>

      {error && <div className="error-alert">{error}</div>}

      {result && (
        <div className="results-panel">
          <h3>Analysis Result</h3>
          <p>Fragments extracted: {result.fragmentCount}</p>
          <div className="fragment-list">
            {result.fragments.map((f, i) => (
              <div key={i} className="fragment-item">
                <span className="fragment-type">{f.type}</span>
                <span className="fragment-hash">{f.hash}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
