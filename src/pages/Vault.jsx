import { useState, useEffect } from 'react';
import { Shield, Plus, Copy, Trash2, Clock, CheckCircle } from 'lucide-react';
import api from '../lib/api';

export default function Vault() {
  const [secrets, setSecrets] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [copiedId, setCopiedId] = useState(null);

  const [formData, setFormData] = useState({
    client_id: '',
    secret_name: '',
    secret_value: '',
    requires_burn: true
  });

  const fetchData = async () => {
    try {
      const [vaultRes, clientRes] = await Promise.all([
        api.get('/vault'),
        api.get('/clients')
      ]);
      setSecrets(vaultRes.data || []);
      setClients(clientRes.data || []);
      if (clientRes.data.length > 0) {
        setFormData(prev => ({ ...prev, client_id: clientRes.data[0].id }));
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
    try {
      await api.post('/vault', formData);
      setIsModalOpen(false);
      setFormData(prev => ({ ...prev, secret_name: '', secret_value: '' }));
      fetchData();
    } catch (err) {
      alert('Failed to secure credential.');
    }
  };

  const copyLink = (id) => {
    const link = `${window.location.origin}/secret/${id}`;
    navigator.clipboard.writeText(link);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-navy flex items-center gap-2">
            <Shield className="text-accent" /> Credential Vault
          </h1>
          <p className="text-sm text-gray-500 mt-1">Zero-trust, burn-on-read secure sharing.</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2 bg-navy text-white px-4 py-2 rounded-lg font-medium shadow-sm hover:bg-navy/90">
          <Plus size={20} /> Secure New Secret
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="px-6 py-4 text-xs font-black text-gray-500 uppercase tracking-widest">Secret Name</th>
              <th className="px-6 py-4 text-xs font-black text-gray-500 uppercase tracking-widest">Client</th>
              <th className="px-6 py-4 text-xs font-black text-gray-500 uppercase tracking-widest">Status</th>
              <th className="px-6 py-4 text-right text-xs font-black text-gray-500 uppercase tracking-widest">Share Link</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {secrets.length === 0 ? (
              <tr><td colSpan="4" className="text-center py-8 text-gray-400 font-medium">No active secrets.</td></tr>
            ) : secrets.map(secret => (
              <tr key={secret.id} className="hover:bg-gray-50/50">
                <td className="px-6 py-4 font-bold text-gray-900 flex items-center gap-2">
                  <Shield size={16} className={secret.is_viewed ? "text-gray-300" : "text-green-500"} />
                  {secret.secret_name}
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">{secret.clients?.name || 'N/A'}</td>
                <td className="px-6 py-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${secret.is_viewed ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
                    {secret.is_viewed ? 'Burned' : 'Active'}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  {!secret.is_viewed && (
                    <button onClick={() => copyLink(secret.id)} className="inline-flex items-center gap-1.5 text-xs font-bold text-navy hover:text-accent transition-colors bg-gray-100 px-3 py-1.5 rounded-lg">
                      {copiedId === secret.id ? <CheckCircle size={14} className="text-green-500"/> : <Copy size={14} />}
                      {copiedId === secret.id ? 'Copied' : 'Copy Link'}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-navy/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-8 w-full max-w-lg shadow-2xl animate-in zoom-in-95">
            <h2 className="text-2xl font-bold text-navy mb-2">Secure a Credential</h2>
            <p className="text-sm text-gray-500 mb-6 font-medium">Encrypt an API key, password, or environment variable.</p>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-1.5">Client</label>
                <select required className="w-full bg-gray-50 border border-gray-200 p-3 rounded-xl font-semibold text-sm outline-none focus:border-accent" value={formData.client_id} onChange={e => setFormData({...formData, client_id: e.target.value})}>
                  {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-1.5">Secret Name</label>
                <input type="text" placeholder="e.g. AWS Production Keys" required className="w-full bg-gray-50 border border-gray-200 p-3 rounded-xl font-semibold text-sm outline-none focus:border-accent" value={formData.secret_name} onChange={e => setFormData({...formData, secret_name: e.target.value})} />
              </div>

              <div>
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-1.5">Secure Payload</label>
                <textarea required rows="4" placeholder="Paste the sensitive data here. It will be encrypted immediately." className="w-full bg-gray-900 text-green-400 font-mono border border-gray-800 p-3 rounded-xl text-sm outline-none focus:ring-2 focus:ring-accent" value={formData.secret_value} onChange={e => setFormData({...formData, secret_value: e.target.value})} />
              </div>

              <div className="flex items-center gap-3 bg-red-50 p-4 rounded-xl border border-red-100">
                <input type="checkbox" id="burn" checked={formData.requires_burn} onChange={e => setFormData({...formData, requires_burn: e.target.checked})} className="w-5 h-5 accent-red-500" />
                <label htmlFor="burn" className="text-sm font-bold text-red-700 cursor-pointer">Burn on Read (Self-Destruct after 1 view)</label>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2 text-sm font-bold text-gray-400 hover:text-navy">Cancel</button>
                <button type="submit" className="px-6 py-2.5 bg-navy text-white rounded-xl font-bold flex items-center gap-2 hover:bg-navy/90"><Shield size={18}/> Encrypt & Save</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}