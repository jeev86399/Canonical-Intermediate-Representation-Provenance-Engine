import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

export default function History() {
  const [history, setHistory] = useState([]);
  const [source, setSource] = useState('');
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch('http://localhost:3001/api/verification/history')
      .then(res => res.json())
      .then(data => {
        setHistory(data.history || []);
        setSource(data.source || 'UNKNOWN');
      })
      .catch(err => setError(err.message));
  }, []);

  return (
    <div className="history-container">
      <header className="page-header">
        <h1>Verification History</h1>
        <p>Source: {source === 'IN_MEMORY' ? 'In-Memory Volatile (Fallback)' : 'MongoDB (Persistent)'}</p>
      </header>

      {error && <div className="error-alert">{error}</div>}

      <div className="card">
        <table className="data-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Verification ID</th>
              <th>Classification</th>
              <th>Audit Hash</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {history.map(item => (
              <tr key={item.verificationId}>
                <td>{new Date(item.timestamp).toLocaleString()}</td>
                <td className="mono">{item.verificationId.substring(0, 16)}...</td>
                <td>
                  <span className={`badge ${item.classification === 'EXACT_MATCH' ? 'success' : item.classification === 'PARTIAL_PROVENANCE' ? 'warning' : 'danger'}`}>
                    {item.classification}
                  </span>
                </td>
                <td className="mono">{item.auditHash ? item.auditHash.substring(0, 16) + '...' : 'N/A'}</td>
                <td>
                  <Link to={`/evidence/${item.verificationId}`} className="btn btn-sm btn-primary">View Evidence</Link>
                </td>
              </tr>
            ))}
            {history.length === 0 && (
              <tr>
                <td colSpan="5" className="text-center">No verification history available.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
