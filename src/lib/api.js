import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL + '/api', // ensure this matches your server.js setup
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  const orgId = localStorage.getItem('current_org_id');
  
  if (token) config.headers.Authorization = `Bearer ${token}`;
  if (orgId) config.headers['x-org-id'] = orgId; // Injects context for billingGuard
  
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    // 402 Payment Required -> Trigger the Wall
    if (error.response && error.response.status === 402) {
      window.dispatchEvent(new Event('trigger-billing-wall'));
    }
    
    // 401 Unauthorized -> Boot them out
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('current_org_id');
      window.location.href = '/login';
    }
    
    return Promise.reject(error);
  }
);

export default api;