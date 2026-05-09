import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Loader2 } from 'lucide-react';

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  // 1. AUTH LOADING: Wait for Supabase to confirm the session
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="animate-spin text-navy" size={32} />
      </div>
    );
  }

  // 2. AUTH CHECK: If no user, send to login
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 3. ONBOARDING GATE: 
  // If user is logged in but hasn't finished setup, force them to /onboarding
  // (But don't redirect if they are ALREADY on the onboarding page)
  const hasFinishedOnboarding = user.onboarding_completed; // This flag comes from your DB/AuthContext

  if (!hasFinishedOnboarding && location.pathname !== '/onboarding') {
    return <Navigate to="/onboarding" replace />;
  }

  // 4. PREVENT BACKTRACKING:
  // If they finished onboarding, don't let them go back to the onboarding page
  if (hasFinishedOnboarding && location.pathname === '/onboarding') {
    return <Navigate to="/" replace />;
  }

  return children;
}