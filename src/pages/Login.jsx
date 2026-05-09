import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, ArrowRight, Building2 } from 'lucide-react';
import api from '../lib/api';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      // 1. Authenticate and grab the JWT
      const res = await api.post('/auth/login', { email, password });
      localStorage.setItem('token', res.data.token);

      // 2. Fetch the User's Active Workspace Context
      try {
        const orgRes = await api.get('/orgs/me');
        if (orgRes.data) {
          localStorage.setItem('current_org_id', orgRes.data.id);
          localStorage.setItem('current_org_name', orgRes.data.name);
          
          // Inject the custom theme instantly so the dashboard doesn't flash the default colors
          if (orgRes.data.brand_settings) {
            const root = document.documentElement;
            if (orgRes.data.brand_settings.primary) root.style.setProperty('--theme-navy', orgRes.data.brand_settings.primary);
            if (orgRes.data.brand_settings.accent) root.style.setProperty('--theme-accent', orgRes.data.brand_settings.accent);
          }
        }
      } catch (orgErr) {
        console.warn('User has no active workspace yet.');
        // If they have no workspace, they either need to create one or accept an invite
      }

      // 3. The Invite Bridge: Did they get sent here from an invite link?
      const pendingToken = sessionStorage.getItem('pending_invite_token');
      if (pendingToken) {
        sessionStorage.removeItem('pending_invite_token'); // Clean up memory
        navigate(`/join?token=${pendingToken}`);
        return;
      }

      // 4. Launch the Dashboard
      window.location.href = '/'; 
      
    } catch (err) {
      setError(err.response?.data?.error || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-navy flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl p-10">
        
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-accent/20 text-accent rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-inner">
            <Building2 size={32} />
          </div>
          <h1 className="text-3xl font-black text-navy mb-2">Welcome Back</h1>
          <p className="text-gray-500 font-medium">Sign in to manage your workspace.</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 text-red-600 text-sm font-bold rounded-xl border border-red-100 text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input 
                type="email" 
                required 
                className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-accent outline-none font-medium transition-all" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                placeholder="architect@agency.com"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Password</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input 
                type="password" 
                required 
                className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-accent outline-none font-medium transition-all" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                placeholder="••••••••"
              />
            </div>
          </div>

          <button 
            disabled={loading} 
            type="submit" 
            className="w-full flex items-center justify-center gap-2 bg-navy text-white py-3.5 rounded-xl font-bold hover:shadow-lg hover:shadow-navy/20 transition-all mt-4 disabled:opacity-70 active:scale-95"
          >
            {loading ? 'Authenticating...' : 'Secure Login'} <ArrowRight size={18} />
          </button>
        </form>

        <div className="mt-8 text-center text-sm text-gray-500 font-medium">
          Don't have a workspace?{' '}
          <Link to="/signup" className="text-accent font-bold hover:text-navy transition-colors">
            Create an account
          </Link>
        </div>
      </div>
    </div>
  );
}