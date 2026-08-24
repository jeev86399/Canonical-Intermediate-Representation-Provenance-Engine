import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { Hexagon, Code2, GitCompare } from 'lucide-react';
import Dashboard from './pages/Dashboard';
import CodeEditor from './pages/CodeEditor';
import VerificationPage from './pages/VerificationPage';

function App() {
  return (
    <Router>
      <nav className="nav-header">
        <Link to="/" className="nav-brand">
          <Hexagon className="text-primary" />
          <span>Antigravity CIPE</span>
        </Link>
        <div className="nav-links">
          <Link to="/">Dashboard</Link>
          <Link to="/upload">Code Editor</Link>
          <Link to="/verify">Provenance Verifier</Link>
        </div>
      </nav>
      
      <main className="page-container animate-fade-in">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/upload" element={<CodeEditor />} />
          <Route path="/verify" element={<VerificationPage />} />
        </Routes>
      </main>
    </Router>
  );
}

export default App;
