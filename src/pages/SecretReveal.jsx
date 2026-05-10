import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { ShieldAlert, Flame, Copy, CheckCircle } from 'lucide-react';
import axios from 'axios';

export default function SecretReveal() {
  const { id } = useParams();
  const [secret, setSecret] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleReveal = async () => {
    setLoading(true);
    try {
      // Calls the PUBLIC endpoint to decrypt and burn
      const res = await axios.post(`${import.meta.env.VITE_API_URL}/public/vault/${id}/reveal`);
      setSecret(res.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Decryption failed or secret no longer exists.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(secret.secret_value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-gray-800 rounded-2xl p-8 text-center border border-gray-700">
          <ShieldAlert className="text-red-500 mx-auto mb-4" size={48} />
          <h1 className="text-xl font-bold text-white mb-2">Access Denied</h1>
          <p className="text-gray-400">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div className="max-w-xl w-full bg-gray-800 rounded-3xl p-8 shadow-2xl border border-gray-700">
        <div className="text-center mb-8">
          <Flame className="text-accent mx-auto mb-4" size={48} />
          <h1 className="text-3xl font-black text-white mb-2">Secure Credential</h1>
          <p className="text-gray-400 font-medium">You have been sent an encrypted payload.</p>
        </div>

        {!secret ? (
          <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-6 text-center">
            <h3 className="text-red-400 font-bold mb-2 uppercase tracking-widest text-sm">Warning</h3>
            <p className="text-red-200/80 text-sm mb-6">
              This message will self-destruct. Once you reveal this secret, it will be permanently deleted from the server. You cannot view it twice.
            </p>
            <button 
              onClick={handleReveal} 
              disabled={loading}
              className="w-full bg-red-500 text-white font-bold py-4 rounded-xl hover:bg-red-600 transition-colors disabled:opacity-50"
            >
              {loading ? 'Decrypting...' : 'Reveal & Destroy'}
            </button>
          </div>
        ) : (
          <div className="space-y-6 animate-in fade-in zoom-in-95 duration-500">
            <div>
              <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-2">Secret Name</label>
              <div className="text-white font-bold text-lg">{secret.secret_name}</div>
            </div>

            <div>
              <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-2">Payload (Copy immediately)</label>
              <div className="relative">
                <textarea 
                  readOnly 
                  rows="6" 
                  className="w-full bg-gray-950 text-green-400 font-mono p-4 rounded-xl border border-gray-700 outline-none"
                  value={secret.secret_value}
                />
                <button 
                  onClick={handleCopy}
                  className="absolute top-3 right-3 bg-gray-800 hover:bg-gray-700 text-white p-2 rounded-lg transition-colors border border-gray-600"
                >
                  {copied ? <CheckCircle size={18} className="text-green-400"/> : <Copy size={18} />}
                </button>
              </div>
            </div>

            <div className="bg-gray-900/50 text-gray-400 text-xs font-bold text-center py-3 rounded-lg border border-gray-800">
              This secret has been wiped from the server.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}