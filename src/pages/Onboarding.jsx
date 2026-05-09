import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Palette, CreditCard, UserPlus, ArrowRight, CheckCircle, Globe2 } from 'lucide-react';
import api from '../lib/api';

export default function Onboarding() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  
  // State for all steps
  const [brand, setBrand] = useState({ brand_name: '', brand_color: '#1E293B' });
  const [provider, setProvider] = useState('stripe'); // Default to Stripe globally
  const [keys, setKeys] = useState({ 
    paystack_public_key: '', 
    paystack_secret_key: '',
    stripe_public_key: '',
    stripe_secret_key: ''
  });
  const [client, setClient] = useState({ name: '', email: '', company: '' });

  // Failsafe: Grab org if they refreshed
  useEffect(() => {
    api.get('/orgs/me').then(res => {
      if (res.data?.id) {
        localStorage.setItem('current_org_id', res.data.id);
        localStorage.setItem('current_org_name', res.data.name);
        setBrand(prev => ({ ...prev, brand_name: res.data.name }));
      }
    }).catch(() => {});
  }, []);

  const completeOnboarding = async () => {
    setLoading(true);
    try {
      let orgId = localStorage.getItem('current_org_id');

      // 1. CREATE WORKSPACE
      if (!orgId) {
        const subdomain = brand.brand_name.toLowerCase().replace(/[^a-z0-9]/g, '-');
        const orgRes = await api.post('/orgs', { name: brand.brand_name, subdomain });
        orgId = orgRes.data.id;
        localStorage.setItem('current_org_id', orgId);
        localStorage.setItem('current_org_name', orgRes.data.name);
      }

      // 2. INJECT BRANDING
      await api.put(`/orgs/${orgId}/branding`, { navy: brand.brand_color, accent: '#00C896' });

      // 3. SECURE DYNAMIC PAYMENT VAULT
      await api.put(`/orgs/${orgId}/payments`, {
        provider: provider,
        stripe_pk: provider === 'stripe' ? keys.stripe_public_key : null,
        stripe_sk: provider === 'stripe' ? keys.stripe_secret_key : null,
        paystack_pk: provider === 'paystack' ? keys.paystack_public_key : null,
        paystack_sk: provider === 'paystack' ? keys.paystack_secret_key : null
      });
      
      // 4. CREATE CLIENT
      if (client.name && client.email) {
        await api.post('/clients', client);
      }
      
      window.location.href = '/'; 
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to complete setup. Please try again.');
      setLoading(false);
    }
  };

  // Helper to check if step 2 is valid
  const isPaymentValid = () => {
    if (provider === 'stripe') return keys.stripe_public_key && keys.stripe_secret_key;
    if (provider === 'paystack') return keys.paystack_public_key && keys.paystack_secret_key;
    return false;
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-xl w-full bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
        
        {/* Progress Bar */}
        <div className="flex items-center justify-between mb-8 relative">
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-gray-100 -z-10"></div>
          <div className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-accent -z-10 transition-all" style={{ width: `${((step - 1) / 2) * 100}%` }}></div>
          
          {[1, 2, 3].map(num => (
            <div key={num} className={`w-10 h-10 rounded-full flex items-center justify-center font-bold border-4 border-white ${step >= num ? 'bg-accent text-white' : 'bg-gray-200 text-gray-400'}`}>
              {num}
            </div>
          ))}
        </div>

        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-navy">
            {step === 1 ? 'Brand Your Portal' : step === 2 ? 'Connect Payment Gateway' : 'Add First Client'}
          </h1>
          <p className="text-gray-500 mt-1">
            {step === 1 ? 'How should your clients see you?' : step === 2 ? 'Where should the money go?' : 'Let\'s get you ready to bill.'}
          </p>
        </div>

        {/* STEP 1: BRANDING */}
        {step === 1 && (
          <div className="space-y-5 animate-in fade-in slide-in-from-right-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Agency / Freelancer Name</label>
              <input type="text" className="w-full p-3 border border-gray-300 rounded-lg outline-none focus:border-accent" value={brand.brand_name} onChange={e => setBrand({...brand, brand_name: e.target.value})} placeholder="e.g. Acme Studio" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Primary Brand Color</label>
              <div className="flex gap-3">
                <input type="color" className="h-12 w-12 rounded cursor-pointer" value={brand.brand_color} onChange={e => setBrand({...brand, brand_color: e.target.value})} />
                <input type="text" className="w-full p-3 border border-gray-300 rounded-lg outline-none uppercase font-mono focus:border-accent" value={brand.brand_color} onChange={e => setBrand({...brand, brand_color: e.target.value})} />
              </div>
            </div>
            <button onClick={() => setStep(2)} disabled={!brand.brand_name} className="w-full flex items-center justify-center gap-2 bg-navy text-white py-3 rounded-lg font-bold hover:bg-navy/90 disabled:opacity-50 mt-4 transition-all">
              Next Step <ArrowRight size={18} />
            </button>
          </div>
        )}

        {/* STEP 2: DYNAMIC GATEWAY */}
        {step === 2 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
            <div className="p-4 bg-green-50 text-green-800 text-sm rounded-lg flex items-start gap-3 border border-green-100">
              <CheckCircle className="shrink-0 text-green-600" size={20} />
              <p className="font-medium">You keep 100% of your earnings. Connect your API keys so clients pay you directly to your bank account.</p>
            </div>

            {/* Provider Selector */}
            <div>
              <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-3">Select Gateway</label>
              <div className="grid grid-cols-2 gap-3">
                <button 
                  onClick={() => setProvider('stripe')}
                  className={`p-4 rounded-xl border-2 font-bold flex flex-col items-center gap-2 transition-all ${provider === 'stripe' ? 'border-accent bg-accent/5 text-navy' : 'border-gray-100 text-gray-400 hover:border-gray-200'}`}
                >
                  <Globe2 size={24} /> Stripe (USD)
                </button>
                <button 
                  onClick={() => setProvider('paystack')}
                  className={`p-4 rounded-xl border-2 font-bold flex flex-col items-center gap-2 transition-all ${provider === 'paystack' ? 'border-accent bg-accent/5 text-navy' : 'border-gray-100 text-gray-400 hover:border-gray-200'}`}
                >
                  <CreditCard size={24} /> Paystack (NGN/USD)
                </button>
              </div>
            </div>

            {/* Dynamic Inputs */}
            {provider === 'stripe' ? (
              <div className="space-y-4 animate-in fade-in">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">Stripe Publishable Key</label>
                  <input type="text" className="w-full p-3 border border-gray-300 rounded-lg outline-none focus:border-accent font-mono text-sm" value={keys.stripe_public_key} onChange={e => setKeys({...keys, stripe_public_key: e.target.value})} placeholder="pk_live_..." />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">Stripe Secret Key</label>
                  <input type="password" className="w-full p-3 border border-gray-300 rounded-lg outline-none focus:border-accent font-mono text-sm" value={keys.stripe_secret_key} onChange={e => setKeys({...keys, stripe_secret_key: e.target.value})} placeholder="sk_live_..." />
                </div>
              </div>
            ) : (
              <div className="space-y-4 animate-in fade-in">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">Paystack Public Key</label>
                  <input type="text" className="w-full p-3 border border-gray-300 rounded-lg outline-none focus:border-accent font-mono text-sm" value={keys.paystack_public_key} onChange={e => setKeys({...keys, paystack_public_key: e.target.value})} placeholder="pk_live_..." />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">Paystack Secret Key</label>
                  <input type="password" className="w-full p-3 border border-gray-300 rounded-lg outline-none focus:border-accent font-mono text-sm" value={keys.paystack_secret_key} onChange={e => setKeys({...keys, paystack_secret_key: e.target.value})} placeholder="sk_live_..." />
                </div>
              </div>
            )}

            <div className="flex gap-3 mt-6">
              <button onClick={() => setStep(1)} className="px-6 py-3 border border-gray-200 text-gray-600 font-bold rounded-xl hover:bg-gray-50 transition-colors">Back</button>
              <button 
                onClick={() => setStep(3)} 
                disabled={!isPaymentValid()} 
                className="flex-1 flex items-center justify-center gap-2 bg-navy text-white py-3 rounded-xl font-bold hover:bg-navy/90 disabled:opacity-50 transition-all"
              >
                Next Step <ArrowRight size={18} />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: FIRST CLIENT */}
        {step === 3 && (
          <div className="space-y-5 animate-in fade-in slide-in-from-right-4">
             <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Client Contact Name</label>
              <input type="text" className="w-full p-3 border border-gray-300 rounded-lg outline-none focus:border-accent" value={client.name} onChange={e => setClient({...client, name: e.target.value})} placeholder="John Doe" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Client Email</label>
              <input type="email" className="w-full p-3 border border-gray-300 rounded-lg outline-none focus:border-accent" value={client.email} onChange={e => setClient({...client, email: e.target.value})} placeholder="john@company.com" />
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setStep(2)} className="px-6 py-3 border border-gray-200 text-gray-600 font-bold rounded-xl hover:bg-gray-50 transition-colors">Back</button>
              <button 
                onClick={completeOnboarding} 
                disabled={loading || !client.name || !client.email} 
                className="flex-1 flex items-center justify-center gap-2 bg-accent text-white py-3 rounded-xl font-black hover:bg-accent/90 hover:shadow-lg hover:shadow-accent/20 disabled:opacity-50 transition-all"
              >
                {loading ? 'Securing Workspace...' : 'Complete Setup & Enter Dashboard'}
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}