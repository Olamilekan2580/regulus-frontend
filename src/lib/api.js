import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL, 
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  const orgId = localStorage.getItem('current_org_id');
  
  if (token) config.headers.Authorization = `Bearer ${token}`;
  if (orgId) config.headers['x-org-id'] = orgId; 
  
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 402) {
      window.dispatchEvent(new Event('trigger-billing-wall'));
    }
    
    if (error.response && error.response.status === 401) {
      // Clear the stale data
      localStorage.removeItem('token');
      localStorage.removeItem('current_org_id');
      
      // THE FIX: Only trigger a hard redirect if we aren't already on the login page.
      // This stops Axios and Supabase from fighting over the browser's location state.
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    
    return Promise.reject(error);
  }
);

export default api;