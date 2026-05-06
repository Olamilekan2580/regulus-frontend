import { useState, useEffect } from 'react';
import { Plus, Users, Mail, Building, Phone } from 'lucide-react';
import api from '../lib/api';

export default function Clients() {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', company: '', phone: '' });
  const [error, setError] = useState('');

  const fetchClients = async () => {
    try {
      const res = await api.get('/clients');
      setClients(res.data || []);
    } catch (err) {
      console.error('Failed to fetch clients:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await api.post('/clients', formData);
      setIsModalOpen(false);
      setFormData({ name: '', email: '', company: '', phone: '' });
      fetchClients(); // Refresh the list
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create client');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-navy">Clients</h1>
          <p className="text-sm text-gray-500 mt-1">Manage your client relationships</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-accent text-white px-4 py-2 rounded-lg hover:bg-accent/90 transition-colors font-medium shadow-sm"
        >
          <Plus size={20} /> Add Client
        </button>
      </div>

      {/* Client Grid */}
      {loading ? (
        <div className="text-gray-500 animate-pulse">Loading clients...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {clients.length === 0 ? (
            <div className="col-span-full p-12 text-center bg-white rounded-xl border border-gray-200 text-gray-500 shadow-sm">
              <Users size={48} className="mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium text-navy mb-1">No clients yet</h3>
              <p>Add your first client to start generating projects and proposals.</p>
            </div>
          ) : (
            clients.map(client => (
              <div key={client.id} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-bold text-lg text-navy">{client.name}</h3>
                    <div className="flex items-center gap-1.5 text-sm text-gray-500 mt-1">
                      <Building size={14} />
                      {client.company || 'Independent'}
                    </div>
                  </div>
                </div>
                <div className="space-y-2 pt-4 border-t border-gray-50">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Mail size={14} className="text-gray-400" />
                    {client.email}
                  </div>
                  {client.phone && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Phone size={14} className="text-gray-400" />
                      {client.phone}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Add Client Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-navy/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-8 w-full max-w-md shadow-2xl">
            <h2 className="text-2xl font-bold text-navy mb-6">New Client</h2>
            
            {error && <div className="mb-6 text-red-500 text-sm bg-red-50 p-3 rounded-lg border border-red-100">{error}</div>}
            
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Full Name *</label>
                <input type="text" required className="w-full border border-gray-300 p-2.5 rounded-lg focus:ring-2 focus:ring-accent focus:border-accent outline-none transition-all" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="e.g. Jane Doe" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Email Address *</label>
                <input type="email" required className="w-full border border-gray-300 p-2.5 rounded-lg focus:ring-2 focus:ring-accent focus:border-accent outline-none transition-all" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} placeholder="jane@company.com" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Company Name</label>
                <input type="text" className="w-full border border-gray-300 p-2.5 rounded-lg focus:ring-2 focus:ring-accent focus:border-accent outline-none transition-all" value={formData.company} onChange={e => setFormData({...formData, company: e.target.value})} placeholder="Optional" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Phone Number</label>
                <input type="tel" className="w-full border border-gray-300 p-2.5 rounded-lg focus:ring-2 focus:ring-accent focus:border-accent outline-none transition-all" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} placeholder="Optional" />
              </div>
              
              <div className="flex justify-end gap-3 mt-8 pt-4 border-t border-gray-100">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">Cancel</button>
                <button type="submit" className="px-5 py-2.5 font-medium bg-navy text-white rounded-lg hover:bg-navy/90 transition-colors shadow-sm">Save Client</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
