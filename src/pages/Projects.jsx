import { useState, useEffect } from 'react';
import { Plus, FolderKanban, Calendar, Clock, CheckCircle, Building, MoreVertical, Link as LinkIcon, X, Send } from 'lucide-react';
import api from '../lib/api';
import ProjectShareLinks from '../components/ProjectShareLinks';
import ProjectUpdateUploader from '../components/ProjectUpdateUploader';
import ClientSubmissionsFeed from '../components/ClientSubmissionsFeed';

export default function Projects() {
  const [projects, setProjects] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [shareProject, setShareProject] = useState(null); 
  const [updateProject, setUpdateProject] = useState(null);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    client_id: '',
    name: '',
    description: '',
    status: 'Planning',
    deadline: ''
  });

  const fetchData = async () => {
    try {
      const [projRes, clientRes] = await Promise.all([
        api.get('/projects'),
        api.get('/clients')
      ]);
      
      const safeProjects = Array.isArray(projRes.data) ? projRes.data : (projRes.data?.data || []);
      const safeClients = Array.isArray(clientRes.data) ? clientRes.data : (clientRes.data?.data || []);
      
      setProjects(safeProjects);
      setClients(safeClients);
      
      if (safeClients.length > 0) {
        setFormData(prev => ({ ...prev, client_id: safeClients[0].id }));
      }
    } catch (err) {
      console.error('Failed to fetch data:', err);
      setProjects([]);
      setClients([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true); 

    try {
      await api.post('/projects', formData);
      setIsModalOpen(false);
      setFormData({
        client_id: clients[0]?.id || '',
        name: '',
        description: '',
        status: 'Planning',
        deadline: ''
      });
      fetchData();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create project');
    } finally {
      setIsSubmitting(false); 
    }
  };

  const statusStyles = {
    'Planning': 'bg-gray-100 text-gray-700 border-gray-200',
    'Active': 'bg-blue-50 text-blue-700 border-blue-200',
    'Completed': 'bg-green-50 text-green-700 border-green-200'
  };

  return (
    <div className="space-y-8">
      {/* 🔒 FIX: Mobile-Responsive Header */}
      <div className="flex flex-row items-start justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-navy tracking-tight">Projects</h1>
          <p className="text-sm text-gray-500 mt-1 font-medium">Track and manage active deliverables</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-navy text-white px-4 py-2.5 md:px-6 md:py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-navy/90 transition-colors shadow-sm shadow-navy/10 shrink-0 text-sm md:text-base mt-1 active:scale-95"
        >
          <Plus size={18} strokeWidth={2.5} className="md:w-5 md:h-5" /> 
          <span className="hidden sm:inline">New Project</span>
          <span className="sm:hidden">New</span>
        </button>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="flex items-center justify-center p-12 text-gray-400">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-navy mr-3"></div>
          Loading projects...
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.length === 0 ? (
            <div className="col-span-full flex flex-col items-center justify-center bg-gray-50/50 rounded-2xl border border-dashed border-gray-200 p-16 text-center">
              <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm mb-4 border border-gray-100">
                <FolderKanban size={28} className="text-gray-400" />
              </div>
              <h3 className="text-xl font-bold text-navy mb-2">No active projects</h3>
              <p className="text-gray-500 mb-6 max-w-md">
                Your pipeline is clear. Create a project to start tracking deliverables, timelines, and scope for your clients.
              </p>
              <button 
                onClick={() => setIsModalOpen(true)}
                className="flex items-center gap-2 bg-white text-navy border border-gray-200 px-6 py-2.5 rounded-lg font-medium shadow-sm hover:border-navy hover:text-navy transition-colors"
              >
                <Plus size={18} /> Create First Project
              </button>
            </div>
          ) : (
            projects.map(project => (
              <div key={project.id} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group relative flex flex-col h-full">
                
                <button className="absolute top-4 right-4 text-gray-300 hover:text-navy opacity-0 group-hover:opacity-100 transition-opacity">
                  <MoreVertical size={18} />
                </button>

                <div className="mb-4 pr-6">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`text-[10px] uppercase tracking-wider px-2.5 py-1 rounded-full font-bold border ${statusStyles[project.status] || statusStyles['Planning']}`}>
                      {project.status}
                    </span>
                  </div>
                  <h3 className="font-bold text-xl text-navy leading-tight line-clamp-1">{project.name}</h3>
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-400 uppercase tracking-wider mt-2">
                    <Building size={12} />
                    {project.clients?.company || project.clients?.name || 'Unknown Client'}
                  </div>
                </div>
                
                <p className="text-sm text-gray-600 line-clamp-2 mb-6 flex-grow">
                  {project.description || 'No description provided.'}
                </p>

                <div className="flex items-center justify-between border-t border-gray-50 pt-4 mt-auto">
                  <div className="flex items-center gap-2 text-sm text-gray-500 group-hover:text-navy transition-colors">
                    <div className="w-7 h-7 rounded-md bg-gray-50 flex items-center justify-center shrink-0">
                      <Calendar size={14} className="text-gray-400" />
                    </div>
                    <span className="font-medium">
                      {project.deadline ? new Date(project.deadline).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : 'No deadline'}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => setUpdateProject(project)}
                      className="flex items-center gap-1.5 text-xs font-bold text-navy bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-lg transition-colors"
                    >
                      <Send size={14} /> Manage
                    </button>

                    <button 
                      onClick={() => setShareProject(project)}
                      className="flex items-center gap-1.5 text-xs font-bold text-[#00C896] bg-[#00C896]/10 hover:bg-[#00C896]/20 px-3 py-1.5 rounded-lg transition-colors"
                    >
                      <LinkIcon size={14} /> Share
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Share Links Modal (Responsive Constraints Added) */}
      {shareProject && (
        <div className="fixed inset-0 bg-navy/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-4 animate-in fade-in duration-200">
          <div className="bg-[#0A0F1E] rounded-2xl w-full max-w-xl shadow-2xl flex flex-col max-h-[90vh] scale-100 animate-in zoom-in-95 duration-200 overflow-hidden border border-slate-800 relative">
            <div className="flex justify-between items-center p-6 border-b border-slate-800 bg-slate-900/50 shrink-0">
              <h2 className="text-xl font-bold text-white truncate pr-4">Share: {shareProject.name}</h2>
              <button onClick={() => setShareProject(null)} className="text-slate-400 hover:text-white transition-colors shrink-0">
                <X size={20} />
              </button>
            </div>
            <div className="p-6 overflow-y-auto flex-1">
              <ProjectShareLinks project={shareProject} />
              <button 
                onClick={() => setShareProject(null)}
                className="w-full mt-4 py-3 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Unified Project Hub Modal */}
      {updateProject && (
        <div className="fixed inset-0 bg-navy/80 backdrop-blur-sm flex items-center justify-center z-[9999] p-4 animate-in fade-in duration-200">
          <div className="bg-gray-50 rounded-3xl w-full max-w-6xl shadow-2xl scale-100 animate-in zoom-in-95 duration-200 overflow-hidden relative max-h-[90vh] flex flex-col">
            
            <div className="flex justify-between items-center p-6 bg-white border-b border-gray-100 shrink-0">
              <div className="min-w-0 flex-1">
                <h2 className="text-xl font-bold text-navy flex items-center gap-2 truncate">
                  <FolderKanban size={24} className="text-accent shrink-0" /> 
                  <span className="truncate">Hub: {updateProject.name}</span>
                </h2>
                <p className="text-sm text-gray-500 mt-1 truncate">Manage outbound updates and view incoming submissions.</p>
              </div>
              <button 
                onClick={() => setUpdateProject(null)} 
                className="text-gray-400 hover:text-navy transition-colors bg-gray-50 p-2.5 rounded-full hover:bg-gray-100 shrink-0 ml-4"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div>
                  <ProjectUpdateUploader 
                    projectId={updateProject.id} 
                    onUpdatePosted={() => fetchData()} 
                  />
                </div>
                <div>
                  <ClientSubmissionsFeed projectId={updateProject.id} />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 🔒 FIX: Premium Create Modal Constraints */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-navy/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200 relative overflow-hidden">
            
            <div className="flex justify-between items-center p-6 border-b border-gray-100 bg-gray-50/50 shrink-0">
              <div>
                <h2 className="text-2xl font-bold text-navy">Create Project</h2>
                <p className="text-sm text-gray-500 font-medium">Set up a new workspace for deliverables.</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-navy transition-colors bg-white rounded-full p-1 border border-gray-200 shadow-sm">
                <X size={20} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1">
              {error && <div className="mb-6 text-red-600 text-sm bg-red-50 p-3 rounded-lg border border-red-100 flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-red-600 shrink-0"></div>{error}</div>}
              
              {clients.length === 0 ? (
                <div className="text-center p-8 bg-gray-50 rounded-xl border border-gray-100">
                  <p className="text-gray-600 mb-4 font-medium">You need to add a Client before creating a Project.</p>
                  <button onClick={() => setIsModalOpen(false)} className="px-6 py-2.5 bg-navy text-white font-medium rounded-xl hover:bg-navy/90 transition-all">Close</button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Client *</label>
                    <select required className="w-full bg-gray-50 border border-gray-200 p-3 rounded-xl focus:bg-white focus:ring-2 focus:ring-navy/20 focus:border-navy outline-none transition-all text-sm font-medium appearance-none" value={formData.client_id} onChange={e => setFormData({...formData, client_id: e.target.value})}>
                      {clients.map(c => <option key={c.id} value={c.id}>{c.company || c.name}</option>)}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Project Name *</label>
                    <input type="text" required className="w-full bg-gray-50 border border-gray-200 p-3 rounded-xl focus:bg-white focus:ring-2 focus:ring-navy/20 focus:border-navy outline-none transition-all text-sm font-medium" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="e.g. E-Commerce Redesign" />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Description</label>
                    <textarea className="w-full bg-gray-50 border border-gray-200 p-3 rounded-xl focus:bg-white focus:ring-2 focus:ring-navy/20 focus:border-navy outline-none transition-all text-sm font-medium resize-none h-24" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} placeholder="High-level overview of the deliverables..."></textarea>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Status</label>
                      <select className="w-full bg-gray-50 border border-gray-200 p-3 rounded-xl focus:bg-white focus:ring-2 focus:ring-navy/20 focus:border-navy outline-none transition-all text-sm font-medium appearance-none" value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})}>
                        <option value="Planning">Planning</option>
                        <option value="Active">Active</option>
                        <option value="Completed">Completed</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Deadline</label>
                      <input type="date" className="w-full bg-gray-50 border border-gray-200 p-3 rounded-xl focus:bg-white focus:ring-2 focus:ring-navy/20 focus:border-navy outline-none transition-all text-sm font-medium text-gray-700" value={formData.deadline} onChange={e => setFormData({...formData, deadline: e.target.value})} />
                    </div>
                  </div>
                  
                  <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-gray-50">
                    <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 font-medium text-sm text-gray-600 hover:bg-gray-100 rounded-xl transition-colors">
                      Cancel
                    </button>
                    <button 
                      type="submit" 
                      disabled={isSubmitting}
                      className="px-5 py-2.5 font-medium text-sm bg-navy text-white rounded-xl hover:bg-navy/90 transition-all shadow-sm active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center min-w-[140px]"
                    >
                      {isSubmitting ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/20 border-t-white"></div>
                      ) : (
                        "Create Project"
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}