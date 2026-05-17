import { useState, useEffect } from 'react';
import api from '../lib/api'; // Your newly hardened Axios interceptor

export default function VerificationWall({ isVerified, email }) {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Auto-trigger the email the second they hit the wall
  useEffect(() => {
    if (!isVerified) {
      api.post('/api/verification/send').catch(err => console.error(err));
    }
  }, [isVerified]);

  if (isVerified) return null; // The curtain lifts if verified

  const handleVerify = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await api.post('/api/verification/confirm', { code });
      window.location.reload(); // Hard reload to fetch new verified profile state
    } catch (err) {
      setError(err.response?.data?.error || 'Invalid code.');
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-slate-900/90 backdrop-blur-md flex items-center justify-center">
      <div className="bg-slate-800 p-8 rounded-xl shadow-2xl max-w-md w-full border border-slate-700">
        <h2 className="text-2xl font-bold text-white mb-2">Verify Your Workspace</h2>
        <p className="text-slate-400 mb-6">
          For security, we've sent a 6-digit code to <span className="text-white font-medium">{email}</span>. You must verify this email to unlock your dashboard.
        </p>

        <form onSubmit={handleVerify}>
          <input
            type="text"
            maxLength="6"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 rounded-lg p-4 text-center text-2xl tracking-[0.5em] text-white focus:border-emerald-500 outline-none mb-4"
            placeholder="000000"
            required
          />
          
          {error && <p className="text-red-400 text-sm mb-4">{error}</p>}

          <button
            type="submit"
            disabled={loading || code.length < 6}
            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 px-4 rounded-lg transition-colors disabled:opacity-50"
          >
            {loading ? 'Verifying...' : 'Unlock Dashboard'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button 
            onClick={() => api.post('/api/verification/send')}
            className="text-sm text-slate-400 hover:text-white transition-colors"
          >
            Didn't receive the code? Resend
          </button>
        </div>
      </div>
    </div>
  );
}