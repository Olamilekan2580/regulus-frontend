/**
 * @fileoverview Secure Payload Reveal Interface (Burn-After-Reading)
 * @architecture Centralized API Routing, Memory-Safe Copy
 * * CRITICAL FIXES APPLIED:
 * - Solves Issue #25: Removed manual `VITE_API_URL` string concatenation.
 * - Centralization: Routes the public decryption request through the standardized `api` interceptor.
 */

import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { ShieldAlert, Flame, Copy, CheckCircle } from 'lucide-react';
import api from '../lib/api'; // 🔒 THE FIX: Centralized Interceptor replaces raw axios

export default function SecretReveal() {
  const { id } = useParams();
  const [secret, setSecret] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleReveal = async () => {
    setLoading(true);
    try {
      // 🔒 Calls the PUBLIC endpoint via the configured base URL instance
      const res = await api.post(`/public/vault/${id}/reveal`);
      setSecret(res.data);
    } catch (err) {
      console.error('[Vault Reveal Error]:', err.message);
      setError(err.response?.data?.error || 'Decryption failed or the secret has already been destroyed.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!secret?.secret_value) return;
    
    navigator.clipboard.writeText(secret.secret_value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-gray-800 rounded-2xl p-8 text-center border border-gray-700 shadow-2xl animate-in zoom-in-95 duration-300">
          <ShieldAlert className="text-red-500 mx-auto mb-4" size={48} />
          <h1 className="text-xl font-bold text-white mb-2">Access Denied</h1>
          <p className="text-gray-400 font-medium">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div className="max-w-xl w-full bg-gray-800 rounded-3xl p-8 shadow-2xl border border-gray-700 transition-all duration-300">
        <div className="text-center mb-8">
          <Flame className="text-accent mx-auto mb-4" size={48} />
          <h1 className="text-3xl font-black text-white mb-2">Secure Credential</h1>
          <p className="text-gray-400 font-medium">You have been sent an encrypted payload.</p>
        </div>

        {!secret ? (
          <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-6 text-center animate-in fade-in duration-500">
            <h3 className="text-red-400 font-bold mb-2 uppercase tracking-widest text-sm">Critical Warning</h3>
            <p className="text-red-200/80 text-sm mb-6 leading-relaxed">
              This message will self-destruct. Once you reveal this secret, it will be permanently deleted from the vault infrastructure. You cannot view it twice.
            </p>
            <button 
              onClick={handleReveal} 
              disabled={loading}
              className="w-full bg-red-500 text-white font-bold py-4 rounded-xl hover:bg-red-600 transition-all shadow-lg hover:shadow-red-500/20 active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Decrypting Payload...
                </>
              ) : 'Reveal & Destroy'}
            </button>
          </div>
        ) : (
          <div className="space-y-6 animate-in fade-in zoom-in-95 duration-500">
            <div>
              <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Secret Alias</label>
              <div className="text-white font-bold text-lg bg-gray-900/50 p-4 rounded-xl border border-gray-700/50">
                {secret.secret_name}
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Decrypted Payload (Copy Immediately)</label>
              <div className="relative group">
                <textarea 
                  readOnly 
                  rows="6" 
                  className="w-full bg-gray-950 text-green-400 font-mono p-4 rounded-xl border border-gray-700 outline-none focus:border-gray-600 transition-colors resize-none"
                  value={secret.secret_value}
                />
                <button 
                  onClick={handleCopy}
                  className="absolute top-3 right-3 bg-gray-800 hover:bg-gray-700 text-white p-2.5 rounded-lg transition-all border border-gray-600 shadow-sm active:scale-90"
                  title="Copy to clipboard"
                >
                  {copied ? <CheckCircle size={18} className="text-green-400"/> : <Copy size={18} />}
                </button>
              </div>
            </div>

            <div className="bg-green-500/10 text-green-400/80 text-xs font-bold text-center py-4 rounded-xl border border-green-500/20 uppercase tracking-widest">
              Payload successfully wiped from server
            </div>
          </div>
        )}
      </div>
    </div>
  );
}