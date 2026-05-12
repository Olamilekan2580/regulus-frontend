/**
 * @fileoverview Dual-Engine Global Authentication State Manager
 * @architecture Handles both Supabase OAuth & Legacy Custom JWTs simultaneously
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

    const verifyDualEngineSession = async () => {
      try {
        // ENGINE 1: Check Supabase First (Highest Priority)
        const { data: { session } } = await supabase.auth.getSession();
        
        // ENGINE 2: Fallback to Legacy Custom Token
        const legacyToken = localStorage.getItem('token');

        // If neither engine has a key, lock the door.
        if (!session && !legacyToken) {
          if (isMounted) {
            setUser(null);
            setLoading(false);
          }
          return;
        }

        // Both engines now rely on api.js to attach the correct headers.
        // Ping the backend to verify the token is valid and grab the workspace.
        await api.get('/orgs/me');
        
        // If the ping succeeds, set the user state based on the winning engine
        if (isMounted) {
           setUser(session ? session.user : { token: legacyToken });
        }
      } catch (err) {
        if (isMounted) {
          if (err.response && err.response.status === 404) {
            // 404 Workspace not found - but the auth token itself IS valid. 
            // Let them into the system so ProtectedRoute can send them to setup.
            const { data: { session } } = await supabase.auth.getSession();
            const legacyToken = localStorage.getItem('token');
            setUser(session ? session.user : { token: legacyToken });
          } else {
            // 401/403: Total Authentication Failure. Nuke everything.
            localStorage.removeItem('token');
            localStorage.removeItem('current_org_id');
            await supabase.auth.signOut();
            setUser(null);
          }
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    verifyDualEngineSession();

    // THE LISTENER: Automatically reacts to GitHub OAuth redirects in the background
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_OUT') {
        if (isMounted) {
          setUser(null);
          localStorage.removeItem('token'); 
          localStorage.removeItem('current_org_id');
        }
      } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        if (isMounted && session) {
          setUser(session.user);
        }
      }
    });

    // Cleanup memory leaks
    return () => {
      isMounted = false; 
      authListener.subscription.unsubscribe();
    };
  }, []);

  const logout = async () => {
    // Total system wipe on logout to prevent ghost sessions
    await supabase.auth.signOut();
    localStorage.removeItem('token');
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