/**
 * @fileoverview Global Authentication State Manager (Supabase Native)
 * @architecture Memory-Leak Protected, Event-Driven Session Verification
 */

import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import api from '../lib/api';

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true; 

    const initializeAuth = async () => {
      // 1. Interrogate Supabase for an active session (automatically handles the URL hash)
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error || !session) {
        if (isMounted) {
          setUser(null);
          setLoading(false);
        }
        return;
      }

      // 2. Session exists. Ping the backend to verify workspace context.
      // The new api.js interceptor will automatically attach the session.access_token
      try {
        await api.get('/orgs/me');
        
        if (isMounted) setUser(session.user);
      } catch (err) {
        if (isMounted) {
          // 404 means token is valid, but they haven't finished onboarding. Let them through.
          if (err.response && err.response.status === 404) {
            setUser(session.user);
          } else {
            // Hard 401/403: Token rejected by your backend. Wipe the session.
            localStorage.removeItem('current_org_id');
            await supabase.auth.signOut();
            setUser(null);
          }
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    initializeAuth();

    // 3. The Listener: Automatically reacts to logins, logouts, and token refreshes
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_OUT') {
        if (isMounted) {
          setUser(null);
          localStorage.removeItem('current_org_id');
        }
      } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        if (isMounted && session) {
          setUser(session.user);
        }
      }
    });

    // 4. Cleanup
    return () => {
      isMounted = false; 
      authListener.subscription.unsubscribe();
    };
  }, []);

  const logout = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem('current_org_id');
    setUser(null);
    window.location.href = '/login'; 
  };

  return (
    <AuthContext.Provider value={{ user, setUser, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);