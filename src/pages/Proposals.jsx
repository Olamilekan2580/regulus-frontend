import { useState, useEffect } from 'react';
import { Plus, FileText, Send, Clock, CheckCircle } from 'lucide-react';
import api from '../lib/api';

export default function Proposals() {
  const [proposals, setProposals] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({ project_id: '', price: '', timeline: '', content_html: '' });

  const fetchData = async () => {
    try {
      const [propRes, projRes] = await Promise.all([api.get('/proposals'), api.get('/projects')]);
      setProposals(propRes.data || []);
      setProjects(projRes.data || []);
      if (projRes.data.length > 0) setFormData(prev => ({ ...prev, project_id: projRes.data[0].id }));
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/proposals', { ...formData, price: parseFloat(formData.price) });
      setIsModalOpen(false);
      fetchData();
    } catch (err) { setError('Failed to create proposal'); }
  };

  const copyToClipboard = (clientId) => {
    const url = `${window.location.origin}/portal/${clientId}`;
    navigator.clipboard.writeText(url);
    alert('Portal link copied to clipboard!');
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-navy">Proposals</h1>
          <p className="text-sm text-gray-500 mt-1">Draft and send project scopes</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2 bg-accent text-white px-4 py-2 rounded-lg font-medium shadow-sm hover:bg-accent/90 transition-all">
          <Plus size={20} /> Create Proposal
        </button>
      </div>

      {loading ? <div className="text-gray-500 animate-pulse">Loading...</div> : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {proposals.map(prop => (
            <div key={prop.id} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all group">
              <div className="flex justify-between items-start mb-4">
                <h3 className="font-bold text-lg text-navy">{prop.projects?.name}</h3>
                <span className="text-xs px-2.5 py-1 rounded-full font-medium bg-gray-100 text-gray-700 cursor-pointer hover:bg-gray-200">
                  {prop.status}
                </span>
              </div>
              <div className="text-2xl font-bold text-navy mb-4">${prop.price}</div>
              <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
                <Clock size={14} /> {prop.timeline}
              </div>
              {/* FIXED COPY BUTTON */}
              <button 
                onClick={() => copyToClipboard(prop.client_id)}
                className="w-full flex items-center justify-center gap-2 py-2.5 border border-gray-200 text-gray-700 rounded-lg hover:border-accent hover:text-accent transition-colors font-medium text-sm bg-gray-50 group-hover:bg-white"
              >
                <Send size={14} /> Copy Portal Link
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Modal removed for brevity in this snippet, assumes identical to previous */}
    </div>
  );
}
