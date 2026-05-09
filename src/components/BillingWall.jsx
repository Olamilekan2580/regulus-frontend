import { useState } from 'react';
import { Lock, CreditCard } from 'lucide-react';
import api from '../lib/api';

export default function BillingWall() {
  const [loading, setLoading] = useState(false);
  const orgId = localStorage.getItem('current_org_id');

  const handleSubscribe = async () => {
    setLoading(true);
    try {
      // Calls your new backend subscription route
      const res = await api.post('/billing/subscribe', { orgId });
      window.location.href = res.data.url; // Redirects to Stripe Checkout
    } catch (err) {
      alert('Failed to initialize billing. Please contact support.');
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-navy/95 backdrop-blur-xl z-[9999] flex items-center justify-center p-4 animate-in fade-in duration-300">
      <div className="bg-white max-w-md w-full rounded-3xl p-10 text-center shadow-2xl relative overflow-hidden">
        
        {/* Decorative Top Banner */}
        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-red-500 to-orange-500" />

        <div className="w-20 h-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6 border-4 border-red-100 shadow-inner">
          <Lock size={36} strokeWidth={2.5} />
        </div>
        
        <h2 className="text-3xl font-black text-navy mb-3 tracking-tight">Workspace Locked</h2>
        <p className="text-gray-500 font-medium mb-8 leading-relaxed">
          Your 14-day trial of Regulus has concluded. Upgrade to our unlimited $9.99/mo plan to instantly unlock your workspace, team, and clients.
        </p>
        
        <button 
          onClick={handleSubscribe}
          disabled={loading}
          className="w-full py-4 bg-navy text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-navy/20 transition-all active:scale-95 disabled:opacity-50"
        >
          <CreditCard size={20} /> {loading ? 'Initializing Stripe...' : 'Upgrade Now - $9.99/mo'}
        </button>
        
        <p className="text-xs text-gray-400 mt-6 font-bold uppercase tracking-widest">
          Secure payment via Stripe
        </p>
      </div>
    </div>
  );
}