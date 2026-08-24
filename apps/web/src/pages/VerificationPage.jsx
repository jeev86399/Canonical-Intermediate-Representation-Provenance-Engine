import React, { useState } from 'react';
import { ShieldCheck, ArrowRight, GitMerge, AlertCircle, AlertTriangle } from 'lucide-react';
import { compareCode } from '../api';

const DEFAULT_TARGET = `function calculateTotal(items) {
  let total = 0;
  for (let i = 0; i < items.length; i++) {
    total = total + items[i].price;
  }
  return total;
}`;

const DEFAULT_SUSPECT = `const calculateTotal = (arr) => {
  let sum = 0;
  for (let j = 0; j < arr.length; j++) {
    sum = sum + arr[j].price;
  }
  return sum;
}`;

export default function VerificationPage() {
  const [targetCode, setTargetCode] = useState(DEFAULT_TARGET);
  const [suspectCode, setSuspectCode] = useState(DEFAULT_SUSPECT);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleVerify = async () => {
    if (!targetCode || !suspectCode) return;
    setLoading(true);
    setError(null);
    try {
      const data = await compareCode(targetCode, suspectCode);
      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1 className="title">Provenance Verifier</h1>
      <p className="subtitle">Compare two JavaScript snippets to detect structural similarity and plagiarism.</p>

      <div className="glass-panel" style={{ marginBottom: '24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: '24px', alignItems: 'center' }}>
          <div>
            <label className="text-muted" style={{ display: 'block', marginBottom: '8px' }}>Target Code (Original)</label>
            <textarea 
              className="input-field" 
              value={targetCode} 
              onChange={e => setTargetCode(e.target.value)} 
              style={{ minHeight: '300px', fontFamily: 'monospace' }}
            />
          </div>
          
          <ArrowRight className="text-muted" size={32} style={{ marginTop: '24px' }} />
          
          <div>
            <label className="text-muted" style={{ display: 'block', marginBottom: '8px' }}>Suspect Code</label>
            <textarea 
              className="input-field" 
              value={suspectCode} 
              onChange={e => setSuspectCode(e.target.value)} 
              style={{ minHeight: '300px', fontFamily: 'monospace' }}
            />
          </div>
        </div>

        <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'center' }}>
          <button className="btn" onClick={handleVerify} disabled={loading || !targetCode || !suspectCode}>
            {loading ? <div className="loader"></div> : <ShieldCheck size={18} />}
            Verify Provenance
          </button>
        </div>
      </div>

      {error && (
        <div className="glass-panel animate-fade-in" style={{ borderColor: 'rgba(239, 68, 68, 0.3)' }}>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--danger)', margin: '0 0 8px 0' }}>
            <AlertCircle size={20} /> Verification Failed
          </h3>
          <p style={{ margin: 0 }}>{error}</p>
        </div>
      )}

      {result && (
        <div className="glass-panel animate-fade-in">
          {result.databaseWarning && (
            <div style={{ padding: '12px', marginBottom: '16px', background: 'rgba(234, 179, 8, 0.1)', color: '#eab308', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertTriangle size={18} /> MongoDB is unreachable. Audit log was not saved.
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <GitMerge className="text-primary" /> Verification Evidence
            </h2>
            <span className={`status-badge status-${result.status}`}>
              {result.status}
            </span>
          </div>

          <div className="grid" style={{ marginBottom: '24px' }}>
            <div className="glass-panel" style={{ background: 'rgba(0,0,0,0.2)', padding: '16px' }}>
              <h4 className="text-muted" style={{ marginTop: 0 }}>Confidence Score</h4>
              <p style={{ fontSize: '32px', fontWeight: '800', margin: 0, color: 'var(--primary)' }}>
                {(result.confidence * 100).toFixed(1)}%
              </p>
            </div>
            
            <div className="glass-panel" style={{ background: 'rgba(0,0,0,0.2)', padding: '16px' }}>
              <h4 className="text-muted" style={{ marginTop: 0 }}>Matched Fragments</h4>
              <p style={{ fontSize: '32px', fontWeight: '800', margin: 0, color: 'var(--success)' }}>
                {result.matchedFragments} <span style={{fontSize: '18px', color: 'var(--text-muted)'}}>/ {result.totalFragments}</span>
              </p>
            </div>
          </div>

          {result.evidence && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
              <div>
                <h3 style={{ color: 'var(--success)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <ShieldCheck size={18} /> Matched Hashes
                </h3>
                <div className="code-block" style={{ maxHeight: '250px', overflowY: 'auto', borderColor: 'rgba(34, 197, 94, 0.2)' }}>
                  {result.evidence.matched?.map((hash, i) => (
                    <div key={i} style={{ fontFamily: 'monospace', fontSize: '12px', padding: '4px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <span style={{ color: 'var(--success)' }}>✔</span> {hash}
                    </div>
                  ))}
                  {(!result.evidence.matched || result.evidence.matched.length === 0) && (
                    <div className="text-muted">No matched fragments found.</div>
                  )}
                </div>
              </div>

              <div>
                <h3 style={{ color: 'var(--danger)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <AlertCircle size={18} /> Missing / Added Hashes
                </h3>
                <div className="code-block" style={{ maxHeight: '250px', overflowY: 'auto', borderColor: 'rgba(239, 68, 68, 0.2)' }}>
                  {result.evidence.missing?.map((hash, i) => (
                    <div key={`m-${i}`} style={{ fontFamily: 'monospace', fontSize: '12px', padding: '4px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <span style={{ color: 'var(--danger)' }}>-</span> {hash}
                    </div>
                  ))}
                  {result.evidence.added?.map((hash, i) => (
                    <div key={`a-${i}`} style={{ fontFamily: 'monospace', fontSize: '12px', padding: '4px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <span style={{ color: 'var(--warning)' }}>+</span> {hash}
                    </div>
                  ))}
                  {(!result.evidence.missing?.length && !result.evidence.added?.length) && (
                    <div className="text-muted">No missing or added fragments. Exact match!</div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
