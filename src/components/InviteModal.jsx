import { useState } from 'react';
import { Copy, CheckCircle2, X } from 'lucide-react';
import api from '../lib/api';

export default function InviteModal({ orgId, onClose }) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('member');
  const [isSending, setIsSending] = useState(false);
  const [generatedLink, setGeneratedLink] = useState('');
  const [copied, setCopied] = useState(false);

  const handleInvite = async () => {
    if (!email) return alert('Please enter an email address.');
    setIsSending(true);

    try {
      // 1. Hit the backend and capture the response
      const res = await api.post(`/orgs/${orgId}/invite`, { email, role });
      
      // 2. Construct the absolute URL dynamically based on where the app is hosted
      const inviteUrl = `${window.location.origin}/join?token=${res.data.token}`;
      
      // 3. Update the UI state to show the link
      setGeneratedLink(inviteUrl);
      setEmail('');
      
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to generate invite.');
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
      alert('Failed to copy. Please copy the text manually.');
    }
  };

  return (
    <div className="p-8 bg-white rounded-2xl shadow-2xl border border-gray-100 relative">
      {/* NEW: Close Button for the Modal */}
      <button 
        onClick={onClose} 
        className="absolute top-4 right-4 text-gray-400 hover:text-navy transition-colors"
      >
        <X size={20} />
      </button>

      <h3 className="text-xl font-black text-navy mb-2">Invite Collaborator</h3>
      
      {!generatedLink ? (
        <>
          <p className="text-sm text-gray-500 mb-6 font-medium">Generate a secure access token for a new team member.</p>
          
          <div className="space-y-4">
            <div>
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Email Address</label>
              <input 
                type="email" 
                placeholder="colleague@agency.com"
                className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:border-accent transition-colors font-medium text-sm"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            
            <div>
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Workspace Role</label>
              <select 
                className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:border-accent transition-colors font-bold text-sm text-navy appearance-none cursor-pointer"
                value={role}
                onChange={(e) => setRole(e.target.value)}
              >
                <option value="member">Member (Standard Access)</option>
                <option value="admin">Admin (Can edit branding & team)</option>
              </select>
            </div>
            
            <button 
              onClick={handleInvite}
              disabled={isSending}
              className="w-full py-3 mt-4 bg-navy text-white rounded-xl font-bold hover:shadow-lg hover:shadow-navy/20 transition-all active:scale-95 disabled:opacity-50"
            >
              {isSending ? 'Generating...' : 'Generate Invite Link'}
            </button>
          </div>
        </>
      ) : (
        // SUCCESS STATE UI
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
              className="w-full bg-transparent outline-none text-xs text-gray-500 px-2 font-mono"
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
              onClick={() => setGeneratedLink('')}
              className="flex-1 py-3 text-sm text-gray-500 font-bold bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
            >
              New Invite
            </button>
            {/* NEW: Done button to cleanly exit */}
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