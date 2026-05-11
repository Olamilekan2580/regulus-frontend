/**
 * @fileoverview Global Authentication State Manager
 * @architecture Memory-Leak Protected, Asynchronous Session Verification
 * * CRITICAL FIXES APPLIED (ISSUE #23):
 * - Implemented `isMounted` guard to prevent state updates on unmounted components.
 * - Added a `return () => { isMounted = false }` cleanup function.
 * - Preserved the 404 bypass logic to allow new users to hit the workspace creation flow.
 */

import { createContext, useContext, useEffect, useState } from 'react';
import api from '../lib/api';

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true; // 🔒 CRITICAL FIX: Memory leak protection flag

    const verifySession = async () => {
      const token = localStorage.getItem('token');
      
      if (!token) {
        if (isMounted) {
          setUser(null);
          setLoading(false);
        }
        return;
      }

      try {
        // Ping the backend to verify the token and workspace context
        await api.get('/orgs/me');
        
        // Token is valid and workspace exists
        if (isMounted) {
          setUser({ token });
        }
      } catch (err) {
        if (isMounted) {
          // If the error is 404, they just don't have a workspace yet. 
          // Their token is still perfectly valid. Let them in so ProtectedRoute can send them to onboarding.
          if (err.response && err.response.status === 404) {
            setUser({ token });
          } else {
            // It's a real authentication error (e.g., 401 Expired or 403 Forbidden). Wipe it.
            localStorage.removeItem('token');
            localStorage.removeItem('current_org_id');
            setUser(null);
          }
        }
      } finally {
        // Only stop the loading spinner if the component hasn't been destroyed
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    verifySession();

    // 🔒 CLEANUP FUNCTION: Fires automatically when the component unmounts
    return () => {
      isMounted = false; 
    };
  }, []);

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('current_org_id');
    setUser(null);
    window.location.href = '/login'; // Force a hard reload to clear all React state trees
  };

  return (
    <AuthContext.Provider value={{ user, setUser, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);