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

    if (user) {
      api.get('/orgs/me')
        .then(res => {
          if (!isMounted) return;

          // Check if they have an org and have finished setup
          if (res.data?.id && res.data?.onboarding_completed) {
            setWorkspaceStatus('complete');
            
            // CRITICAL: Sync local storage so the rest of the app 
            // doesn't show "Loading..." or "Missing Context"
            localStorage.setItem('current_org_id', res.data.id);
            localStorage.setItem('current_org_name', res.data.name);
          } else if (res.data?.id && !res.data?.onboarding_completed) {
            // User created an org but didn't finish the wizard
            setWorkspaceStatus('incomplete');
            localStorage.setItem('current_org_id', res.data.id);
          } else {
            setWorkspaceStatus('no-org');
          }
        })
        .catch(() => {
          if (isMounted) setWorkspaceStatus('no-org');
        });
    }

    return () => { isMounted = false; };
  }, [user]);

  // 1. SYSTEM LOADING
  if (authLoading || (user && !workspaceStatus)) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-navy">
        <Loader2 className="animate-spin text-accent mb-4" size={40} />
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
  // If they aren't already on the setup page, force them there.
  const isAtSetup = location.pathname === '/setup-workspace';
  if ((workspaceStatus === 'no-org' || workspaceStatus === 'incomplete') && !isAtSetup) {
    console.warn('[Guard] Redirecting to Workspace Setup');
    return <Navigate to="/setup-workspace" replace />;
  }

  // 4. COMPLETE WORKSPACE: Prevent back-tracking to Setup
  if (workspaceStatus === 'complete' && isAtSetup) {
    return <Navigate to="/" replace />;
  }

  // 5. CLEAR TO PASS
  return children;
}