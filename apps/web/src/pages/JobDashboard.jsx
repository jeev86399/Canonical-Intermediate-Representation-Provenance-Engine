import { useState, useEffect } from 'react';
import { Activity, Play, StopCircle, RefreshCw, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import api from '../api';

export default function JobDashboard() {
  const [jobs, setJobs] = useState([]);
  const [repoInput, setRepoInput] = useState('mock-100');
  const [commitInput, setCommitInput] = useState('HEAD');
  const [polling, setPolling] = useState(true);
  const [error, setError] = useState(null);

  const fetchJobDetails = async (jobId) => {
    try {
      const res = await api.get(`/api/jobs/${jobId}`);
      return res.data;
    } catch (err) {
      return null;
    }
  };

  useEffect(() => {
    let interval;
    if (polling) {
      interval = setInterval(async () => {
        const updatedJobs = await Promise.all(
          jobs.map(async (job) => {
            if (job.status === 'RUNNING' || job.status === 'QUEUED') {
              const fullJob = await fetchJobDetails(job.jobId);
              return fullJob || job;
            }
            return job;
          })
        );
        // Only update if things changed
        setJobs([...updatedJobs]);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [jobs, polling]);

  const submitJob = async () => {
    try {
      setError(null);
      const res = await api.post('/api/repositories/analyze', { repository: repoInput, commit: commitInput });
      const newJob = await fetchJobDetails(res.data.jobId);
      if (newJob) {
        setJobs([newJob, ...jobs]);
      }
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    }
  };

  const cancelJob = async (id) => {
    try {
      await api.post(`/api/jobs/${id}/cancel`);
      setJobs(jobs.map(j => j.jobId === id ? { ...j, status: 'CANCELLED' } : j));
    } catch (err) {
      console.error(err);
    }
  };

  const getStatusIcon = (status) => {
    switch(status) {
      case 'COMPLETED': return <CheckCircle className="text-success w-5 h-5" />;
      case 'FAILED': return <XCircle className="text-danger w-5 h-5" />;
      case 'CANCELLED': return <StopCircle className="text-gray-400 w-5 h-5" />;
      case 'RUNNING': return <RefreshCw className="text-primary w-5 h-5 animate-spin" />;
      default: return <Activity className="text-gray-400 w-5 h-5" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Analysis Job Engine</h1>
          <p className="text-gray-500 mt-2">Asynchronous, incremental repository ingestion queue.</p>
        </div>
        <div className="flex items-center space-x-2 bg-gray-100 dark:bg-gray-800 p-2 rounded-lg">
          <span className="text-sm text-gray-600 dark:text-gray-300">Live Polling:</span>
          <button 
            onClick={() => setPolling(!polling)}
            className={`w-12 h-6 rounded-full relative transition-colors ${polling ? 'bg-primary' : 'bg-gray-400'}`}
          >
            <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${polling ? 'translate-x-6' : ''}`} />
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
        <div className="flex space-x-4">
          <input
            type="text"
            className="input flex-1"
            placeholder="Repository (e.g. mock-100, mock-1000)"
            value={repoInput}
            onChange={(e) => setRepoInput(e.target.value)}
          />
          <input
            type="text"
            className="input w-32"
            placeholder="Commit"
            value={commitInput}
            onChange={(e) => setCommitInput(e.target.value)}
          />
          <button className="btn btn-primary flex items-center gap-2" onClick={submitJob}>
            <Play className="w-4 h-4" /> Enqueue Job
          </button>
        </div>
        {error && <p className="text-danger text-sm mt-2">{error}</p>}
      </div>

      <div className="space-y-4">
        {jobs.length === 0 ? (
          <div className="text-center py-12 text-gray-500">No active jobs in the queue.</div>
        ) : (
          jobs.map(job => (
            <div key={job.jobId} className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center space-x-3">
                  {getStatusIcon(job.status)}
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      {job.repository} <span className="text-sm font-normal text-gray-500">@{job.commit}</span>
                    </h3>
                    <p className="text-xs text-gray-400">ID: {job.jobId}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium uppercase
                    ${job.status === 'COMPLETED' ? 'bg-green-100 text-green-700' : 
                      job.status === 'FAILED' ? 'bg-red-100 text-red-700' : 
                      job.status === 'RUNNING' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'}`}>
                    {job.status}
                  </span>
                  {(job.status === 'RUNNING' || job.status === 'QUEUED') && (
                    <button onClick={() => cancelJob(job.jobId)} className="text-gray-400 hover:text-danger">
                      <StopCircle className="w-5 h-5" />
                    </button>
                  )}
                </div>
              </div>

              {job.status === 'RUNNING' && (
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-4">
                  <div className="bg-primary h-2 rounded-full transition-all duration-300" style={{ width: `${job.progress}%` }} />
                </div>
              )}

              {/* Error and Failure Transparency */}
              {job.status === 'FAILED' && (
                <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 rounded-lg flex items-start space-x-3">
                  <AlertTriangle className="text-danger w-5 h-5 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-medium text-danger">Job Execution Failed</h4>
                    <p className="text-sm text-red-700 dark:text-red-400 mt-1">{job.error}</p>
                  </div>
                </div>
              )}

              {/* Partial Analysis Transparency */}
              {job.result?.warnings?.length > 0 && (
                <div className="mt-4 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800 rounded-lg">
                  <h4 className="text-sm font-medium text-amber-800 dark:text-amber-400 flex items-center">
                    <AlertTriangle className="w-4 h-4 mr-2" /> Partial Analysis Triggered
                  </h4>
                  <ul className="mt-2 text-sm text-amber-700 dark:text-amber-300 list-disc list-inside">
                    {job.result.warnings.map((w, i) => <li key={i}>{w}</li>)}
                  </ul>
                </div>
              )}

              {/* Results & Stats */}
              {job.status === 'COMPLETED' && job.telemetry && (
                <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                  <div>
                    <p className="text-xs text-gray-500 uppercase">Files Analyzed</p>
                    <p className="text-lg font-semibold text-gray-900 dark:text-white">{job.telemetry.fileCount}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase">Fragments Indexed</p>
                    <p className="text-lg font-semibold text-gray-900 dark:text-white">{job.telemetry.fragmentCount}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase">Execution Time</p>
                    <p className="text-lg font-semibold text-gray-900 dark:text-white">{job.telemetry.executionTime}ms</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase">Files Skipped</p>
                    <p className="text-lg font-semibold text-gray-900 dark:text-white">{job.result?.filesSkipped?.length || 0}</p>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
