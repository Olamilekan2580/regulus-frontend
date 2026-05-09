import { createContext, useContext, useEffect, useState } from 'react';
import api from '../lib/api';

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const verifySession = async () => {
      const token = localStorage.getItem('token');
      
      if (!token) {
        setUser(null);
        setLoading(false);
        return;
      }

      try {
        // Ping the backend to verify the token
        await api.get('/orgs/me');
        
        // Token is valid and they have a workspace
        setUser({ token });
      } catch (err) {
        // THE FIX: If the error is 404, they just don't have a workspace yet. 
        // Their token is still perfectly valid! Let them in so ProtectedRoute can send them to /onboarding.
        if (err.response && err.response.status === 404) {
          setUser({ token });
        } else {
          // It's a real error (like 401 Expired), wipe it.
          localStorage.removeItem('token');
          localStorage.removeItem('current_org_id');
          setUser(null);
        }
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