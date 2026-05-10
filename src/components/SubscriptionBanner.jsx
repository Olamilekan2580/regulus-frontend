import { useState, useEffect } from 'react';
import { Clock, ArrowRight } from 'lucide-react';
import api from '../lib/api';

export default function SubscriptionBanner() {
  const [trialDays, setTrialDays] = useState(null);
  const [status, setStatus] = useState('active'); // active, trialing, expired

  useEffect(() => {
    const checkSub = async () => {
      const orgId = localStorage.getItem('current_org_id');
      if (!orgId) return;

      try {
        const res = await api.get(`/orgs/${orgId}`);
        if (!res.data) return;

        const { subscription_status, trial_ends_at } = res.data;
        setStatus(subscription_status || 'trialing');

        if (trial_ends_at && subscription_status === 'trialing') {
          const end = new Date(trial_ends_at);
          const now = new Date();
          const daysLeft = Math.ceil((end - now) / (1000 * 60 * 60 * 24));
          setTrialDays(daysLeft > 0 ? daysLeft : 0);
          
          if (daysLeft <= 0) setStatus('expired');
        }
      } catch (err) {
        console.error('Failed to fetch subscription status');
      }
    };
    checkSub();
  }, []);

  if (status === 'active' || trialDays === null) return null;

  return (
    <div className={`w-full py-2 px-4 flex items-center justify-center gap-4 text-sm font-bold shadow-sm z-50 relative ${
      status === 'expired' || trialDays <= 2 
        ? 'bg-red-500 text-white' 
        : 'bg-navy text-white'
    }`}>
      <div className="flex items-center gap-2">
        <Clock size={16} className={status === 'expired' ? 'animate-pulse' : 'text-accent'} />
        {status === 'expired' ? (
          <span>Your free trial has expired. Core features are locked.</span>
        ) : (
          <span>{trialDays} days left in your free trial.</span>
        )}
      </div>
      <a href="/settings" className="flex items-center gap-1 text-[11px] uppercase tracking-widest bg-white/20 hover:bg-white/30 px-3 py-1 rounded-full transition-colors cursor-pointer">
        Subscribe Now <ArrowRight size={12} />
      </a>
    </div>
  );
}