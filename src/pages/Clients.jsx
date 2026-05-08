import { useState, useEffect } from 'react';
import { Plus, Users, Mail, Building, Phone, MoreVertical } from 'lucide-react';
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

  // Helper to get initials for the avatar
  const getInitials = (name) => {
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-navy tracking-tight">Clients</h1>
          <p className="text-sm text-gray-500 mt-1 font-medium">Manage your client relationships</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-navy text-white px-5 py-2.5 rounded-lg hover:bg-navy/90 transition-all font-medium shadow-sm active:scale-95"
        >
          <Plus size={18} strokeWidth={2.5} /> Add Client
        </button>
      </div>

      {/* Client Grid */}
      {loading ? (
        <div className="flex items-center justify-center p-12 text-gray-400">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-navy mr-3"></div>
          Loading clients...
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {clients.length === 0 ? (
            /* PREMIUM EMPTY STATE */
            <div className="col-span-full flex flex-col items-center justify-center bg-gray-50/50 rounded-2xl border border-dashed border-gray-200 p-16 text-center">
              <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm mb-4 border border-gray-100">
                <Users size={28} className="text-gray-400" />
              </div>
              <h3 className="text-xl font-bold text-navy mb-2">No clients yet</h3>
              <p className="text-gray-500 mb-6 max-w-md">
                Your roster is empty. Add your first client to start generating projects, proposals, and invoices.
              </p>
              <button 
                onClick={() => setIsModalOpen(true)}
                className="flex items-center gap-2 bg-white text-navy border border-gray-200 px-6 py-2.5 rounded-lg font-medium shadow-sm hover:border-navy hover:text-navy transition-colors"
              >
                <Plus size={18} /> Add First Client
              </button>
            </div>
          ) : (
            clients.map(client => (
              /* PREMIUM CLIENT CARD */
              <div key={client.id} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group relative">
                
                {/* Optional settings menu trigger */}
                <button className="absolute top-4 right-4 text-gray-300 hover:text-navy opacity-0 group-hover:opacity-100 transition-opacity">
                  <MoreVertical size={18} />
                </button>

                <div className="flex items-center gap-4 mb-6">
                  {/* Dynamic Avatar */}
                  <div className="w-12 h-12 rounded-full bg-navy/5 text-navy font-bold flex items-center justify-center text-sm border border-navy/10 shrink-0">
                    {getInitials(client.name)}
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-navy leading-tight">{client.name}</h3>
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-400 uppercase tracking-wider mt-1">
                      <Building size={12} />
                      {client.company || 'Independent'}
                    </div>
                  </div>
                </div>
                
                <div className="space-y-3 pt-4 border-t border-gray-50">
                  <div className="flex items-center gap-3 text-sm text-gray-600 group-hover:text-gray-900 transition-colors">
                    <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center shrink-0">
                      <Mail size={14} className="text-gray-400" />
                    </div>
                    <span className="truncate">{client.email}</span>
                  </div>
                  {client.phone && (
                    <div className="flex items-center gap-3 text-sm text-gray-600 group-hover:text-gray-900 transition-colors">
                      <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center shrink-0">
                        <Phone size={14} className="text-gray-400" />
                      </div>
                      <span>{client.phone}</span>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Premium Add Client Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-navy/40 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl p-8 w-full max-w-md shadow-2xl scale-100 animate-in zoom-in-95 duration-200">
            <h2 className="text-2xl font-bold text-navy mb-1">New Client</h2>
            <p className="text-sm text-gray-500 mb-6">Enter the details for your new point of contact.</p>
            
            {error && <div className="mb-6 text-red-600 text-sm bg-red-50 p-3 rounded-lg border border-red-100 flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-red-600"></div>{error}</div>}
            
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Full Name *</label>
                <input type="text" required className="w-full bg-gray-50 border border-gray-200 p-3 rounded-xl focus:bg-white focus:ring-2 focus:ring-navy/20 focus:border-navy outline-none transition-all text-sm font-medium" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="e.g. Jane Doe" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Email Address *</label>
                <input type="email" required className="w-full bg-gray-50 border border-gray-200 p-3 rounded-xl focus:bg-white focus:ring-2 focus:ring-navy/20 focus:border-navy outline-none transition-all text-sm font-medium" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} placeholder="jane@company.com" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Company Name</label>
                <input type="text" className="w-full bg-gray-50 border border-gray-200 p-3 rounded-xl focus:bg-white focus:ring-2 focus:ring-navy/20 focus:border-navy outline-none transition-all text-sm font-medium" value={formData.company} onChange={e => setFormData({...formData, company: e.target.value})} placeholder="Optional" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Phone Number</label>
                <input type="tel" className="w-full bg-gray-50 border border-gray-200 p-3 rounded-xl focus:bg-white focus:ring-2 focus:ring-navy/20 focus:border-navy outline-none transition-all text-sm font-medium" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} placeholder="Optional" />
              </div>
              
              <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-gray-50">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 font-medium text-sm text-gray-600 hover:bg-gray-100 rounded-xl transition-colors">Cancel</button>
                <button type="submit" className="px-5 py-2.5 font-medium text-sm bg-navy text-white rounded-xl hover:bg-navy/90 transition-all shadow-sm active:scale-95">Save Client</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}