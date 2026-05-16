import { useState, useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Loader2, AlertTriangle, ArrowRight } from 'lucide-react';
import api from '../lib/api';

export default function ProtectedRoute({ children }) {
  const { user, loading: authLoading } = useAuth();
  const location = useLocation();
  const [workspaceStatus, setWorkspaceStatus] = useState(null); 
  const [debugError, setDebugError] = useState(''); // NEW: Surface hidden errors

  useEffect(() => {
    let isMounted = true;
    let timeoutId;

    const verifyAccess = async () => {
      if (!user) return;

      // 1. THE FAST BYPASS: If App.jsx or JoinOrg.jsx saved the org, trust it instantly.
      const storedOrgId = localStorage.getItem('current_org_id');
      if (storedOrgId && storedOrgId !== 'undefined' && storedOrgId !== 'null') {
        if (isMounted) setWorkspaceStatus('complete');
        return; 
      }

      // 2. THE DEADLOCK BREAKER: If the API hangs for 5 seconds, kill the spinner.
      timeoutId = setTimeout(() => {
        if (isMounted && !workspaceStatus) {
          setDebugError('Network timeout: Your api.js interceptor is likely deadlocked. Click below to bypass.');
          setWorkspaceStatus('error-override');
        }
      }, 5000);

      try {
        const res = await api.get('/orgs/me');
        if (!isMounted) return;

        const orgData = Array.isArray(res.data) ? res.data[0] : res.data;

        if (orgData?.id || orgData?.org_id) {
          const finalId = orgData.id || orgData.org_id;
          localStorage.setItem('current_org_id', finalId);
          if (orgData.name) localStorage.setItem('current_org_name', orgData.name);
          
          setWorkspaceStatus(orgData.onboarding_completed === false ? 'incomplete' : 'complete');
        } else {
          setWorkspaceStatus('no-org');
        }
      } catch (err) {
        console.error('[Guard Error]:', err);
        if (isMounted) {
          setDebugError(err.message || 'API request failed');
          setWorkspaceStatus('no-org');
        }
      } finally {
        clearTimeout(timeoutId);
      }
    };

    if (!authLoading) {
      verifyAccess();
    }

    return () => { 
      isMounted = false; 
      clearTimeout(timeoutId);
    };
  }, [user, authLoading, workspaceStatus]);

  // STATE 1: LOADING (Will automatically die after 5 seconds now)
  if (authLoading || (user && !workspaceStatus)) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#0A0F1E]">
        <Loader2 className="animate-spin text-[#00C896] mb-4" size={40} />
        <p className="text-sm font-black text-white/50 uppercase tracking-[0.3em] animate-pulse">
          Authenticating Gateway...
        </p>
      </div>
    );
  }

  // STATE 2: THE DEADLOCK OVERRIDE (If Axios hangs)
  if (workspaceStatus === 'error-override') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#0A0F1E] p-4 text-center">
        <AlertTriangle className="text-amber-500 mb-4" size={48} />
        <h2 className="text-white font-black text-2xl mb-2">Gateway Deadlock Detected</h2>
        <p className="text-red-400 font-mono text-sm mb-8 bg-red-400/10 p-4 rounded-lg border border-red-400/20 max-w-lg">
          {debugError}
        </p>
        <button 
          onClick={() => setWorkspaceStatus('complete')}
          className="flex items-center gap-2 bg-[#00C896] text-navy px-6 py-3 rounded-xl font-bold hover:bg-[#00C896]/90 transition-all"
        >
          Force Enter Dashboard <ArrowRight size={18} />
        </button>
      </div>
    );
  }

  // STATE 3: UNAUTHENTICATED
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // STATE 4: NO WORKSPACE / INCOMPLETE
  const isAtSetup = location.pathname === '/setup-workspace';
  if ((workspaceStatus === 'no-org' || workspaceStatus === 'incomplete') && !isAtSetup) {
    return <Navigate to="/setup-workspace" replace />;
  }

  // STATE 5: PREVENT BACK-TRACKING
  if (workspaceStatus === 'complete' && isAtSetup) {
    return <Navigate to="/" replace />;
  }

  // STATE 6: CLEAR TO PASS
  return children;
}