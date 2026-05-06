import { useState, useEffect } from 'react';
import { User, Briefcase, CreditCard, Palette } from 'lucide-react';
import api from '../lib/api';

export default function Profile() {
  const [formData, setFormData] = useState({ brand_name: '', brand_color: '#1E293B', paystack_public_key: '', paystack_secret_key: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    api.get('/settings').then(res => {
      if (res.data) setFormData(prev => ({ ...prev, ...res.data }));
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');
    try {
      await api.put('/settings', formData);
      setMessage('Settings securely vaulted.');
    } catch (err) {
      setMessage('Failed to save settings.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="animate-pulse text-gray-500">Loading settings...</div>;

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-navy">Platform Settings</h1>
        <p className="text-sm text-gray-500 mt-1">Configure your white-label portal and payment gateway.</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 space-y-8">
        {message && <div className="p-3 bg-blue-50 text-blue-700 text-sm rounded-lg border border-blue-100 font-medium">{message}</div>}
        
        {/* White-Labeling */}
        <div>
          <h2 className="text-lg font-bold text-navy mb-4 flex items-center gap-2"><Palette size={20} /> Portal Branding</h2>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Brand/Agency Name</label>
              <input type="text" className="w-full p-2.5 border border-gray-300 rounded-lg outline-none focus:border-accent" value={formData.brand_name || ''} onChange={e => setFormData({...formData, brand_name: e.target.value})} placeholder="e.g. Acme Labs" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Brand Hex Color</label>
              <div className="flex gap-3">
                <input type="color" className="h-11 w-11 rounded cursor-pointer" value={formData.brand_color || '#1E293B'} onChange={e => setFormData({...formData, brand_color: e.target.value})} />
                <input type="text" className="w-full p-2.5 border border-gray-300 rounded-lg outline-none focus:border-accent" value={formData.brand_color || '#1E293B'} onChange={e => setFormData({...formData, brand_color: e.target.value})} />
              </div>
            </div>
          </div>
        </div>

        {/* Payment Integration */}
        <div className="pt-6 border-t border-gray-100">
          <h2 className="text-lg font-bold text-navy mb-4 flex items-center gap-2"><CreditCard size={20} /> Paystack Integration</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Public Key</label>
              <input type="text" className="w-full p-2.5 border border-gray-300 rounded-lg outline-none focus:border-accent font-mono text-sm" value={formData.paystack_public_key || ''} onChange={e => setFormData({...formData, paystack_public_key: e.target.value})} placeholder="pk_test_..." />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Secret Key</label>
              <input type="password" className="w-full p-2.5 border border-gray-300 rounded-lg outline-none focus:border-accent font-mono text-sm" value={formData.paystack_secret_key || ''} onChange={e => setFormData({...formData, paystack_secret_key: e.target.value})} placeholder="sk_test_..." />
              <p className="text-xs text-gray-500 mt-1">This key is encrypted and never exposed to the client portal.</p>
            </div>
          </div>
        </div>

        <div className="pt-6 border-t border-gray-100 flex justify-end">
          <button disabled={saving} type="submit" className="px-6 py-2.5 bg-navy text-white font-medium rounded-lg hover:bg-navy/90 transition-colors disabled:opacity-70">
            {saving ? 'Saving...' : 'Save Configuration'}
          </button>
        </div>
      </form>
    </div>
  );
}
