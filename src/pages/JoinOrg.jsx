import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Building2, ShieldCheck, AlertTriangle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import api from '../lib/api';

export default function JoinOrg() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');
  
  const [status, setStatus] = useState('processing'); // processing, success, error
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const processInvite = async () => {
      // 1. Basic Validation
      if (!token) {
        setStatus('error');
        setErrorMessage('No invitation token found in the URL.');
        return;
      }

      try {
        // 2. Security Check: Use Supabase to verify true cryptographic session
        const { data: { session } } = await supabase.auth.getSession();

        if (!session) {
          // 3. Unauthenticated: Save token and force them to sign up
          sessionStorage.setItem('pending_invite_token', token);
          navigate('/signup?mode=invite');
          return;
        }

        // 4. Authenticated: Execute the Join
        const response = await api.post('/orgs/accept-invite', { token });
        
        // 5. Switch their active workspace to the new organization
        localStorage.setItem('current_org_id', response.data.org_id);
        
        setStatus('success');
        
        // 6. Hard Reload: Purges React state and forces fresh database fetch for new org
        setTimeout(() => {
          window.location.href = '/'; 
        }, 2000);

      } catch (err) {
        setStatus('error');
        setErrorMessage(err.response?.data?.error || 'Failed to join the organization. The token may be expired.');
      }
    };

    processInvite();
  }, [token, navigate]);

  return (
    <div className="min-h-screen bg-[#0A0F1E] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl text-center">
        
        {status === 'processing' && (
          <div className="space-y-6 animate-pulse">
            <div className="w-16 h-16 bg-[#00C896]/20 text-[#00C896] rounded-full flex items-center justify-center mx-auto">
              <Building2 size={32} />
            </div>
            <h2 className="text-2xl font-black text-navy">Securing Access...</h2>
            <p className="text-gray-500 font-medium">Validating your cryptographic token.</p>
          </div>
        )}

        {status === 'success' && (
          <div className="space-y-6">
            <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto">
              <ShieldCheck size={32} />
            </div>
            <h2 className="text-2xl font-black text-navy">Access Granted</h2>
            <p className="text-gray-500 font-medium">You have successfully joined the workspace. Rerouting your connection...</p>
          </div>
        )}

        {status === 'error' && (
          <div className="space-y-6">
            <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto">
              <AlertTriangle size={32} />
            </div>
            <h2 className="text-2xl font-black text-navy">Access Denied</h2>
            <p className="text-red-500 font-bold">{errorMessage}</p>
            <button 
              onClick={() => navigate('/')}
              className="mt-4 px-6 py-2 bg-gray-100 text-gray-600 rounded-lg font-bold hover:bg-gray-200 transition-colors"
            >
              Return to Dashboard
            </button>
          </div>
        )}
        
      </div>
    </div>
  );
}