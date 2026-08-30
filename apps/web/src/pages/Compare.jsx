import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Compare() {
  const [baseRepoPath, setBaseRepoPath] = useState('');
  const [targetRepoPath, setTargetRepoPath] = useState('');
  const [jobId, setJobId] = useState(null);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('');
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const startComparison = async () => {
    setError(null);
    setJobId(null);
    try {
      const res = await fetch('http://localhost:3001/api/compare-repositories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ baseRepoPath, targetRepoPath })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.details || data.error);
      setJobId(data.jobId);
      setStatus(data.status);
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => {
    if (!jobId || status === 'COMPLETED' || status === 'FAILED' || status === 'CANCELLED') return;

    const interval = setInterval(async () => {
      try {
        const pRes = await fetch(`http://localhost:3001/api/jobs/${jobId}/progress`);
        const pData = await pRes.json();
        
        if (pRes.ok) {
          setProgress(pData.progress);
          setStatus(pData.status);

          if (pData.status === 'COMPLETED') {
            clearInterval(interval);
            // Fetch result to get verificationId
            const rRes = await fetch(`http://localhost:3001/api/jobs/${jobId}/result`);
            const rData = await rRes.json();
            if (rRes.ok && rData.receipt) {
              navigate(`/evidence/${rData.receipt.verificationId}`);
            }
          } else if (pData.status === 'FAILED') {
            clearInterval(interval);
            setError('Job failed. Please check logs.');
          }
        }
      } catch (e) {
        console.error(e);
      }
    }, 500);

    return () => clearInterval(interval);
  }, [jobId, status, navigate]);

  return (
    <div className="compare-container">
      <header className="page-header">
        <h1>Repository Comparison</h1>
        <p>Trigger rigorous multi-file provenance verification</p>
      </header>

      <div className="form-group">
        <label>Base Repository Absolute Path</label>
        <input 
          type="text" 
          value={baseRepoPath} 
          onChange={e => setBaseRepoPath(e.target.value)}
          placeholder="/path/to/base/repo"
        />
      </div>

      <div className="form-group">
        <label>Target Repository Absolute Path</label>
        <input 
          type="text" 
          value={targetRepoPath} 
          onChange={e => setTargetRepoPath(e.target.value)}
          placeholder="/path/to/target/repo"
        />
      </div>

      <button className="btn btn-primary" onClick={startComparison} disabled={!baseRepoPath || !targetRepoPath || status === 'RUNNING' || status === 'QUEUED'}>
        Start Verification Job
      </button>

      {error && <div className="error-alert">{error}</div>}

      {jobId && status !== 'COMPLETED' && (
        <div className="progress-panel">
          <h3>Job ID: {jobId}</h3>
          <p>Status: {status}</p>
          <div className="progress-bar-bg">
            <div className="progress-bar-fill" style={{ width: `${progress}%` }}></div>
          </div>
          <p>{progress}%</p>
        </div>
      )}
    </div>
  );
}
