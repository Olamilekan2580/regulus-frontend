import { useState, useEffect } from 'react';
import { Clock, Zap } from 'lucide-react';
import api from '../lib/api';

export default function TrialBanner() {
  const [daysLeft, setDaysLeft] = useState(null);

  useEffect(() => {
    const fetchStatus = async () => {
      const orgId = localStorage.getItem('current_org_id');
      if (!orgId) return;
      try {
        const res = await api.get(`/orgs/${orgId}`);
        const end = new Date(res.data.trial_ends_at);
        const diff = Math.ceil((end - new Date()) / (1000 * 60 * 60 * 24));
        setDaysLeft(diff > 0 ? diff : 0);
      } catch (e) { console.error(e); }
    };
    fetchStatus();
  }, []);

  if (daysLeft === null) return null;

  return (
    <div className="bg-navy text-white py-2 px-6 flex items-center justify-between border-b border-white/10">
      <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest">
        <Clock size={14} className="text-accent" />
        <span>{daysLeft} days left in your free trial</span>
      </div>
      <button className="bg-accent text-navy text-[10px] font-black px-4 py-1.5 rounded-full uppercase hover:scale-105 transition-transform flex items-center gap-1">
        <Zap size={10} /> Upgrade Now
      </button>
    </div>
  );
}