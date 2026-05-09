import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Palette, CreditCard, UserPlus, ArrowRight, CheckCircle, Globe2, Loader2 } from 'lucide-react';
import api from '../lib/api';

export default function Onboarding() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  
  // State for all steps
  const [brand, setBrand] = useState({ brand_name: '', brand_color: '#1E293B' });
  const [provider, setProvider] = useState('stripe'); 
  const [keys, setKeys] = useState({ 
    paystack_public_key: '', 
    paystack_secret_key: '',
    stripe_public_key: '',
    stripe_secret_key: ''
  });
  const [client, setClient] = useState({ name: '', email: '', company: '' });

  useEffect(() => {
    // If they already have an org ID, they might have partially finished.
    // We fetch it to pre-fill the name and avoid duplicate org creation.
    api.get('/orgs/me').then(res => {
      if (res.data?.id) {
        localStorage.setItem('current_org_id', res.data.id);
        localStorage.setItem('current_org_name', res.data.name);
        setBrand(prev => ({ ...prev, brand_name: res.data.name }));
        
        // If the DB says they are already done, get them out of here immediately.
        if (res.data.onboarding_completed) {
          window.location.href = '/';
        }
      }
    }).catch(() => {});
  }, []);

  const completeOnboarding = async () => {
    setLoading(true);
    try {
      let orgId = localStorage.getItem('current_org_id');

      // 1. ATOMIC WORKSPACE CREATION
      if (!orgId) {
        const subdomain = brand.brand_name.toLowerCase().replace(/[^a-z0-9]/g, '-');
        const orgRes = await api.post('/orgs', { name: brand.brand_name, subdomain });
        orgId = orgRes.data.id;
        localStorage.setItem('current_org_id', orgId);
        localStorage.setItem('current_org_name', orgRes.data.name);
      }

      // 2. PARALLEL CONFIGURATION (Branding & Payments)
      await Promise.all([
        api.put(`/orgs/${orgId}/branding`, { 
          navy: brand.brand_color, 
          accent: '#00C896' 
        }),
        api.put(`/orgs/${orgId}/payments`, {
          provider: provider,
          stripe_pk: provider === 'stripe' ? keys.stripe_public_key : null,
          stripe_sk: provider === 'stripe' ? keys.stripe_secret_key : null,
          paystack_pk: provider === 'paystack' ? keys.paystack_public_key : null,
          paystack_sk: provider === 'paystack' ? keys.paystack_secret_key : null
        })
      ]);
      
      // 3. SEED INITIAL DATA (Optional Client)
      if (client.name && client.email) {
        await api.post('/clients', client);
      }

      // 4. THE LOOP BREAKER: Finalize Onboarding Status in DB
      await api.put(`/orgs/${orgId}/complete-onboarding`);
      
      // 5. HARD REDIRECT: Ensure all state is wiped and reloaded from DB truth
      window.location.href = '/'; 

    } catch (err) {
      console.error('[Onboarding Error]:', err);
      alert(err.response?.data?.error || 'Finalization failed. Please check your internet and try again.');
      setLoading(false);
    }
  };

  const isPaymentValid = () => {
    if (provider === 'stripe') return keys.stripe_public_key && keys.stripe_secret_key;
    if (provider === 'paystack') return keys.paystack_public_key && keys.paystack_secret_key;
    return false;
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-xl w-full bg-white rounded-3xl shadow-xl border border-gray-100 p-10">
        
        {/* Progress Navigation */}
        <div className="flex items-center justify-between mb-10 relative">
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-gray-100 -z-10"></div>
          <div className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-accent -z-10 transition-all duration-500" style={{ width: `${((step - 1) / 2) * 100}%` }}></div>
          
          {[1, 2, 3].map(num => (
            <div key={num} className={`w-10 h-10 rounded-full flex items-center justify-center font-bold border-4 border-white transition-colors duration-300 ${step >= num ? 'bg-accent text-white shadow-lg shadow-accent/20' : 'bg-gray-200 text-gray-400'}`}>
              {num}
            </div>
          ))}
        </div>

        <div className="mb-10 text-center">
          <h1 className="text-3xl font-black text-navy tracking-tight">
            {step === 1 ? 'Whitelabel Your Agency' : step === 2 ? 'Gateway Integration' : 'Your First Client'}
          </h1>
          <p className="text-gray-500 mt-2 font-medium">
            {step === 1 ? 'Personalize how clients perceive your brand.' : step === 2 ? 'Select your preferred payment processor.' : 'Let’s set up your first billing target.'}
          </p>
        </div>

        {/* STEP 1: BRANDING */}
        {step === 1 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
            <div>
              <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Agency Name</label>
              <input type="text" className="w-full p-4 border border-gray-200 rounded-xl outline-none focus:border-accent font-bold text-navy bg-gray-50/50" value={brand.brand_name} onChange={e => setBrand({...brand, brand_name: e.target.value})} placeholder="e.g. Omole Systems" />
            </div>
            <div>
              <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Primary Theme Color</label>
              <div className="flex gap-4">
                <input type="color" className="h-14 w-14 rounded-xl cursor-pointer border-0 p-0 bg-transparent" value={brand.brand_color} onChange={e => setBrand({...brand, brand_color: e.target.value})} />
                <input type="text" className="w-full p-4 border border-gray-200 rounded-xl outline-none uppercase font-mono font-bold text-navy bg-gray-50/50" value={brand.brand_color} onChange={e => setBrand({...brand, brand_color: e.target.value})} />
              </div>
            </div>
            <button onClick={() => setStep(2)} disabled={!brand.brand_name} className="w-full flex items-center justify-center gap-2 bg-navy text-white py-4 rounded-xl font-black hover:bg-navy/90 disabled:opacity-50 mt-4 transition-all active:scale-95 shadow-lg shadow-navy/10">
              Continue <ArrowRight size={18} />
            </button>
          </div>
        )}

        {/* STEP 2: GATEWAY */}
        {step === 2 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
            <div className="grid grid-cols-2 gap-4">
              <button onClick={() => setProvider('stripe')} className={`p-5 rounded-2xl border-2 font-black flex flex-col items-center gap-3 transition-all ${provider === 'stripe' ? 'border-accent bg-accent/5 text-navy shadow-inner' : 'border-gray-100 text-gray-400 hover:border-gray-200'}`}>
                <Globe2 size={28} /> Stripe
              </button>
              <button onClick={() => setProvider('paystack')} className={`p-5 rounded-2xl border-2 font-black flex flex-col items-center gap-3 transition-all ${provider === 'paystack' ? 'border-accent bg-accent/5 text-navy shadow-inner' : 'border-gray-100 text-gray-400 hover:border-gray-200'}`}>
                <CreditCard size={28} /> Paystack
              </button>
            </div>

            <div className="space-y-4">
              {provider === 'stripe' ? (
                <>
                  <input type="text" className="w-full p-4 border border-gray-200 rounded-xl outline-none font-mono text-sm bg-gray-50/50" value={keys.stripe_public_key} onChange={e => setKeys({...keys, stripe_public_key: e.target.value})} placeholder="Stripe Publishable Key" />
                  <input type="password" className="w-full p-4 border border-gray-200 rounded-xl outline-none font-mono text-sm bg-gray-50/50" value={keys.stripe_secret_key} onChange={e => setKeys({...keys, stripe_secret_key: e.target.value})} placeholder="Stripe Secret Key" />
                </>
              ) : (
                <>
                  <input type="text" className="w-full p-4 border border-gray-200 rounded-xl outline-none font-mono text-sm bg-gray-50/50" value={keys.paystack_public_key} onChange={e => setKeys({...keys, paystack_public_key: e.target.value})} placeholder="Paystack Public Key" />
                  <input type="password" className="w-full p-4 border border-gray-200 rounded-xl outline-none font-mono text-sm bg-gray-50/50" value={keys.paystack_secret_key} onChange={e => setKeys({...keys, paystack_secret_key: e.target.value})} placeholder="Paystack Secret Key" />
                </>
              )}
            </div>

            <div className="flex gap-4 mt-6">
              <button onClick={() => setStep(1)} className="px-8 py-4 border border-gray-200 text-gray-500 font-bold rounded-xl hover:bg-gray-50 transition-colors">Back</button>
              <button onClick={() => setStep(3)} disabled={!isPaymentValid()} className="flex-1 flex items-center justify-center gap-2 bg-navy text-white py-4 rounded-xl font-black hover:bg-navy/90 disabled:opacity-50 transition-all active:scale-95 shadow-lg shadow-navy/10">
                Next <ArrowRight size={18} />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: FINALIZATION */}
        {step === 3 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
             <div className="space-y-4">
              <input type="text" className="w-full p-4 border border-gray-200 rounded-xl outline-none font-bold text-navy bg-gray-50/50" value={client.name} onChange={e => setClient({...client, name: e.target.value})} placeholder="Client Full Name" />
              <input type="email" className="w-full p-4 border border-gray-200 rounded-xl outline-none font-bold text-navy bg-gray-50/50" value={client.email} onChange={e => setClient({...client, email: e.target.value})} placeholder="Client Email Address" />
            </div>
            
            <div className="flex gap-4 mt-6">
              <button onClick={() => setStep(2)} className="px-8 py-4 border border-gray-200 text-gray-500 font-bold rounded-xl hover:bg-gray-50 transition-colors" disabled={loading}>Back</button>
              <button 
                onClick={completeOnboarding} 
                disabled={loading || !client.name || !client.email} 
                className="flex-1 flex items-center justify-center gap-3 bg-accent text-white py-4 rounded-xl font-black hover:bg-accent/90 hover:shadow-xl hover:shadow-accent/20 disabled:opacity-50 transition-all active:scale-95"
              >
                {loading ? <Loader2 className="animate-spin" size={24} /> : 'Launch Dashboard'}
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}