import { useState } from 'react';
import { Copy, CheckCircle2, X, AlertCircle } from 'lucide-react';
import api from '../lib/api';

export default function InviteModal({ orgId, onClose }) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('member');
  const [isSending, setIsSending] = useState(false);
  const [generatedLink, setGeneratedLink] = useState('');
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState(''); // UPGRADE: Inline error state

  const handleInvite = async (e) => {
    e.preventDefault(); // UPGRADE: Prevents page reload on Enter key
    setError('');

    // UPGRADE: Strict email validation before hitting the server
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address.');
      return;
    }

    setIsSending(true);

    try {
      const res = await api.post(`/orgs/${orgId}/invite`, { email, role });
      const inviteUrl = `${window.location.origin}/join?token=${res.data.token}`;
      
      setGeneratedLink(inviteUrl);
      setEmail('');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to generate invite link.');
    } finally {
      setIsSending(false);
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(generatedLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      setError('Failed to copy to clipboard.');
    }
  };

  return (
    <div className="p-8 bg-white rounded-2xl shadow-2xl border border-gray-100 relative max-w-md w-full">
      <button 
        onClick={onClose} 
        className="absolute top-4 right-4 text-gray-400 hover:text-navy transition-colors bg-gray-50 hover:bg-gray-100 p-1.5 rounded-full"
      >
        <X size={18} />
      </button>

      <h3 className="text-xl font-black text-navy mb-2">Invite Collaborator</h3>
      
      {!generatedLink ? (
        <>
          <p className="text-sm text-gray-500 mb-6 font-medium">Generate a secure access token for a new team member.</p>
          
          {/* UPGRADE: Inline Error Rendering */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-xl flex items-center gap-2 text-red-600 text-sm font-bold">
              <AlertCircle size={16} />
              {error}
            </div>
          )}
          
          {/* UPGRADE: Wrapped in a form so the "Enter" key works */}
          <form onSubmit={handleInvite} className="space-y-4">
            <div>
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Email Address</label>
              <input 
                type="email" 
                required
                disabled={isSending}
                placeholder="colleague@agency.com"
                className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:border-[#00C896] transition-colors font-medium text-sm disabled:opacity-50"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (error) setError(''); // Clear error when typing
                }}
              />
            </div>
            
            <div>
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Workspace Role</label>
              <select 
                disabled={isSending}
                className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:border-[#00C896] transition-colors font-bold text-sm text-navy appearance-none cursor-pointer disabled:opacity-50"
                value={role}
                onChange={(e) => setRole(e.target.value)}
              >
                <option value="member">Member (Standard Access)</option>
                <option value="admin">Admin (Can edit branding & team)</option>
              </select>
            </div>
            
            <button 
              type="submit"
              disabled={isSending}
              className="w-full py-3 mt-4 bg-navy text-white rounded-xl font-bold hover:bg-navy/90 hover:shadow-lg hover:shadow-navy/20 transition-all active:scale-95 disabled:opacity-70 flex justify-center items-center h-12"
            >
              {isSending ? (
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white/20 border-t-white"></div>
              ) : (
                'Generate Invite Link'
              )}
            </button>
          </form>
        </>
      ) : (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-300 pt-2">
          <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-4">
            <CheckCircle2 size={24} />
          </div>
          <p className="text-sm text-gray-800 font-bold mb-4">Link generated successfully! Send this URL to your team member.</p>
          
          <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl p-2 mb-4">
            <input 
              type="text" 
              readOnly 
              value={generatedLink} 
              className="w-full bg-transparent outline-none text-xs text-gray-500 px-2 font-mono selection:bg-[#00C896]/20"
            />
            <button 
              onClick={copyToClipboard}
              className={`p-2 rounded-lg transition-colors flex-shrink-0 ${copied ? 'bg-green-100 text-green-700' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-100'}`}
            >
              {copied ? <CheckCircle2 size={16} /> : <Copy size={16} />}
            </button>
          </div>

          <div className="flex gap-2 mt-6">
            <button 
              onClick={() => {
                setGeneratedLink('');
                setError('');
              }}
              className="flex-1 py-3 text-sm text-gray-500 font-bold bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
            >
              New Invite
            </button>
            <button 
              onClick={onClose}
              className="flex-1 py-3 text-sm text-white font-bold bg-navy rounded-xl hover:bg-navy/90 transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}