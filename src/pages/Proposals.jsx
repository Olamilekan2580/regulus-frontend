import { useState, useEffect } from 'react';
import { Plus, FileText, Send, Clock, FolderKanban, MoreVertical, Trash2, Edit2 } from 'lucide-react';
import api from '../lib/api';

export default function Proposals() {
  const [proposals, setProposals] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [editingId, setEditingId] = useState(null);

  // NEW: State to track which 3-dots menu is currently open
  const [activeDropdown, setActiveDropdown] = useState(null);
  
  const [formData, setFormData] = useState({ 
    project_id: '', 
    title: '',
    description: '',
    price: '', 
    timeline: '' 
  });

  const fetchData = async () => {
    try {
      const [propRes, projRes] = await Promise.all([
        api.get('/proposals'), 
        api.get('/projects')
      ]);
      setProposals(propRes.data || []);
      setProjects(projRes.data || []);
      if (projRes.data.length > 0) {
        setFormData(prev => ({ ...prev, project_id: projRes.data[0].id }));
      }
    } catch (err) { 
      console.error(err); 
    } finally { 
      setLoading(false); 
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return; 
    
    setIsSubmitting(true);
    setError('');
    
    try {
      if (editingId) {
        // UPDATE EXISTING
        await api.put(`/proposals/${editingId}`, { ...formData, price: parseFloat(formData.price) });
      } else {
        // CREATE NEW
        await api.post('/proposals', { ...formData, price: parseFloat(formData.price) });
      }
      
      setIsModalOpen(false);
      setEditingId(null);
      setFormData({ project_id: projects[0]?.id || '', title: '', description: '', price: '', timeline: '' });
      fetchData();
    } catch (err) { 
      setError(editingId ? 'Failed to update proposal' : 'Failed to create proposal'); 
    } finally {
      setIsSubmitting(false);
    }
  };

  // NEW: Delete Function
  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this proposal?')) return;
    
    try {
      await api.delete(`/proposals/${id}`);
      setActiveDropdown(null); // Close the menu
      fetchData(); // Refresh the list
    } catch (err) {
      console.error('Failed to delete:', err);
      alert('Failed to delete proposal.');
    }
  };

  const copyToClipboard = (clientId) => {
    if (!clientId) {
      alert('Cannot copy link: No client attached to this project.');
      return;
    }
    const url = `${window.location.origin}/portal/${clientId}`;
    navigator.clipboard.writeText(url);
    alert('Portal link copied to clipboard!');
  };

  const statusStyles = {
    'Draft': 'bg-gray-100 text-gray-700 border-gray-200',
    'Sent': 'bg-blue-50 text-blue-700 border-blue-200',
    'Approved': 'bg-green-50 text-green-700 border-green-200',
    'Rejected': 'bg-red-50 text-red-700 border-red-200'
  };

  return (
    <div className="space-y-8" onClick={() => setActiveDropdown(null)}> {/* Clicking anywhere closes dropdowns */}
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-navy tracking-tight">Proposals</h1>
          <p className="text-sm text-gray-500 mt-1 font-medium">Draft and send project scopes</p>
        </div>
        <button 
          onClick={(e) => { e.stopPropagation(); setIsModalOpen(true); }} 
          className="flex items-center gap-2 bg-navy text-white px-5 py-2.5 rounded-lg hover:bg-navy/90 transition-all font-medium shadow-sm active:scale-95"
        >
          <Plus size={18} strokeWidth={2.5} /> Create Proposal
        </button>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="flex items-center justify-center p-12 text-gray-400">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-navy mr-3"></div>
          Loading proposals...
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {proposals.length === 0 ? (
            /* PREMIUM EMPTY STATE */
            <div className="col-span-full flex flex-col items-center justify-center bg-gray-50/50 rounded-2xl border border-dashed border-gray-200 p-16 text-center">
              <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm mb-4 border border-gray-100">
                <FileText size={28} className="text-gray-400" />
              </div>
              <h3 className="text-xl font-bold text-navy mb-2">No proposals yet</h3>
              <p className="text-gray-500 mb-6 max-w-md">
                Win your next big client. Draft your first project scope, set your pricing, and send it out for approval.
              </p>
              <button 
                onClick={(e) => { e.stopPropagation(); setIsModalOpen(true); }} 
                className="flex items-center gap-2 bg-white text-navy border border-gray-200 px-6 py-2.5 rounded-lg font-medium shadow-sm hover:border-navy hover:text-navy transition-colors"
              >
                <Plus size={18} /> Draft First Proposal
              </button>
            </div>
          ) : (
            proposals.map(prop => (
              /* PREMIUM PROPOSAL CARD */
              <div key={prop.id} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group relative flex flex-col h-full">
                
                {/* 3-DOTS MENU TRIGGER */}
                <div className="absolute top-4 right-4 z-10">
                  <button 
                    onClick={(e) => {
                      e.stopPropagation(); // Prevent closing immediately
                      setActiveDropdown(activeDropdown === prop.id ? null : prop.id);
                    }}
                    className="p-1.5 text-gray-400 hover:text-navy hover:bg-gray-100 rounded-md transition-all opacity-0 group-hover:opacity-100 focus:opacity-100"
                  >
                    <MoreVertical size={18} />
                  </button>

                  {/* ACTUAL DROPDOWN MENU */}
                  {activeDropdown === prop.id && (
                    <div className="absolute right-0 mt-1 w-36 bg-white rounded-xl shadow-lg border border-gray-100 py-1.5 z-20 animate-in fade-in zoom-in-95 duration-100 origin-top-right">
                      {/* The Real Edit Action */}
  <button 
    onClick={(e) => { 
      e.stopPropagation(); 
      setActiveDropdown(null);
      setEditingId(prop.id);
      setFormData({
        project_id: prop.project_id,
        title: prop.title,
        description: prop.description,
        price: prop.price,
        timeline: prop.timeline
      });
      setIsModalOpen(true);
    }}
    className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
  >
    <Edit2 size={14} /> Edit
  </button>
                      <div className="h-px bg-gray-100 my-1"></div>
                      {/* Delete Action */}
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleDelete(prop.id); }}
                        className="w-full flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <Trash2 size={14} /> Delete
                      </button>
                    </div>
                  )}
                </div>

                <div className="mb-4 pr-8">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`text-[10px] uppercase tracking-wider px-2.5 py-1 rounded-full font-bold border ${statusStyles[prop.status] || statusStyles['Draft']}`}>
                      {prop.status || 'Draft'}
                    </span>
                  </div>
                  <h3 className="font-bold text-xl text-navy leading-tight line-clamp-1">
                    {prop.title || 'Untitled Proposal'}
                  </h3>
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-400 uppercase tracking-wider mt-2">
                    <FolderKanban size={12} />
                    {prop.projects?.name || 'Unknown Project'}
                  </div>
                </div>

                <p className="text-sm text-gray-600 line-clamp-2 mb-6 flex-grow">
                  {prop.description || 'No scope description provided.'}
                </p>
                
                <div className="flex items-center justify-between mb-6">
                  <div className="text-2xl font-bold text-navy">${prop.price}</div>
                  <div className="flex items-center gap-1.5 text-sm font-medium text-gray-500 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100">
                    <Clock size={14} className="text-gray-400" /> 
                    {prop.timeline}
                  </div>
                </div>
                
                <button 
                  onClick={(e) => { e.stopPropagation(); copyToClipboard(prop.projects?.client_id); }}
                  className="w-full mt-auto flex items-center justify-center gap-2 py-2.5 border border-gray-200 text-navy rounded-xl hover:border-navy hover:text-navy hover:bg-gray-50 transition-all font-medium text-sm"
                >
                  <Send size={14} /> Copy Portal Link
                </button>
              </div>
            ))
          )}
        </div>
      )}

      {/* Premium Proposal Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-navy/40 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-in fade-in duration-200" onClick={(e) => e.stopPropagation()}>
          <div className="bg-white rounded-2xl p-8 w-full max-w-lg shadow-2xl scale-100 animate-in zoom-in-95 duration-200">
            <h2>{editingId ? 'Edit Proposal' : 'Create Proposal'}</h2>
            <p className="text-sm text-gray-500 mb-6">Draft a new project scope and pricing.</p>
            
            {error && <div className="mb-6 text-red-600 text-sm bg-red-50 p-3 rounded-lg border border-red-100 flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-red-600"></div>{error}</div>}

            {projects.length === 0 ? (
              <div className="text-center p-8 bg-gray-50 rounded-xl border border-gray-100">
                <p className="text-gray-600 mb-4 font-medium">You need to create a Project before drafting a Proposal.</p>
                <button onClick={() => setIsModalOpen(false)} className="px-6 py-2.5 bg-navy text-white font-medium rounded-xl hover:bg-navy/90 transition-all">Close</button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Target Project *</label>
                  <select required className="w-full bg-gray-50 border border-gray-200 p-3 rounded-xl focus:bg-white focus:ring-2 focus:ring-navy/20 focus:border-navy outline-none transition-all text-sm font-medium appearance-none" value={formData.project_id} onChange={e => setFormData({...formData, project_id: e.target.value})}>
                    {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Proposal Title *</label>
                  <input type="text" required className="w-full bg-gray-50 border border-gray-200 p-3 rounded-xl focus:bg-white focus:ring-2 focus:ring-navy/20 focus:border-navy outline-none transition-all text-sm font-medium" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} placeholder="e.g. Phase 1: UX/UI Design" />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Scope of Work (Description) *</label>
                  <textarea required className="w-full bg-gray-50 border border-gray-200 p-3 rounded-xl focus:bg-white focus:ring-2 focus:ring-navy/20 focus:border-navy outline-none transition-all text-sm font-medium resize-none h-24" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} placeholder="Detailed breakdown of what will be delivered..."></textarea>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Price ($) *</label>
                    <input type="number" step="0.01" required className="w-full bg-gray-50 border border-gray-200 p-3 rounded-xl focus:bg-white focus:ring-2 focus:ring-navy/20 focus:border-navy outline-none transition-all text-sm font-medium" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} placeholder="0.00" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Timeline *</label>
                    <input type="text" required className="w-full bg-gray-50 border border-gray-200 p-3 rounded-xl focus:bg-white focus:ring-2 focus:ring-navy/20 focus:border-navy outline-none transition-all text-sm font-medium" value={formData.timeline} onChange={e => setFormData({...formData, timeline: e.target.value})} placeholder="e.g. 4-6 Weeks" />
                  </div>
                </div>
                
                <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-gray-50">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 font-medium text-sm text-gray-600 hover:bg-gray-100 rounded-xl transition-colors">Cancel</button>
                  <button 
                    type="submit" 
                    disabled={isSubmitting}
                    className="px-5 py-2.5 font-medium text-sm bg-navy text-white rounded-xl hover:bg-navy/90 transition-all shadow-sm active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        Drafting...
                      </>
                    ) : (
                      'Draft Proposal'
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}