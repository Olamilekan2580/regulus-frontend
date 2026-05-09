import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Building2, ShieldCheck, AlertTriangle } from 'lucide-react';
import api from '../lib/api';

export default function JoinOrg() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');
  
  const [status, setStatus] = useState('processing'); // processing, success, error
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const processInvite = async () => {
      // Basic Validation
      if (!token) {
        setStatus('error');
        setErrorMessage('No invitation token found in the URL.');
        return;
      }

      // Security Check: Is the user actually logged in?
      const authToken = localStorage.getItem('token');
      if (!authToken) {
        // Redirect to login, but save the token so they can come back here after
        sessionStorage.setItem('pending_invite_token', token);
        navigate('/login?redirect=join');
        return;
      }

      // Execute the Join
      try {
        const response = await api.post('/orgs/accept-invite', { token });
        
        // Switch their active workspace to the new organization
        localStorage.setItem('current_org_id', response.data.org_id);
        
        setStatus('success');
        setTimeout(() => {
          navigate('/'); // Send them to the dashboard after a short delay
        }, 2000);

      } catch (err) {
        setStatus('error');
        setErrorMessage(err.response?.data?.error || 'Failed to join the organization.');
      }
    };

    processInvite();
  }, [token, navigate]);

  return (
    <div className="min-h-screen bg-navy flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl text-center">
        
        {status === 'processing' && (
          <div className="space-y-6 animate-pulse">
            <div className="w-16 h-16 bg-accent/20 text-accent rounded-full flex items-center justify-center mx-auto">
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
            <p className="text-gray-500 font-medium">You have successfully joined the workspace. Redirecting to your dashboard...</p>
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
              className="mt-4 px-6 py-2 bg-gray-100 text-gray-600 rounded-lg font-bold hover:bg-gray-200"
            >
              Return to Dashboard
            </button>
          </div>
        )}
        
      </div>
    </div>
  );
}