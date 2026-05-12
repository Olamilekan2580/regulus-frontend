import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, ArrowRight, Building2 } from 'lucide-react';
import api from '../lib/api';
import { supabase } from '../lib/supabase'; // Make sure this path is correct

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [githubLoading, setGithubLoading] = useState(false);
  const navigate = useNavigate();

  // ==========================================
  // GITHUB OAUTH (NEW)
  // ==========================================
  const handleGithubLogin = async () => {
    setGithubLoading(true);
    setError('');
    
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'github',
        options: {
          // Point this to whatever page handles your post-login routing
          redirectTo: `${window.location.origin}/`
        }
      });

      if (error) throw error;
      // Note: No code runs after this line because the browser redirects to GitHub.
    } catch (err) {
      setError(err.message || 'Failed to initialize GitHub login.');
      setGithubLoading(false);
    }
  };

  // ==========================================
  // CUSTOM EMAIL LOGIC (EXISTING)
  // ==========================================
  const handleEmailLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      const res = await api.post('/auth/login', { email, password });
      localStorage.setItem('token', res.data.token);

      try {
        const orgRes = await api.get('/orgs/me');
        if (orgRes.data) {
          localStorage.setItem('current_org_id', orgRes.data.id);
          localStorage.setItem('current_org_name', orgRes.data.name);
          
          if (orgRes.data.brand_settings) {
            const root = document.documentElement;
            if (orgRes.data.brand_settings.primary) root.style.setProperty('--theme-navy', orgRes.data.brand_settings.primary);
            if (orgRes.data.brand_settings.accent) root.style.setProperty('--theme-accent', orgRes.data.brand_settings.accent);
          }
        }
      } catch (orgErr) {
        console.warn('User has no active workspace yet.');
      }

      const pendingToken = sessionStorage.getItem('pending_invite_token');
      if (pendingToken) {
        sessionStorage.removeItem('pending_invite_token');
        navigate(`/join?token=${pendingToken}`);
        return;
      }

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
          <h1 className="text-3xl font-black text-navy mb-2">System Access</h1>
          <p className="text-gray-500 font-medium">Authenticate to enter Regulus.</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 text-red-600 text-sm font-bold rounded-xl border border-red-100 text-center">
            {error}
          </div>
        )}

        {/* PRIMARY AUTH: GITHUB */}
        <button
          onClick={handleGithubLogin}
          disabled={githubLoading || loading}
          className="w-full flex justify-center items-center py-3.5 px-4 rounded-xl shadow-sm text-base font-bold text-white bg-[#24292F] hover:bg-[#1b1f23] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#24292F] transition-all disabled:opacity-70"
        >
          {githubLoading ? 'Connecting...' : (
            <>
              <svg className="w-5 h-5 mr-3" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
              </svg>
              Continue with GitHub
            </>
          )}
        </button>

        {/* DIVIDER */}
        <div className="mt-8 mb-6 relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-200" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-4 bg-white text-gray-400 font-bold text-[10px] uppercase tracking-widest">
              Or use workspace email
            </span>
          </div>
        </div>

        {/* SECONDARY AUTH: EMAIL */}
        <form onSubmit={handleEmailLogin} className="space-y-4">
          <div>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input 
                type="email" 
                required 
                className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-accent outline-none font-medium transition-all text-sm" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                placeholder="architect@agency.com"
              />
            </div>
          </div>
          
          <div>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input 
                type="password" 
                required 
                className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-accent outline-none font-medium transition-all text-sm" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                placeholder="••••••••"
              />
            </div>
          </div>

          <button 
            disabled={loading || githubLoading} 
            type="submit" 
            className="w-full flex items-center justify-center gap-2 bg-navy text-white py-3.5 rounded-xl font-bold hover:shadow-lg hover:shadow-navy/20 transition-all mt-2 disabled:opacity-70 active:scale-95"
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