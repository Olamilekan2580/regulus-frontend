import axios from 'axios';
import { supabase } from './supabase'; // Adjust this path if necessary

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL, 
});

api.interceptors.request.use(async (config) => {
  // ENGINE 1: Interrogate Supabase for an active OAuth session
  const { data: { session } } = await supabase.auth.getSession();
  
  // ENGINE 2: Check for custom backend JWT (Email/Password fallback)
  const legacyToken = localStorage.getItem('token');
  
  // WORKSPACE CONTEXT
  const orgId = localStorage.getItem('current_org_id');
  
  // ROUTING LOGIC: Attach the correct authorization header
  if (session?.access_token) {
    config.headers.Authorization = `Bearer ${session.access_token}`;
  } else if (legacyToken) {
    config.headers.Authorization = `Bearer ${legacyToken}`;
  }
  
  // Attach workspace routing header if it exists
  if (orgId) {
    config.headers['x-org-id'] = orgId; 
  }
  
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    // 402 Payment Required: Trigger your custom billing wall event
    if (error.response && error.response.status === 402) {
      window.dispatchEvent(new Event('trigger-billing-wall'));
    }
    
    // 401 Unauthorized: Nuke both engines to prevent ghost sessions
    if (error.response && error.response.status === 401) {
      // Wipe custom backend data
      localStorage.removeItem('token');
      localStorage.removeItem('current_org_id');
      
      // Wipe Supabase session
      await supabase.auth.signOut();
      
      // Prevent redirect looping if already on the login page
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    
    return Promise.reject(error);
  }
);

export default api;