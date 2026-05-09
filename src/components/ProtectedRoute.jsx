import { useState, useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Loader2 } from 'lucide-react';
import api from '../lib/api';

export default function ProtectedRoute({ children }) {
  const { user, loading: authLoading } = useAuth();
  const location = useLocation();
  
  // New state to hold the absolute truth from the backend
  const [workspaceStatus, setWorkspaceStatus] = useState(null); 

  useEffect(() => {
    // Only ping the backend if the user is actually logged in
    if (user) {
      api.get('/orgs/me')
        .then(res => {
          if (res.data?.onboarding_completed) {
            setWorkspaceStatus('complete');
          } else {
            setWorkspaceStatus('incomplete');
          }
        })
        .catch(() => {
          // If no org exists yet (404), they are definitely incomplete
          setWorkspaceStatus('incomplete');
        });
    }
  }, [user]); // Only re-run if the user object changes

  // 1. LOADING: Wait for both Supabase Auth AND our Backend to respond
  if (authLoading || (user && !workspaceStatus)) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
        <Loader2 className="animate-spin text-navy mb-4" size={40} />
        <p className="text-sm font-bold text-gray-400 uppercase tracking-widest animate-pulse">Verifying Access...</p>
      </div>
    );
  }

  // 2. UNAUTHENTICATED: Kick to login
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 3. INCOMPLETE WORKSPACE: Trap them in onboarding
  if (workspaceStatus === 'incomplete' && location.pathname !== '/onboarding') {
    return <Navigate to="/onboarding" replace />;
  }

  // 4. COMPLETE WORKSPACE: Ban them from the onboarding page
  if (workspaceStatus === 'complete' && location.pathname === '/onboarding') {
    return <Navigate to="/" replace />;
  }

  // 5. CLEAR TO PASS
  return children;
}