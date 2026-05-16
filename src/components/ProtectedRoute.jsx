import { useState, useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Loader2 } from 'lucide-react';
import api from '../lib/api';

export default function ProtectedRoute({ children }) {
  const { user, loading: authLoading } = useAuth();
  const location = useLocation();
  const [workspaceStatus, setWorkspaceStatus] = useState(null); 

  useEffect(() => {
    let isMounted = true;

    const verifyAccess = async () => {
      if (!user) return;

      // ARCHITECT FIX: The Fast-Bypass
      // First check if App.jsx just injected an org_id from the invite system
      const storedOrgId = localStorage.getItem('current_org_id');
      
      if (storedOrgId && storedOrgId !== 'undefined' && storedOrgId !== 'null') {
        // If they have a valid ID, immediately clear them to pass
        if (isMounted) setWorkspaceStatus('complete');
        return; 
      }

      // If no local storage exists, fall back to asking the backend
      try {
        const res = await api.get('/orgs/me');
        if (!isMounted) return;

        // Handle both object and array responses securely
        const orgData = Array.isArray(res.data) ? res.data[0] : res.data;

        if (orgData?.id) {
          localStorage.setItem('current_org_id', orgData.id);
          if (orgData.name) localStorage.setItem('current_org_name', orgData.name);
          
          setWorkspaceStatus(orgData.onboarding_completed ? 'complete' : 'incomplete');
        } else {
          setWorkspaceStatus('no-org');
        }
      } catch (err) {
        console.error('[Guard] Backend verification failed:', err);
        if (isMounted) setWorkspaceStatus('no-org');
      }
    };

    if (!authLoading) {
      verifyAccess();
    }

    return () => { isMounted = false; };
  }, [user, authLoading]);

  // 1. SYSTEM LOADING
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

  // 2. UNAUTHENTICATED: Kick to Login
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 3. NO WORKSPACE / INCOMPLETE: Kick to Setup
  const isAtSetup = location.pathname === '/setup-workspace';
  if ((workspaceStatus === 'no-org' || workspaceStatus === 'incomplete') && !isAtSetup) {
    return <Navigate to="/setup-workspace" replace />;
  }

  // 4. COMPLETE WORKSPACE: Prevent back-tracking to Setup
  if (workspaceStatus === 'complete' && isAtSetup) {
    return <Navigate to="/" replace />;
  }

  // 5. CLEAR TO PASS
  return children;
}