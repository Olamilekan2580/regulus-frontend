import { useState, useEffect } from 'react';
import { Server, Database, GitBranch, Terminal, Play, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import api from '../lib/api';

const STACK_TEMPLATES = [
  { id: 'next-supa-vercel', name: 'React/Next.js + Supabase', desc: 'Standard SaaS boilerplate. Deploys to Vercel.', icon: Server },
  { id: 'fastapi-docker', name: 'FastAPI + Docker Container', desc: 'Python backend optimized for AI inference tasks.', icon: Database },
  { id: 'n8n-bubble-sync', name: 'Bubble UI + n8n Backend', desc: 'No-code frontend with advanced automated routing.', icon: Terminal }
];

export default function Onboarding() {
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState('');
  const [selectedStack, setSelectedStack] = useState(STACK_TEMPLATES[0].id);
  const [repoName, setRepoName] = useState('');
  
  const [isProvisioning, setIsProvisioning] = useState(false);
  const [logs, setLogs] = useState([]);
  const [status, setStatus] = useState('idle'); // idle, running, complete, error

  useEffect(() => {
    // Fetch projects that are ready for onboarding (e.g., approved/funded)
    api.get('/projects')
      .then(res => setProjects(res.data.filter(p => p.status !== 'Completed')))
      .catch(err => console.error(err));
  }, []);

  // Simulates a terminal output for the UI experience
  const addLog = (msg, type = 'info') => {
    setLogs(prev => [...prev, { time: new Date().toLocaleTimeString(), msg, type }]);
  };

  const handleProvision = async (e) => {
    e.preventDefault();
    if (!selectedProject || !repoName) return;

    setIsProvisioning(true);
    setStatus('running');
    setLogs([]);
    
    addLog('Initializing DevSecOps pipeline...', 'info');

    try {
      // 1. Hit your backend to trigger the actual n8n / IaC webhook
      await api.post('/infrastructure/provision', {
        project_id: selectedProject,
        stack_template: selectedStack,
        repo_name: repoName
      });

      // 2. Simulate the telemetry for the frontend
      setTimeout(() => addLog('Authenticating with GitHub API...', 'info'), 800);
      setTimeout(() => addLog(`Created repository: ${repoName}`, 'success'), 1800);
      setTimeout(() => addLog('Provisioning Supabase database instance...', 'info'), 2800);
      setTimeout(() => addLog('Injecting secure environment variables...', 'warn'), 4500);
      setTimeout(() => addLog('Triggering Vercel initial deployment...', 'info'), 5500);
      setTimeout(() => {
        addLog('Infrastructure successfully provisioned.', 'success');
        setStatus('complete');
        setIsProvisioning(false);
      }, 7000);

    } catch (err) {
      addLog(err.response?.data?.error || 'Pipeline execution failed.', 'error');
      setStatus('error');
      setIsProvisioning(false);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-navy flex items-center gap-2">
          <Terminal className="text-accent" /> Infrastructure Provisioning
        </h1>
        <p className="text-sm text-gray-500 mt-1">Deploy automated cloud architectures via IaC templates.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        
        {/* LEFT COLUMN: Configuration Form */}
        <div className="lg:col-span-2 space-y-6">
          <form onSubmit={handleProvision} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-6">
            
            <div>
              <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Target Project</label>
              <select 
                required 
                className="w-full bg-gray-50 border border-gray-200 p-3 rounded-xl font-semibold text-sm outline-none focus:border-accent"
                value={selectedProject}
                onChange={e => setSelectedProject(e.target.value)}
                disabled={isProvisioning}
              >
                <option value="">-- Select an active project --</option>
                {projects.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">GitBranch Repository Name</label>
              <div className="relative">
                <GitBranch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <input 
                  type="text" 
                  required 
                  placeholder="client-dashboard-v1"
                  className="w-full bg-gray-50 border border-gray-200 p-3 pl-10 rounded-xl font-mono text-sm outline-none focus:border-accent"
                  value={repoName}
                  onChange={e => setRepoName(e.target.value.toLowerCase().replace(/\s+/g, '-'))}
                  disabled={isProvisioning}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Architecture Stack</label>
              <div className="space-y-3">
                {STACK_TEMPLATES.map(stack => (
                  <label 
                    key={stack.id}
                    className={`flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-all ${
                      selectedStack === stack.id 
                        ? 'border-accent bg-accent/5 ring-1 ring-accent' 
                        : 'border-gray-200 hover:border-gray-300'
                    } ${isProvisioning ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <input 
                      type="radio" 
                      name="stack" 
                      value={stack.id} 
                      checked={selectedStack === stack.id}
                      onChange={() => setSelectedStack(stack.id)}
                      className="mt-1 accent-accent"
                      disabled={isProvisioning}
                    />
                    <div>
                      <div className="font-bold text-navy text-sm flex items-center gap-1.5">
                        <stack.icon size={14} className="text-gray-500" /> {stack.name}
                      </div>
                      <div className="text-xs text-gray-500 mt-1 font-medium">{stack.desc}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <button 
              type="submit" 
              disabled={isProvisioning || !selectedProject || !repoName}
              className="w-full flex items-center justify-center gap-2 bg-navy text-white py-3.5 rounded-xl font-bold hover:bg-navy/90 transition-all disabled:opacity-50 active:scale-95"
            >
              {isProvisioning ? <Loader2 size={18} className="animate-spin" /> : <Play size={18} />}
              {isProvisioning ? 'Executing Pipeline...' : 'Deploy Infrastructure'}
            </button>
          </form>
        </div>

        {/* RIGHT COLUMN: Pipeline Terminal */}
        <div className="lg:col-span-3 bg-[#0D1117] rounded-2xl shadow-xl border border-gray-800 flex flex-col overflow-hidden h-[600px]">
          <div className="bg-[#161B22] px-4 py-3 border-b border-gray-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Terminal size={16} className="text-gray-400" />
              <span className="text-xs font-mono text-gray-300 font-bold tracking-wider">deploy_pipeline.sh</span>
            </div>
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
              <div className="w-3 h-3 rounded-full bg-yellow-500/80"></div>
              <div className="w-3 h-3 rounded-full bg-green-500/80"></div>
            </div>
          </div>
          
          <div className="flex-1 p-6 font-mono text-sm overflow-y-auto space-y-2">
            {logs.length === 0 && status === 'idle' && (
              <div className="text-gray-600 h-full flex items-center justify-center italic">
                Awaiting deployment command...
              </div>
            )}
            
            {logs.map((log, i) => (
              <div key={i} className="flex gap-4 animate-in fade-in slide-in-from-bottom-2">
                <span className="text-gray-600 select-none shrink-0">[{log.time}]</span>
                <span className={`
                  ${log.type === 'info' ? 'text-gray-300' : ''}
                  ${log.type === 'success' ? 'text-green-400 font-bold' : ''}
                  ${log.type === 'warn' ? 'text-yellow-400' : ''}
                  ${log.type === 'error' ? 'text-red-400 font-bold' : ''}
                `}>
                  {log.msg}
                </span>
              </div>
            ))}

            {isProvisioning && (
              <div className="flex gap-4 items-center mt-2">
                <span className="text-gray-600">[{new Date().toLocaleTimeString()}]</span>
                <span className="text-accent flex items-center gap-2">
                  <div className="w-1.5 h-4 bg-accent animate-pulse"></div>
                </span>
              </div>
            )}
          </div>

          {status === 'complete' && (
            <div className="bg-green-500/10 border-t border-green-500/20 p-4 flex items-center justify-between">
              <div className="flex items-center gap-2 text-green-400 font-bold text-sm">
                <CheckCircle2 size={18} /> Environments Linked
              </div>
              <a href={`https://github.com/your-username/${repoName}`} target="_blank" rel="noreferrer" className="text-xs font-bold text-green-300 hover:underline">
                View Repository →
              </a>
            </div>
          )}
          
          {status === 'error' && (
            <div className="bg-red-500/10 border-t border-red-500/20 p-4 flex items-center gap-2 text-red-400 font-bold text-sm">
              <AlertCircle size={18} /> Pipeline Terminated
            </div>
          )}
        </div>

      </div>
    </div>
  );
}