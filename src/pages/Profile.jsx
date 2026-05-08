import { useState, useEffect } from 'react';
import { Palette, CreditCard, Eye, EyeOff, Save, CheckCircle2 } from 'lucide-react';
import api from '../lib/api';

export default function Profile() {
  const [formData, setFormData] = useState({ 
    brand_name: '', 
    brand_color: '#1E293B', 
    default_gateway: 'paystack',
    paystack_public_key: '', 
    paystack_secret_key: '',
    stripe_public_key: '',
    stripe_secret_key: ''
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  
  // Visibility toggles for secure keys
  const [showPaystack, setShowPaystack] = useState(false);
  const [showStripe, setShowStripe] = useState(false);

  useEffect(() => {
    api.get('/settings').then(res => {
      if (res.data) setFormData(prev => ({ ...prev, ...res.data }));
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage({ type: '', text: '' });
    try {
      await api.put('/settings', formData);
      setMessage({ type: 'success', text: 'Configuration securely vaulted.' });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to save configuration.' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center p-12 text-gray-400">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-navy mr-3"></div>
      Loading platform settings...
    </div>
  );

  return (
    <div className="max-w-4xl space-y-8 pb-12">
      <div>
        <h1 className="text-2xl font-bold text-navy tracking-tight">Platform Settings</h1>
        <p className="text-sm text-gray-500 mt-1 font-medium">Configure your white-label portal and payment routing.</p>
      </div>

      {message.text && (
        <div className={`p-4 rounded-xl font-medium text-sm flex items-center gap-2 animate-in fade-in ${message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
          <CheckCircle2 size={16} className={message.type === 'success' ? 'text-green-600' : 'text-red-600'} />
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        
        {/* White-Labeling */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <h2 className="text-lg font-bold text-navy mb-6 flex items-center gap-2">
            <Palette size={20} className="text-gray-400" /> Portal Branding
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Brand/Agency Name</label>
              <input type="text" className="w-full bg-gray-50 border border-gray-200 p-3 rounded-xl focus:bg-white focus:ring-2 focus:ring-navy/20 focus:border-navy outline-none transition-all text-sm font-medium" value={formData.brand_name || ''} onChange={e => setFormData({...formData, brand_name: e.target.value})} placeholder="e.g. Acme Labs" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Brand Hex Color</label>
              <div className="flex gap-3">
                <input type="color" className="h-12 w-12 rounded-lg cursor-pointer border-0 p-0" value={formData.brand_color || '#1E293B'} onChange={e => setFormData({...formData, brand_color: e.target.value})} />
                <input type="text" className="w-full bg-gray-50 border border-gray-200 p-3 rounded-xl focus:bg-white focus:ring-2 focus:ring-navy/20 focus:border-navy outline-none transition-all text-sm font-medium uppercase" value={formData.brand_color || '#1E293B'} onChange={e => setFormData({...formData, brand_color: e.target.value})} />
              </div>
            </div>
          </div>
        </div>

        {/* Payment Routing */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <div className="flex justify-between items-end mb-6">
            <h2 className="text-lg font-bold text-navy flex items-center gap-2">
              <CreditCard size={20} className="text-gray-400" /> Payment Routing
            </h2>
            <div className="w-48">
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Active Gateway</label>
              <select 
                className="w-full bg-gray-50 border border-gray-200 py-2 px-3 rounded-lg focus:bg-white focus:ring-2 focus:ring-navy/20 focus:border-navy outline-none transition-all text-sm font-bold appearance-none text-navy cursor-pointer"
                value={formData.default_gateway || 'paystack'}
                onChange={e => setFormData({...formData, default_gateway: e.target.value})}
              >
                <option value="paystack">Paystack</option>
                <option value="stripe">Stripe</option>
              </select>
            </div>
          </div>

          <div className="space-y-8 pt-6 border-t border-gray-50">
            {/* Paystack Config */}
            <div className={`transition-opacity ${formData.default_gateway !== 'paystack' ? 'opacity-40 grayscale' : 'opacity-100'}`}>
              <h3 className="text-sm font-bold text-navy mb-4 flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${formData.default_gateway === 'paystack' ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                Paystack Configuration
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Public Key</label>
                  <input type="text" className="w-full bg-gray-50 border border-gray-200 p-3 rounded-xl focus:bg-white focus:ring-2 focus:ring-navy/20 focus:border-navy outline-none transition-all font-mono text-sm" value={formData.paystack_public_key || ''} onChange={e => setFormData({...formData, paystack_public_key: e.target.value})} placeholder="pk_live_..." />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Secret Key</label>
                  <div className="relative">
                    <input type={showPaystack ? "text" : "password"} className="w-full bg-gray-50 border border-gray-200 p-3 rounded-xl focus:bg-white focus:ring-2 focus:ring-navy/20 focus:border-navy outline-none transition-all font-mono text-sm pr-12" value={formData.paystack_secret_key || ''} onChange={e => setFormData({...formData, paystack_secret_key: e.target.value})} placeholder="sk_live_..." />
                    <button type="button" onClick={() => setShowPaystack(!showPaystack)} className="absolute right-4 top-3.5 text-gray-400 hover:text-navy transition-colors">
                      {showPaystack ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Stripe Config */}
            <div className={`transition-opacity ${formData.default_gateway !== 'stripe' ? 'opacity-40 grayscale' : 'opacity-100'}`}>
              <h3 className="text-sm font-bold text-navy mb-4 flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${formData.default_gateway === 'stripe' ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                Stripe Configuration
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Publishable Key</label>
                  <input type="text" className="w-full bg-gray-50 border border-gray-200 p-3 rounded-xl focus:bg-white focus:ring-2 focus:ring-navy/20 focus:border-navy outline-none transition-all font-mono text-sm" value={formData.stripe_public_key || ''} onChange={e => setFormData({...formData, stripe_public_key: e.target.value})} placeholder="pk_live_..." />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Secret Key</label>
                  <div className="relative">
                    <input type={showStripe ? "text" : "password"} className="w-full bg-gray-50 border border-gray-200 p-3 rounded-xl focus:bg-white focus:ring-2 focus:ring-navy/20 focus:border-navy outline-none transition-all font-mono text-sm pr-12" value={formData.stripe_secret_key || ''} onChange={e => setFormData({...formData, stripe_secret_key: e.target.value})} placeholder="sk_live_..." />
                    <button type="button" onClick={() => setShowStripe(!showStripe)} className="absolute right-4 top-3.5 text-gray-400 hover:text-navy transition-colors">
                      {showStripe ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sticky Action Footer */}
        <div className="flex justify-end pt-4">
          <button 
            disabled={saving} 
            type="submit" 
            className="flex items-center gap-2 px-8 py-3.5 bg-navy text-white font-bold rounded-xl hover:bg-navy/90 transition-all shadow-lg active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {saving ? (
              <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> Saving...</>
            ) : (
              <><Save size={18} /> Save Configuration</>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}