import { useState, useEffect } from 'react';
import { Plus, FileText, Calendar, DollarSign, Building, MoreVertical, Send, X, Link as LinkIcon, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api';

export default function Proposals() {
  const navigate = useNavigate();
  const [proposals, setProposals] = useState([]);
  const [clients, setClients] = useState([]);
  const [projects, setProjects] = useState([]); 
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [error, setError] = useState('');
  const [copiedId, setCopiedId] = useState(null); 
  const [file, setFile] = useState(null); // File state ready
  const [formData, setFormData] = useState({
    client_id: '',
    project_id: '', 
    title: '',
    description: '', 
    price: '', 
    status: 'Draft'
  });

  const fetchData = async () => {
    try {
      const [propRes, clientRes, projRes] = await Promise.all([
        api.get('/proposals'),
        api.get('/clients'),
        api.get('/projects').catch(() => ({ data: [] }))
      ]);
      
      const safeProposals = Array.isArray(propRes.data) ? propRes.data : (propRes.data?.data || []);
      const safeClients = Array.isArray(clientRes.data) ? clientRes.data : (clientRes.data?.data || []);
      const safeProjects = Array.isArray(projRes.data) ? projRes.data : (projRes.data?.data || []);
      
      setProposals(safeProposals);
      setClients(safeClients);
      setProjects(safeProjects);
      
      if (safeClients.length > 0) {
        setFormData(prev => ({ ...prev, client_id: safeClients[0].id }));
      }
    } catch (err) {
      console.error('[Proposals Fetch Error]:', err);
      setProposals([]);
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
    
    try {
      // 🔒 THE FIX: Convert to FormData to support multipart file uploads
      const payload = new FormData();
      payload.append('client_id', formData.client_id);
      payload.append('project_id', formData.project_id || '');
      payload.append('title', formData.title);
      payload.append('description', formData.description || '');
      payload.append('price', parseFloat(formData.price) || 0);
      payload.append('status', formData.status);
      
      // Append the physical file if it exists
      if (file) {
        payload.append('attachment', file);
      }

      // Explicitly set the headers for multer
      await api.post('/proposals', payload, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      setIsModalOpen(false);
      setFile(null); // Reset file on success
      setFormData({
        client_id: clients[0]?.id || '',
        project_id: '',
        title: '',
        description: '',
        price: '',
        status: 'Draft'
      });
      fetchData();
    } catch (err) {
      setError(err.response?.data?.error || 'Database execution failed. Check backend logs.');
    }
  };

  const getClientName = (clientId) => {
    const foundClient = clients.find(c => c.id === clientId);
    return foundClient ? (foundClient.company || foundClient.name) : 'Unknown Client';
  };

  const handleCopyLink = (id) => {
    const publicUrl = `${window.location.origin}/p/${id}`;
    navigator.clipboard.writeText(publicUrl);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const statusStyles = {
    'Draft': 'bg-gray-100 text-gray-600 border-gray-200',
    'Sent': 'bg-blue-50 text-blue-600 border-blue-200',
    'Accepted': 'bg-green-50 text-green-700 border-green-200',
    'Declined': 'bg-red-50 text-red-600 border-red-200'
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-navy tracking-tight">Proposals</h1>
          <p className="text-sm text-gray-500 mt-1 font-medium">Draft and send scopes of work to win new business.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-navy text-white px-5 py-2.5 rounded-lg hover:bg-navy/90 transition-all font-medium shadow-sm active:scale-95"
        >
          <Plus size={18} strokeWidth={2.5} /> New Proposal
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center p-12 text-gray-400">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-navy mr-3"></div>
          Loading proposals...
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {proposals.length === 0 ? (
            <div className="col-span-full flex flex-col items-center justify-center bg-gray-50/50 rounded-2xl border border-dashed border-gray-200 p-16 text-center">
              <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm mb-4 border border-gray-100">
                <FileText size={28} className="text-gray-400" />
              </div>
              <h3 className="text-xl font-bold text-navy mb-2">No active proposals</h3>
              <p className="text-gray-500 mb-6 max-w-md">
                You haven't drafted any proposals yet. Create one to pitch a new project to your clients.
              </p>
              <button 
                onClick={() => setIsModalOpen(true)}
                className="flex items-center gap-2 bg-white text-navy border border-gray-200 px-6 py-2.5 rounded-lg font-medium shadow-sm hover:border-navy hover:text-navy transition-colors"
              >
                <Plus size={18} /> Create First Proposal
              </button>
            </div>
          ) : (
            proposals.map(proposal => (
              <div key={proposal.id} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group relative flex flex-col h-full">
                
                <button className="absolute top-4 right-4 text-gray-300 hover:text-navy opacity-0 group-hover:opacity-100 transition-opacity">
                  <MoreVertical size={18} />
                </button>

                <div className="mb-4 pr-6">
                  <div className="flex items-center gap-2 mb-3">
                    <span className={`text-[10px] uppercase tracking-wider px-2.5 py-1 rounded-full font-bold border ${statusStyles[proposal.status] || statusStyles['Draft']}`}>
                      {proposal.status}
                    </span>
                  </div>
                  <h3 className="font-bold text-xl text-navy leading-tight line-clamp-1">{proposal.title}</h3>
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-400 uppercase tracking-wider mt-2">
                    <Building size={12} />
                    {getClientName(proposal.client_id)}
                  </div>
                </div>
                
                <div className="flex-grow">
                  <div className="flex items-center gap-2 text-2xl font-black text-navy mb-4">
                    <DollarSign size={20} className="text-[#00C896]" />
                    {proposal.price ? proposal.price.toLocaleString() : (proposal.value ? proposal.value.toLocaleString() : '0')}
                  </div>
                </div>

                {/* Footer Actions */}
                <div className="flex items-center justify-between border-t border-gray-50 pt-4 mt-auto">
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <div className="w-7 h-7 rounded-md bg-gray-50 flex items-center justify-center shrink-0">
                      <Calendar size={14} className="text-gray-400" />
                    </div>
                    <span className="font-medium text-xs">
                      {new Date(proposal.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                  </div>
                  
                  <div className="flex gap-2">
                    <button 
                      onClick={() => handleCopyLink(proposal.id)}
                      className="flex items-center justify-center w-8 h-8 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-navy transition-colors"
                      title="Copy Public Link"
                    >
                      {copiedId === proposal.id ? <Check size={16} className="text-green-500" /> : <LinkIcon size={16} />}
                    </button>
                    <button 
                      onClick={() => navigate(`/proposals/${proposal.id}`)}
                      className="flex items-center gap-1.5 text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors"
                    >
                      <Send size={14} /> View
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Create Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-navy/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200 overflow-y-auto">
          <div className="bg-white rounded-2xl w-full max-w-xl shadow-2xl scale-100 animate-in zoom-in-95 duration-200 my-8 relative">
            <div className="flex justify-between items-center p-6 border-b border-gray-100 bg-gray-50/50">
              <div>
                <h2 className="text-xl font-bold text-navy">Draft Proposal</h2>
                <p className="text-sm text-gray-500">Create a new pitch for a client.</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-navy transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6">
              {error && (
                <div className="mb-6 text-red-600 text-sm bg-red-50 p-3 rounded-lg border border-red-100 flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-red-600 shrink-0"></div>
                  <span>{error}</span>
                </div>
              )}
              
              {clients.length === 0 ? (
                <div className="text-center p-8 bg-gray-50 rounded-xl border border-gray-100">
                  <p className="text-gray-600 mb-4 font-medium">You need to add a Client before creating a Proposal.</p>
                  <button onClick={() => setIsModalOpen(false)} className="px-6 py-2.5 bg-navy text-white font-medium rounded-xl hover:bg-navy/90 transition-all">Close</button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Target Client *</label>
                      <select required className="w-full bg-gray-50 border border-gray-200 p-3 rounded-xl focus:bg-white focus:ring-2 focus:ring-navy/20 focus:border-navy outline-none transition-all text-sm font-medium appearance-none" value={formData.client_id} onChange={e => setFormData({...formData, client_id: e.target.value})}>
                        {clients.map(c => <option key={c.id} value={c.id}>{c.company || c.name}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Target Project</label>
                      <select className="w-full bg-gray-50 border border-gray-200 p-3 rounded-xl focus:bg-white focus:ring-2 focus:ring-navy/20 focus:border-navy outline-none transition-all text-sm font-medium appearance-none" value={formData.project_id} onChange={e => setFormData({...formData, project_id: e.target.value})}>
                        <option value="">General (No Project)</option>
                        {projects.map(p => <option key={p.id} value={p.id}>{p.title || p.name}</option>)}
                      </select>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Proposal Title *</label>
                    <input type="text" required className="w-full bg-gray-50 border border-gray-200 p-3 rounded-xl focus:bg-white focus:ring-2 focus:ring-navy/20 focus:border-navy outline-none transition-all text-sm font-medium" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} placeholder="e.g. Q3 Marketing Retainer" />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Scope of Work / Description</label>
                    <textarea 
                      rows="4"
                      className="w-full bg-gray-50 border border-gray-200 p-3 rounded-xl focus:bg-white focus:ring-2 focus:ring-navy/20 focus:border-navy outline-none transition-all text-sm font-medium resize-none" 
                      value={formData.description} 
                      onChange={e => setFormData({...formData, description: e.target.value})} 
                      placeholder="Outline the deliverables, timeline, and goals..." 
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Attachments (Optional)</label>
                    <input 
                      type="file" 
                      onChange={(e) => setFile(e.target.files[0])} // 🔒 THE FIX: Captures the file to state
                      className="w-full bg-gray-50 border border-gray-200 p-2 rounded-xl text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-navy file:text-white hover:file:bg-navy/90 cursor-pointer"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-2">
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Estimated Value</label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-bold">$</span>
                        <input type="number" required className="w-full pl-8 bg-gray-50 border border-gray-200 p-3 rounded-xl focus:bg-white focus:ring-2 focus:ring-navy/20 focus:border-navy outline-none transition-all text-sm font-medium" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} placeholder="5000" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Initial Status</label>
                      <select className="w-full bg-gray-50 border border-gray-200 p-3 rounded-xl focus:bg-white focus:ring-2 focus:ring-navy/20 focus:border-navy outline-none transition-all text-sm font-medium appearance-none" value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})}>
                        <option value="Draft">Draft</option>
                        <option value="Sent">Sent</option>
                        <option value="Accepted">Accepted</option>
                        <option value="Declined">Declined</option>
                      </select>
                    </div>
                  </div>
                  
                  <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-gray-50">
                    <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 font-medium text-sm text-gray-600 hover:bg-gray-100 rounded-xl transition-colors">Cancel</button>
                    <button type="submit" className="px-5 py-2.5 font-medium text-sm bg-navy text-white rounded-xl hover:bg-navy/90 transition-all shadow-sm active:scale-95">Save Proposal</button>
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