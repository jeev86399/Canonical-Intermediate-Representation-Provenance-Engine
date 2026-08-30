import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { Hexagon, Activity, FileText, Database, Shield } from 'lucide-react';
import Dashboard from './pages/Dashboard';
import Analyze from './pages/Analyze';
import Compare from './pages/Compare';
import History from './pages/History';
import Evidence from './pages/Evidence';

function App() {
  return (
    <Router>
      <nav className="nav-header">
        <Link to="/" className="nav-brand">
          <Hexagon className="text-primary" />
          <span>CIPE Phase 16</span>
        </Link>
        <div className="nav-links">
          <Link to="/"><Activity size={18}/> Dashboard</Link>
          <Link to="/analyze"><FileText size={18}/> Analyze</Link>
          <Link to="/compare"><Shield size={18}/> Compare</Link>
          <Link to="/history"><Database size={18}/> History</Link>
        </div>
      </nav>
      
      <main className="page-container animate-fade-in">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/analyze" element={<Analyze />} />
          <Route path="/compare" element={<Compare />} />
          <Route path="/history" element={<History />} />
          <Route path="/evidence/:id" element={<Evidence />} />
        </Routes>
      </main>
    </Router>
  );
}

export default App;
