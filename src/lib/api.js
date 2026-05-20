import axios from 'axios';
import { supabase } from './supabase';

const api = axios.create({
  // ARCHITECT FIX: Hardcode the correct production domain with the /api prefix.
  // If VITE_API_URL is missing, it will default to your AWS server.
  baseURL: import.meta.env.VITE_API_URL || 'https://api.regulus.com.ng/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

// ==========================================
// THE REQUEST INTERCEPTOR (The Pipeline)
// ==========================================
api.interceptors.request.use(async (config) => {
  // ARCHITECT FIX 2: The try/catch block.
  // This guarantees that if the token check fails, it cleanly breaks the deadlock.
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
      console.warn('[Supabase Session Warning]:', error.message);
    }
    
    const legacyToken = localStorage.getItem('token');
    const orgId = localStorage.getItem('current_org_id');
    
    // ROUTING LOGIC: Attach the correct authorization header
    if (session?.access_token) {
      config.headers.Authorization = `Bearer ${session.access_token}`;
    } else if (legacyToken) {
      config.headers.Authorization = `Bearer ${legacyToken}`;
    }
    
    // Attach workspace routing header if it exists
    if (orgId && orgId !== 'undefined' && orgId !== 'null') {
      config.headers['x-org-id'] = orgId; 
    }
    
    // CRITICAL: Send the request on its way
    return config;

  } catch (err) {
    console.error('[Axios Request Interceptor Crash]:', err);
    // Rejecting the promise forces the React components to stop spinning and show an error
    return Promise.reject(err);
  }
});

// ==========================================
// THE RESPONSE INTERCEPTOR (The Tripwire)
// ==========================================
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    // 402 Payment Required: Trigger billing wall
    if (error.response && error.response.status === 402) {
      window.dispatchEvent(new Event('trigger-billing-wall'));
    }
    
    // ARCHITECT FIX 3: Removed the forceful window.location.href = '/login'.
    // Your public pages (like /public/intake) will now load correctly even if the user isn't logged in.
    if (error.response && error.response.status === 401) {
      console.warn('[Network 401]: Unauthorized or Expired Session');
      
      // We only clear storage; we let the React Router handle the redirection securely.
      localStorage.removeItem('token');
      localStorage.removeItem('current_org_id');
      await supabase.auth.signOut();
    }
    
    return Promise.reject(error);
  }
);

export default api;