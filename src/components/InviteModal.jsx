import { useState } from 'react';
import api from '../lib/api';

export default function InviteModal({ orgId }) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('member');
  const [isSending, setIsSending] = useState(false);

  const handleInvite = async () => {
    if (!email) return alert('Please enter an email address.');
    setIsSending(true);

    try {
      // Hit your Node.js backend to generate the token
      await api.post(`/orgs/${orgId}/invite`, { email, role });
      alert('Invite link generated! Check your backend console for the token.');
      setEmail('');
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to generate invite.');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="p-8 bg-white rounded-2xl shadow-2xl border border-gray-100">
      <h3 className="text-xl font-black text-navy mb-2">Invite Collaborator</h3>
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
    </div>
  );
}