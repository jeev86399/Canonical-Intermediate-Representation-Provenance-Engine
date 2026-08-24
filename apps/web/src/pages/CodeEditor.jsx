import React, { useState } from 'react';
import { Play, Code, Database, Fingerprint, AlertTriangle } from 'lucide-react';
import { analyzeCode } from '../api';

const DEFAULT_CODE = `function calculateTotal(items) {
  let total = 0;
  for (let i = 0; i < items.length; i++) {
    total = total + items[i].price;
  }
  return total;
}
`;

export default function CodeEditor() {
  const [code, setCode] = useState(DEFAULT_CODE);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleAnalyze = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await analyzeCode(code);
      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1 className="title">Code Upload & Analysis</h1>
      <p className="subtitle">Submit JavaScript code to generate the Canonical IR and cryptographic fingerprints.</p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        <div className="glass-panel">
          <textarea 
            className="input-field" 
            value={code} 
            onChange={e => setCode(e.target.value)}
            style={{ minHeight: '300px', fontFamily: 'monospace' }}
          />
          <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'flex-end' }}>
            <button className="btn" onClick={handleAnalyze} disabled={loading}>
              {loading ? <div className="loader"></div> : <Play size={18} />}
              Analyze Code
            </button>
          </div>
        </div>

        <div className="glass-panel">
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <Database className="text-primary" /> Analysis Results
          </h2>
          
          {error && (
            <div style={{ padding: '16px', background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', borderRadius: '8px' }}>
              <strong>Error:</strong> {error}
            </div>
          )}

          {!result && !error && !loading && (
            <p className="text-muted">Run analysis to view the canonical representation.</p>
          )}

          {result && (
            <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {result.databaseWarning && (
                <div style={{ padding: '12px', background: 'rgba(234, 179, 8, 0.1)', color: '#eab308', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <AlertTriangle size={18} /> MongoDB is unreachable. Running in memory-only mode.
                </div>
              )}
              
              <div>
                <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <Fingerprint size={18} /> Global Fingerprint
                </h3>
                <div className="code-block">
                  <pre style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>{result.globalFingerprint}</pre>
                </div>
              </div>

              <div>
                <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <Code size={18} /> Cryptographic Fragments ({result.fragments?.length || 0})
                </h3>
                <div className="code-block" style={{ maxHeight: '300px', overflowY: 'auto' }}>
                  {result.fragments?.map((frag, i) => (
                    <div key={i} style={{ marginBottom: '12px', paddingBottom: '12px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <span className="status-badge" style={{ background: 'rgba(255,255,255,0.1)', color: 'white', marginRight: '8px' }}>
                        {frag.type}
                      </span>
                      <span style={{ color: 'var(--primary)', fontWeight: 'bold' }}>{frag.hash.substring(0, 16)}...</span>
                      
                      {frag.type === 'BlockFragment' && (
                        <div style={{ marginTop: '8px', color: 'var(--text-muted)' }}>
                          Contains {frag.instructionCount} instructions
                        </div>
                      )}
                      {frag.type === 'DataEdgeFragment' && (
                        <div style={{ marginTop: '8px', color: 'var(--text-muted)' }}>
                          Binding: {frag.binding}
                        </div>
                      )}
                      {frag.type === 'ControlEdgeFragment' && (
                        <div style={{ marginTop: '8px', color: 'var(--text-muted)' }}>
                          Condition: {frag.condition}
                        </div>
                      )}
                    </div>
                  ))}
                  {(!result.fragments || result.fragments.length === 0) && (
                    <div className="text-muted">No fragments extracted.</div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
