import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children }) {
  // 1. Grab the loading state alongside the user
  const { user, loading } = useAuth();
  
  // 2. If AuthContext is still checking the token, WAIT. Do not redirect.
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-navy"></div>
      </div>
    );
  }
  
  // 3. Only kick them out if loading is fully complete AND there is no user
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  return children;
}