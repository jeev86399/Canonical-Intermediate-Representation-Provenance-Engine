import React from 'react';
import { Link } from 'react-router-dom';
import { PlusCircle, Activity } from 'lucide-react';

export default function Dashboard() {
  return (
    <div>
      <h1 className="title">Projects Dashboard</h1>
      <p className="subtitle">Manage your uploaded JavaScript projects and view analysis status.</p>
      
      <div className="grid">
        <div className="glass-panel">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2>New Project</h2>
            <PlusCircle className="text-primary" />
          </div>
          <p className="text-muted" style={{ margin: '16px 0' }}>Upload a new JavaScript file for canonical IR parsing and fingerprinting.</p>
          <Link to="/upload" className="btn" style={{ textDecoration: 'none' }}>Upload Code</Link>
        </div>
        
        <div className="glass-panel">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2>Provenance Verification</h2>
            <Activity className="text-warning" />
          </div>
          <p className="text-muted" style={{ margin: '16px 0' }}>Compare two projects to detect structural similarities or independent reordering.</p>
          <Link to="/verify" className="btn btn-secondary" style={{ textDecoration: 'none' }}>Verify Projects</Link>
        </div>
      </div>
    </div>
  );
}
