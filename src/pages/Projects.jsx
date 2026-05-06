import { useState, useEffect } from 'react';
import { Plus, FolderKanban, Calendar, Clock, CheckCircle } from 'lucide-react';
import api from '../lib/api';

export default function Projects() {
  const [projects, setProjects] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [error, setError] = useState('');
  
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
      setProjects(projRes.data || []);
      setClients(clientRes.data || []);
      
      if (clientRes.data.length > 0) {
        setFormData(prev => ({ ...prev, client_id: clientRes.data[0].id }));
      }
    } catch (err) {
      console.error('Failed to fetch data:', err);
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
    }
  };

  const statusColors = {
    'Planning': 'bg-gray-100 text-gray-700',
    'Active': 'bg-blue-100 text-blue-700',
    'Completed': 'bg-green-100 text-green-700'
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-navy">Projects</h1>
          <p className="text-sm text-gray-500 mt-1">Track and manage active deliverables</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-accent text-white px-4 py-2 rounded-lg hover:bg-accent/90 transition-colors font-medium shadow-sm"
        >
          <Plus size={20} /> New Project
        </button>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="text-gray-500 animate-pulse">Loading projects...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.length === 0 ? (
            <div className="col-span-full p-12 text-center bg-white rounded-xl border border-gray-200 text-gray-500 shadow-sm">
              <FolderKanban size={48} className="mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium text-navy mb-1">No active projects</h3>
              <p>Create a project to start tracking work for your clients.</p>
            </div>
          ) : (
            projects.map(project => (
              <div key={project.id} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-3">
                  <h3 className="font-bold text-lg text-navy line-clamp-1">{project.name}</h3>
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${statusColors[project.status] || statusColors['Planning']}`}>
                    {project.status}
                  </span>
                </div>
                
                <p className="text-sm font-medium text-accent mb-4">
                  {project.clients?.company || project.clients?.name || 'Unknown Client'}
                </p>
                
                <p className="text-sm text-gray-600 line-clamp-2 mb-6 h-10">
                  {project.description || 'No description provided.'}
                </p>

                <div className="flex items-center gap-4 text-sm text-gray-500 border-t border-gray-50 pt-4">
                  <div className="flex items-center gap-1.5">
                    <Calendar size={14} className="text-gray-400" />
                    {project.deadline ? new Date(project.deadline).toLocaleDateString() : 'No deadline'}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-navy/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-8 w-full max-w-lg shadow-2xl">
            <h2 className="text-2xl font-bold text-navy mb-6">Create Project</h2>
            
            {error && <div className="mb-6 text-red-500 text-sm bg-red-50 p-3 rounded-lg border border-red-100">{error}</div>}
            
            {clients.length === 0 ? (
              <div className="text-center p-6 bg-gray-50 rounded-xl border border-gray-100">
                <p className="text-gray-600 mb-4">You need to add a Client before creating a Project.</p>
                <button onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 bg-navy text-white font-medium rounded-lg">Close</button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Client *</label>
                  <select required className="w-full border border-gray-300 p-2.5 rounded-lg focus:ring-2 focus:ring-accent focus:border-accent outline-none bg-white" value={formData.client_id} onChange={e => setFormData({...formData, client_id: e.target.value})}>
                    {clients.map(c => <option key={c.id} value={c.id}>{c.company || c.name}</option>)}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Project Name *</label>
                  <input type="text" required className="w-full border border-gray-300 p-2.5 rounded-lg focus:ring-2 focus:ring-accent focus:border-accent outline-none" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="e.g. E-Commerce Redesign" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Description</label>
                  <textarea className="w-full border border-gray-300 p-2.5 rounded-lg focus:ring-2 focus:ring-accent focus:border-accent outline-none resize-none h-24" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} placeholder="High-level overview of the deliverables..."></textarea>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Status</label>
                    <select className="w-full border border-gray-300 p-2.5 rounded-lg focus:ring-2 focus:ring-accent focus:border-accent outline-none bg-white" value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})}>
                      <option value="Planning">Planning</option>
                      <option value="Active">Active</option>
                      <option value="Completed">Completed</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Deadline</label>
                    <input type="date" className="w-full border border-gray-300 p-2.5 rounded-lg focus:ring-2 focus:ring-accent focus:border-accent outline-none" value={formData.deadline} onChange={e => setFormData({...formData, deadline: e.target.value})} />
                  </div>
                </div>
                
                <div className="flex justify-end gap-3 mt-8 pt-4 border-t border-gray-100">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">Cancel</button>
                  <button type="submit" className="px-5 py-2.5 font-medium bg-navy text-white rounded-lg hover:bg-navy/90 transition-colors shadow-sm">Save Project</button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
