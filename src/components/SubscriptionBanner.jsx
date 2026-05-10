import { useState, useEffect } from 'react';
import { Clock, Zap } from 'lucide-react';
import api from '../lib/api';

export default function SubscriptionBanner() {
  const [daysLeft, setDaysLeft] = useState(null);
  const [status, setStatus] = useState('trialing');

  useEffect(() => {
    const fetchStatus = async () => {
      const orgId = localStorage.getItem('current_org_id');
      // GUARD 1: If there's no Org ID, don't even try to fetch
      if (!orgId) return;

      try {
        const res = await api.get(`/orgs/${orgId}`);
        // GUARD 2: Ensure data exists before reading it
        if (!res.data) return;

        const { subscription_status, trial_ends_at } = res.data;
        setStatus(subscription_status || 'trialing');

        if (trial_ends_at) {
          const end = new Date(trial_ends_at);
          const diff = Math.ceil((end - new Date()) / (1000 * 60 * 60 * 24));
          setDaysLeft(diff > 0 ? diff : 0);
        }
      } catch (e) {
        console.error('Banner failed to load status:', e.message);
      }
    };
    fetchStatus();
  }, []);

  // GUARD 3: If we are already paid (active) or still loading, don't render anything
  if (status === 'active' || daysLeft === null) return null;

  return (
    <div className="bg-navy text-white py-2 px-6 flex items-center justify-between border-b border-white/10 shrink-0">
      <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest">
        <Clock size={14} className="text-accent" />
        <span>{daysLeft} days left in your free trial</span>
      </div>
      <a href="/settings" className="bg-accent text-navy text-[10px] font-black px-4 py-1.5 rounded-full uppercase hover:scale-105 transition-transform flex items-center gap-1">
        <Zap size={10} /> Upgrade Now
      </a>
    </div>
  );
}