import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Palette, CreditCard, UserPlus, ArrowRight, CheckCircle } from 'lucide-react';
import api from '../lib/api';

export default function Onboarding() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  
  // State for all steps
  const [brand, setBrand] = useState({ brand_name: '', brand_color: '#1E293B' });
  const [keys, setKeys] = useState({ paystack_public_key: '', paystack_secret_key: '' });
  const [client, setClient] = useState({ name: '', email: '', company: '' });

  const completeOnboarding = async () => {
    setLoading(true);
    try {
      // 1. Save settings and mark onboarding complete
      await api.put('/settings', { ...brand, ...keys, onboarding_completed: true });
      
      // 2. Create the first client if they filled it out
      if (client.name && client.email) {
        await api.post('/clients', client);
      }
      
      // 3. Push to dashboard
      window.location.href = '/'; 
    } catch (err) {
      console.error(err);
      alert('Failed to save setup. Please try again.');
      setLoading(false);
    }
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
              <input type="text" className="w-full p-3 border border-gray-300 rounded-lg outline-none" value={brand.brand_name} onChange={e => setBrand({...brand, brand_name: e.target.value})} placeholder="e.g. Acme Studio" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Primary Brand Color</label>
              <div className="flex gap-3">
                <input type="color" className="h-12 w-12 rounded cursor-pointer" value={brand.brand_color} onChange={e => setBrand({...brand, brand_color: e.target.value})} />
                <input type="text" className="w-full p-3 border border-gray-300 rounded-lg outline-none uppercase font-mono" value={brand.brand_color} onChange={e => setBrand({...brand, brand_color: e.target.value})} />
              </div>
            </div>
            <button onClick={() => setStep(2)} disabled={!brand.brand_name} className="w-full flex items-center justify-center gap-2 bg-navy text-white py-3 rounded-lg font-medium hover:bg-navy/90 disabled:opacity-50 mt-4">
              Next Step <ArrowRight size={18} />
            </button>
          </div>
        )}

        {/* STEP 2: PAYSTACK */}
        {step === 2 && (
          <div className="space-y-5 animate-in fade-in slide-in-from-right-4">
            <div className="p-4 bg-blue-50 text-blue-800 text-sm rounded-lg flex items-start gap-3">
              <CheckCircle className="shrink-0 text-blue-600" size={20} />
              <p>You keep 100% of your earnings. Connect your Paystack API keys so clients pay you directly.</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Paystack Public Key</label>
              <input type="text" className="w-full p-3 border border-gray-300 rounded-lg outline-none font-mono text-sm" value={keys.paystack_public_key} onChange={e => setKeys({...keys, paystack_public_key: e.target.value})} placeholder="pk_test_..." />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Paystack Secret Key</label>
              <input type="password" className="w-full p-3 border border-gray-300 rounded-lg outline-none font-mono text-sm" value={keys.paystack_secret_key} onChange={e => setKeys({...keys, paystack_secret_key: e.target.value})} placeholder="sk_test_..." />
            </div>
            <div className="flex gap-3 mt-4">
              <button onClick={() => setStep(1)} className="px-6 py-3 border border-gray-200 text-gray-600 font-medium rounded-lg hover:bg-gray-50">Back</button>
              <button onClick={() => setStep(3)} disabled={!keys.paystack_public_key || !keys.paystack_secret_key} className="flex-1 flex items-center justify-center gap-2 bg-navy text-white py-3 rounded-lg font-medium hover:bg-navy/90 disabled:opacity-50">
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
              <input type="text" className="w-full p-3 border border-gray-300 rounded-lg outline-none" value={client.name} onChange={e => setClient({...client, name: e.target.value})} placeholder="John Doe" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Client Email</label>
              <input type="email" className="w-full p-3 border border-gray-300 rounded-lg outline-none" value={client.email} onChange={e => setClient({...client, email: e.target.value})} placeholder="john@company.com" />
            </div>
            <div className="flex gap-3 mt-4">
              <button onClick={() => setStep(2)} className="px-6 py-3 border border-gray-200 text-gray-600 font-medium rounded-lg hover:bg-gray-50">Back</button>
              <button onClick={completeOnboarding} disabled={loading || !client.name || !client.email} className="flex-1 flex items-center justify-center gap-2 bg-accent text-white py-3 rounded-lg font-medium hover:bg-accent/90 disabled:opacity-50">
                {loading ? 'Setting up workspace...' : 'Complete Setup & Enter Dashboard'}
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
