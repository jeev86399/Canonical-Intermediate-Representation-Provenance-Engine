import React, { useState } from 'react';
import { ShieldCheck, ArrowRight, GitMerge, AlertCircle, AlertTriangle, FileCode2, Network } from 'lucide-react';
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
      <h1 className="title">Phase 12: Explainable Provenance Verification</h1>
      <p className="subtitle">Deterministic structural relationship engine with evidence graph visualization.</p>

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
            Generate Evidence Graph
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
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <GitMerge className="text-primary" /> Verification Report
            </h2>
            <span className={`status-badge status-${result.status}`}>
              {result.status}
            </span>
          </div>

          <p style={{ color: 'var(--text-muted)', marginBottom: '24px', fontSize: '1.1rem' }}>
            <strong>Reasoning:</strong> {result.reasoning}
          </p>

          <div className="grid" style={{ marginBottom: '24px' }}>
            <div className="glass-panel" style={{ background: 'rgba(0,0,0,0.2)', padding: '16px' }}>
              <h4 className="text-muted" style={{ marginTop: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Network size={16} /> Rare Evidence Matches
              </h4>
              <p style={{ fontSize: '32px', fontWeight: '800', margin: 0, color: 'var(--success)' }}>
                {result.rareMatched}
              </p>
            </div>
            
            <div className="glass-panel" style={{ background: 'rgba(0,0,0,0.2)', padding: '16px' }}>
              <h4 className="text-muted" style={{ marginTop: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
                <FileCode2 size={16} /> Common Boilerplate
              </h4>
              <p style={{ fontSize: '32px', fontWeight: '800', margin: 0, color: 'var(--warning)' }}>
                {result.commonMatched}
              </p>
            </div>
            
            <div className="glass-panel" style={{ background: 'rgba(0,0,0,0.2)', padding: '16px' }}>
              <h4 className="text-muted" style={{ marginTop: 0 }}>Total Target Fragments</h4>
              <p style={{ fontSize: '32px', fontWeight: '800', margin: 0, color: 'var(--text-muted)' }}>
                {result.totalTargetFragments}
              </p>
            </div>
          </div>

          {result.evidenceGraph && (
            <div>
              <h3 style={{ color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                <Network size={18} /> Evidence Graph Topological Proof
              </h3>
              <div className="code-block" style={{ maxHeight: '400px', overflowY: 'auto' }}>
                {result.evidenceGraph.nodes.filter(n => n.type === 'Fingerprint').map((fp, i) => (
                  <div key={i} style={{ 
                    fontFamily: 'monospace', 
                    fontSize: '12px', 
                    padding: '8px', 
                    marginBottom: '8px',
                    borderRadius: '4px',
                    background: fp.properties.type === 'UNIQUE' ? 'rgba(34, 197, 94, 0.1)' : 
                                fp.properties.type === 'COMMON_BOILERPLATE' ? 'rgba(234, 179, 8, 0.1)' : 
                                'rgba(168, 85, 247, 0.1)',
                    border: '1px solid',
                    borderColor: fp.properties.type === 'UNIQUE' ? 'rgba(34, 197, 94, 0.3)' : 
                                 fp.properties.type === 'COMMON_BOILERPLATE' ? 'rgba(234, 179, 8, 0.3)' : 
                                 'rgba(168, 85, 247, 0.3)'
                  }}>
                    <strong style={{ color: fp.properties.type === 'UNIQUE' ? 'var(--success)' : 
                                            fp.properties.type === 'COMMON_BOILERPLATE' ? 'var(--warning)' : 
                                            '#a855f7' }}>
                      [{fp.properties.type}]
                    </strong>{' '}
                    {fp.properties.hash}
                  </div>
                ))}
                {result.evidenceGraph.nodes.filter(n => n.type === 'Fingerprint').length === 0 && (
                  <div className="text-muted">No topological evidence detected.</div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
