/**
 * @fileoverview Global Trial Notification Banner
 * @architecture Memory-Safe, State-Aware, Graceful Fallbacks
 * * CRITICAL FIXES APPLIED:
 * - Solves Issue #17: Implemented `isNaN` guards. If `trial_ends_at` is null, the app no longer crashes.
 * - State-Aware Hiding: Banner automatically unmounts if `subscription_status` is 'active'.
 * - Routing: Wired the Upgrade button to push the user directly to the Settings billing module.
 */

import { useState, useEffect } from 'react';
import { Clock, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api';

export default function TrialBanner() {
  const [daysLeft, setDaysLeft] = useState(null);
  const [status, setStatus] = useState('loading');
  const navigate = useNavigate();

  useEffect(() => {
    let isMounted = true; // 🔒 Memory leak protection

    const fetchStatus = async () => {
      const orgId = localStorage.getItem('current_org_id');
      if (!orgId) return;

      try {
        const res = await api.get(`/orgs/${orgId}`);
        if (!isMounted) return;

        const { subscription_status, trial_ends_at } = res.data;
        
        setStatus(subscription_status || 'trialing');

        // 🛡️ CRITICAL FIX: Safe Date Parsing
        if (trial_ends_at) {
          const end = new Date(trial_ends_at);
          
          if (!isNaN(end.getTime())) {
            const diff = Math.ceil((end - new Date()) / (1000 * 60 * 60 * 24));
            setDaysLeft(diff > 0 ? diff : 0);
          } else {
            setDaysLeft(0); // Graceful fallback if timestamp is corrupted
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

  // 1. Hide if we are still fetching data to prevent layout shift
  // 2. Hide if the user has already paid (Active Enterprise/Agency tier)
  if (status === 'loading' || status === 'active') return null;

  const isExpired = daysLeft === 0;

  return (
    <div className="bg-navy text-white py-2 px-6 flex items-center justify-between border-b border-white/10 shrink-0 z-50">
      <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest">
        <Clock size={14} className={isExpired ? "text-red-500" : "text-accent"} />
        <span className={isExpired ? "text-red-400" : ""}>
          {isExpired 
            ? 'Your workspace trial has expired' 
            : `${daysLeft} days left in your free trial`}
        </span>
      </div>
      <button 
        onClick={() => navigate('/settings')}
        className="bg-accent text-navy text-[10px] font-black px-4 py-1.5 rounded-full uppercase hover:scale-105 transition-transform flex items-center gap-1 shadow-[0_0_15px_rgba(0,200,150,0.2)] active:scale-95"
      >
        <Zap size={10} /> Upgrade Now
      </button>
    </div>
  );
}