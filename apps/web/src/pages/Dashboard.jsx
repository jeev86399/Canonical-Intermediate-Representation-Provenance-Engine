import React, { useState, useEffect } from 'react';
import { Activity, ShieldCheck, Database, GitBranch } from 'lucide-react';

export default function Dashboard() {
  const [audit, setAudit] = useState(null);

  useEffect(() => {
    fetch('http://localhost:3001/api/verification/audit')
      .then(res => res.json())
      .then(data => setAudit(data))
      .catch(err => console.error(err));
  }, []);

  return (
    <div className="dashboard-container">
      <header className="page-header">
        <h1>System Dashboard</h1>
        <p>CIPE Phase 16 E2E Verification Platform</p>
      </header>
      
      <div className="metrics-grid">
        <div className="metric-card">
          <Activity className="metric-icon text-primary" />
          <h3>Engine Status</h3>
          <p className="metric-value text-success">ONLINE</p>
        </div>
        <div className="metric-card">
          <ShieldCheck className="metric-icon text-primary" />
          <h3>Audit Chain</h3>
          <p className={`metric-value ${audit?.status === 'AUDIT_CHAIN_VALID' ? 'text-success' : 'text-danger'}`}>
            {audit ? audit.status.replace(/_/g, ' ') : 'LOADING...'}
          </p>
        </div>
        <div className="metric-card">
          <Database className="metric-icon text-primary" />
          <h3>Database</h3>
          <p className="metric-value">MongoDB / Local</p>
        </div>
      </div>
    </div>
  );
}
