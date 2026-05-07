import { createContext, useContext, useEffect, useState } from 'react';
import api from '../lib/api'; // Use your custom backend API setup

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Look directly in the vault where Login.jsx put the token
    const token = localStorage.getItem('token');
    
    if (token) {
      // 2. If token exists, we set a basic user object to pass the Route Guard.
      // Note: If this token is fake or expired, your api.js 401 interceptor 
      // will instantly catch it on the first backend request and kick them out.
      setUser({ token }); 
    } else {
      setUser(null);
    }
    
    setLoading(false);
  }, []);

  // 3. Keep logout functional to wipe the vault
  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    window.location.href = '/login';
  };

  return (
    <AuthContext.Provider value={{ user, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);