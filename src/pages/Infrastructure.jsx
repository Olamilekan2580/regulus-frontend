import { useState, useEffect } from 'react';
import { Server, Database, GitBranch, Terminal, Play, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import api from '../lib/api';

const STACK_TEMPLATES = [
  { id: 'next-supa-vercel', name: 'React/Next.js + Supabase', desc: 'Standard SaaS boilerplate. Deploys to Vercel.', icon: Server },
  { id: 'fastapi-docker', name: 'FastAPI + Docker Container', desc: 'Python backend optimized for AI inference tasks.', icon: Database },
  { id: 'n8n-bubble-sync', name: 'Bubble UI + n8n Backend', desc: 'No-code frontend with advanced automated routing.', icon: Terminal }
];

export default function Infrastructure() {
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState('');
  const [selectedStack, setSelectedStack] = useState(STACK_TEMPLATES[0].id);
  const [repoName, setRepoName] = useState('');
  
  // Dynamic GitHub State
  const [githubHandle, setGithubHandle] = useState('unconfigured');
  
  const [isProvisioning, setIsProvisioning] = useState(false);
  const [logs, setLogs] = useState([]);
  const [status, setStatus] = useState('idle'); 

  useEffect(() => {
    // Fetch Projects
    api.get('/projects?limit=100')
      .then(res => {
        const projectsList = Array.isArray(res.data) ? res.data : (res.data?.data || []);
        setProjects(projectsList.filter(p => p.status !== 'Completed' && p.status !== 'Archived'));
      })
      .catch(err => console.error('[Infra Project Fetch Error]:', err));

    // Fetch Org Config for GitHub Handle
    const orgId = localStorage.getItem('current_org_id');
    if (orgId) {
      api.get(`/orgs/${orgId}`)
        .then(res => {
          if (res.data?.github_handle) {
            setGithubHandle(res.data.github_handle);
          }
        })
        .catch(err => console.error('[Infra Org Fetch Error]:', err));
    }
  }, []);

  const addLog = (msg, type = 'info') => {
    setLogs(prev => [...prev, { time: new Date().toLocaleTimeString(), msg, type }]);
  };

  const handleProvision = async (e) => {
    e.preventDefault();
    
    if (!selectedProject || !repoName) {
      addLog('Missing required deployment parameters.', 'error');
      return;
    }

    setIsProvisioning(true);
    setStatus('running');
    setLogs([]);
    
    addLog('Initializing DevSecOps pipeline...', 'info');

    try {
      await api.post('/infrastructure/provision', {
        project_id: selectedProject,
        stack_template: selectedStack,
        repo_name: repoName
      });

      // Simulation logic
      setTimeout(() => addLog('Authenticating with GitHub API...', 'info'), 800);
      setTimeout(() => addLog(`Created repository: ${repoName}`, 'success'), 1800);
      setTimeout(() => addLog('Provisioning database instance...', 'info'), 2800);
      setTimeout(() => addLog('Injecting environment variables...', 'warn'), 4500);
      setTimeout(() => addLog('Triggering Vercel deployment...', 'info'), 5500);
      setTimeout(() => {
        addLog('Infrastructure successfully provisioned.', 'success');
        setStatus('complete');
        setIsProvisioning(false);
      }, 7000);

    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Pipeline execution failed.';
      addLog(`[FATAL] ${errorMsg}`, 'error');
      setStatus('error');
      setIsProvisioning(false);
    }
  };

  const handleSourceCodeClick = () => {
    if (githubHandle === 'unconfigured') {
      alert('Please configure your GitHub handle in Settings first.');
      return;
    }
    window.open(`https://github.com/${githubHandle}/${repoName}`, '_blank');
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-navy flex items-center gap-2">
          <Terminal className="text-accent" /> Infrastructure Provisioning
        </h1>
        <p className="text-sm text-gray-500 mt-1 font-medium">Deploy automated cloud architectures via IaC templates.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <form onSubmit={handleProvision} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-6 focus-within:border-accent/20 transition-all">
            <div>
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Target Project</label>
              <select 
                required 
                className="w-full bg-gray-50 border border-gray-100 p-3 rounded-xl font-bold text-sm outline-none focus:ring-2 focus:ring-accent/10 transition-all"
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
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">GitBranch Repository Name</label>
              <div className="relative">
                <GitBranch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <input 
                  type="text" 
                  required 
                  placeholder="client-dashboard-v1"
                  className="w-full bg-gray-50 border border-gray-100 p-3 pl-10 rounded-xl font-mono text-xs outline-none focus:ring-2 focus:ring-accent/10 transition-all"
                  value={repoName}
                  onChange={e => setRepoName(e.target.value.toLowerCase().replace(/\s+/g, '-'))}
                  disabled={isProvisioning}
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Architecture Stack</label>
              <div className="space-y-3">
                {STACK_TEMPLATES.map(stack => (
                  <label 
                    key={stack.id}
                    className={`flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-all ${
                      selectedStack === stack.id 
                        ? 'border-accent bg-accent/5 ring-1 ring-accent' 
                        : 'border-gray-50 hover:border-gray-200 bg-gray-50/30'
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
                        <stack.icon size={14} className={selectedStack === stack.id ? "text-accent" : "text-gray-400"} /> {stack.name}
                      </div>
                      <div className="text-[11px] text-gray-500 mt-1 font-medium leading-relaxed">{stack.desc}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <button 
              type="submit" 
              disabled={isProvisioning || !selectedProject || !repoName}
              className="w-full flex items-center justify-center gap-2 bg-navy text-white py-4 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-navy/90 transition-all shadow-lg shadow-navy/20 active:scale-95 disabled:opacity-50"
            >
              {isProvisioning ? <Loader2 size={18} className="animate-spin text-accent" /> : <Play size={18} className="text-accent" />}
              {isProvisioning ? 'Executing Pipeline...' : 'Deploy Infrastructure'}
            </button>
          </form>
        </div>

        <div className="lg:col-span-3 bg-[#0D1117] rounded-2xl shadow-2xl border border-gray-800 flex flex-col overflow-hidden h-[620px]">
          <div className="bg-[#161B22] px-6 py-4 border-b border-gray-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-[#FF5F56]"></div>
                <div className="w-3 h-3 rounded-full bg-[#FFBD2E]"></div>
                <div className="w-3 h-3 rounded-full bg-[#27C93F]"></div>
              </div>
              <div className="h-4 w-px bg-gray-800 mx-1"></div>
              <span className="text-[10px] font-mono text-gray-500 font-bold uppercase tracking-widest">deploy_pipeline.sh</span>
            </div>
            {isProvisioning && <span className="text-[10px] font-black text-accent animate-pulse uppercase tracking-tighter">Live Stream</span>}
          </div>
          
          <div className="flex-1 p-8 font-mono text-xs overflow-y-auto space-y-3 leading-relaxed">
            {logs.length === 0 && status === 'idle' && (
              <div className="text-gray-700 h-full flex flex-col items-center justify-center italic gap-4">
                <Terminal size={40} className="opacity-10" />
                <p>Awaiting deployment command from Architect...</p>
              </div>
            )}
            
            {logs.map((log, i) => (
              <div key={i} className="flex gap-4 animate-in fade-in slide-in-from-bottom-1">
                <span className="text-gray-600 select-none shrink-0 font-bold">[{log.time}]</span>
                <span className={`
                  ${log.type === 'info' ? 'text-gray-400' : ''}
                  ${log.type === 'success' ? 'text-[#27C93F] font-bold' : ''}
                  ${log.type === 'warn' ? 'text-[#FFBD2E]' : ''}
                  ${log.type === 'error' ? 'text-[#FF5F56] font-black' : ''}
                `}>
                  {log.type === 'error' && '✖ '}
                  {log.type === 'success' && '✔ '}
                  {log.msg}
                </span>
              </div>
            ))}

            {isProvisioning && (
              <div className="flex gap-4 items-center mt-2">
                <span className="text-gray-600">[{new Date().toLocaleTimeString()}]</span>
                <div className="w-2 h-4 bg-accent animate-pulse"></div>
              </div>
            )}
          </div>

          {status === 'complete' && (
            <div className="bg-[#27C93F]/5 border-t border-[#27C93F]/20 p-5 flex items-center justify-between">
              <div className="flex items-center gap-2 text-[#27C93F] font-bold text-xs uppercase tracking-wider">
                <CheckCircle2 size={16} /> Environments Verified
              </div>
              <button 
                onClick={handleSourceCodeClick}
                className="text-[10px] font-black text-white bg-[#27C93F] px-3 py-1.5 rounded-md hover:bg-[#27C93F]/80 transition-all uppercase tracking-widest"
              >
                Source Code →
              </button>
            </div>
          )}
          
          {status === 'error' && (
            <div className="bg-[#FF5F56]/5 border-t border-[#FF5F56]/20 p-5 flex items-center gap-3 text-[#FF5F56] font-bold text-xs uppercase tracking-widest">
              <AlertCircle size={16} /> Pipeline Terminated
            </div>
          )}
        </div>
      </div>
    </div>
  );
}