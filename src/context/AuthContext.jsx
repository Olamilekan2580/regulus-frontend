import { createContext, useContext, useEffect, useState } from 'react';
import api from '../lib/api';

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const verifySession = async () => {
      const token = localStorage.getItem('token');
      
      // 1. No token? Stop here.
      if (!token) {
        setUser(null);
        setLoading(false);
        return;
      }

      // 2. Token exists? Don't blind-trust it. Verify it.
      try {
        // We ping your backend. If the token is expired, this throws a 401.
        // The api.js interceptor will catch it, wipe the vault, and gracefully redirect.
        await api.get('/orgs/me');
        
        // If we get here, the token is 100% valid.
        setUser({ token });
      } catch (err) {
        // Token is dead or backend rejected it. Wipe it out.
        localStorage.removeItem('token');
        localStorage.removeItem('current_org_id');
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    verifySession();
  }, []);

  const logout = () => {
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