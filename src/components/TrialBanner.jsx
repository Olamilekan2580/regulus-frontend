import { useState, useEffect } from 'react';
import { Clock, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api';

export default function TrialBanner() {
  const [daysLeft, setDaysLeft] = useState(null);
  const [status, setStatus] = useState('loading');
  const navigate = useNavigate();

  useEffect(() => {
    let isMounted = true; 

    const fetchStatus = async () => {
      const orgId = localStorage.getItem('current_org_id');
      if (!orgId) return;

      try {
        const res = await api.get(`/orgs/${orgId}`);
        if (!isMounted) return;

        const { subscription_status, trial_ends_at } = res.data;
        
        setStatus(subscription_status || 'trialing');

        if (trial_ends_at) {
          const end = new Date(trial_ends_at);
          
          if (!isNaN(end.getTime())) {
            const diff = Math.ceil((end - new Date()) / (1000 * 60 * 60 * 24));
            setDaysLeft(diff > 0 ? diff : 0);
          } else {
            setDaysLeft(0); 
          }
        } else {
          setDaysLeft(0);
        }
      } catch (e) { 
        console.error('[Banner Telemetry Error]:', e.message); 
      }
    };
    
    fetchStatus();

    return () => {
      isMounted = false;
    };
  }, []);

  if (status === 'loading' || status === 'active') return null;

  const isExpired = daysLeft === 0;

  return (
    <div className="relative w-full bg-navy text-white py-2.5 px-4 md:px-6 flex items-center justify-between border-b border-white/10 shrink-0 z-[60]">
      <div className="flex items-center gap-2 text-[10px] md:text-xs font-bold uppercase tracking-widest truncate pr-2">
        <Clock size={14} className={`shrink-0 ${isExpired ? "text-red-500" : "text-accent"}`} />
        <span className={`truncate ${isExpired ? "text-red-400" : ""}`}>
          {isExpired ? (
            <>
              <span className="md:hidden">Trial Expired</span>
              <span className="hidden md:inline">Your workspace trial has expired</span>
            </>
          ) : (
            <>
              <span className="md:hidden">{daysLeft} days left</span>
              <span className="hidden md:inline">{daysLeft} days left in your free trial</span>
            </>
          )}
        </span>
      </div>
      <button 
        onClick={() => navigate('/settings')}
        className="bg-accent text-navy text-[10px] font-black px-4 py-1.5 rounded-full uppercase hover:scale-105 transition-transform flex items-center gap-1.5 shadow-[0_0_15px_rgba(0,200,150,0.2)] active:scale-95 shrink-0"
      >
        <Zap size={10} className="hidden sm:block" /> Upgrade <span className="hidden sm:inline">Now</span>
      </button>
    </div>
  );
}