/**
 * @fileoverview Identity & Security Management Interface
 * @architecture Segregated State, Multipart Form Uploads, Optimistic UI
 */

import { useState, useEffect } from 'react';
import { User, Mail, Lock, Camera, ShieldCheck, Save, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import api from '../lib/api';

export default function Profile() {
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [statusMsg, setStatusMsg] = useState({ type: '', text: '' });
  
  const [profile, setProfile] = useState({
    first_name: '',
    last_name: '',
    email: '',
    avatar_url: ''
  });

  const [security, setSecurity] = useState({
    current_password: '',
    new_password: '',
    confirm_password: ''
  });

  // 1. Initial Hydration
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await api.get('/users/me');
        setProfile({
          first_name: res.data.first_name || '',
          last_name: res.data.last_name || '',
          email: res.data.email || '',
          avatar_url: res.data.avatar_url || ''
        });
      } catch (err) {
        console.error('[Profile Hydration Error]:', err.message);
        setStatusMsg({ type: 'error', text: 'Failed to synchronize identity context.' });
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  // 2. Avatar Upload Pipeline (Multipart)
  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      return setStatusMsg({ type: 'error', text: 'Avatar image must be under 5MB.' });
    }

    const formData = new FormData();
    formData.append('avatar', file);

    try {
      setStatusMsg({ type: 'info', text: 'Uploading avatar to secure storage...' });
      const res = await api.post('/users/me/avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      // Optimistic UI update
      if (res.data.url) {
        setProfile(prev => ({ ...prev, avatar_url: res.data.url }));
      }
      setStatusMsg({ type: 'success', text: 'Avatar synchronized successfully.' });
    } catch (err) {
      setStatusMsg({ type: 'error', text: 'Failed to upload avatar payload.' });
    }
  };

  // 3. Identity & Security Update Pipeline
  const handleSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setStatusMsg({ type: '', text: '' });

    if (security.new_password && security.new_password !== security.confirm_password) {
      setIsSaving(false);
      return setStatusMsg({ type: 'error', text: 'Cryptographic mismatch: Passwords do not align.' });
    }

    try {
      const payload = {
        first_name: profile.first_name,
        last_name: profile.last_name
      };

      if (security.new_password) {
        payload.current_password = security.current_password;
        payload.new_password = security.new_password;
      }

      await api.put('/users/me', payload);
      
      // Clear security fields on success
      setSecurity({ current_password: '', new_password: '', confirm_password: '' });
      setStatusMsg({ type: 'success', text: 'Identity and security protocols updated.' });
      
      // Clear success message after 3 seconds
      setTimeout(() => setStatusMsg({ type: '', text: '' }), 3000);
    } catch (err) {
      setStatusMsg({ 
        type: 'error', 
        text: err.response?.data?.error || 'Database rejected profile mutation.' 
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12 text-gray-400">
        <Loader2 className="animate-spin mr-3" size={24} />
        Verifying Identity Context...
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      <div>
        <h1 className="text-3xl font-black text-navy">Identity & Security</h1>
        <p className="text-gray-500 font-medium mt-1">Manage your personal profile and authentication credentials.</p>
      </div>

      {statusMsg.text && (
        <div className={`p-4 rounded-xl flex items-center gap-3 text-sm font-bold animate-in slide-in-from-top-2 ${
          statusMsg.type === 'error' ? 'bg-red-50 text-red-600 border border-red-100' :
          statusMsg.type === 'success' ? 'bg-green-50 text-green-600 border border-green-100' :
          'bg-blue-50 text-blue-600 border border-blue-100'
        }`}>
          {statusMsg.type === 'error' ? <AlertCircle size={18} /> : <CheckCircle2 size={18} />}
          {statusMsg.text}
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        
        {/* Personal Details Card */}
        <section className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3 mb-8 pb-6 border-b border-gray-50">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><User size={20} /></div>
            <h2 className="text-xl font-bold text-navy">Personal Details</h2>
          </div>

          <div className="flex flex-col md:flex-row gap-8">
            <div className="flex flex-col items-center space-y-3">
              <div className="relative group">
                <div className="w-24 h-24 rounded-full bg-gray-100 border-4 border-white shadow-lg overflow-hidden flex items-center justify-center">
                  {profile.avatar_url ? (
                    <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-2xl font-black text-gray-300">
                      {profile.first_name?.charAt(0)}{profile.last_name?.charAt(0)}
                    </span>
                  )}
                </div>
                <label className="absolute bottom-0 right-0 p-2 bg-navy text-white rounded-full shadow-lg cursor-pointer hover:bg-accent transition-colors">
                  <Camera size={14} />
                  <input type="file" className="hidden" accept="image/jpeg, image/png, image/webp" onChange={handleAvatarChange} />
                </label>
              </div>
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">JPG, PNG (Max 5MB)</span>
            </div>

            <div className="flex-1 grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">First Name</label>
                <input 
                  type="text" 
                  value={profile.first_name} 
                  onChange={e => setProfile({...profile, first_name: e.target.value})}
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl font-medium text-navy outline-none focus:border-accent focus:ring-2 focus:ring-accent/10 transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Last Name</label>
                <input 
                  type="text" 
                  value={profile.last_name} 
                  onChange={e => setProfile({...profile, last_name: e.target.value})}
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl font-medium text-navy outline-none focus:border-accent focus:ring-2 focus:ring-accent/10 transition-all"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                  <Mail size={12} /> Email Address (Immutable)
                </label>
                <input 
                  type="email" 
                  value={profile.email} 
                  disabled
                  className="w-full p-3 bg-gray-100 border border-gray-200 rounded-xl font-mono text-sm text-gray-500 cursor-not-allowed"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Security Card */}
        <section className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3 mb-8 pb-6 border-b border-gray-50">
            <div className="p-2 bg-red-50 text-red-600 rounded-lg"><ShieldCheck size={20} /></div>
            <div>
              <h2 className="text-xl font-bold text-navy">Authentication Security</h2>
              <p className="text-xs text-gray-500 font-medium mt-1">Leave blank to maintain current cryptographic keys.</p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                <Lock size={12} /> Current Password
              </label>
              <input 
                type="password" 
                value={security.current_password}
                onChange={e => setSecurity({...security, current_password: e.target.value})}
                placeholder="••••••••••••"
                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl font-mono text-sm outline-none focus:border-red-400 focus:ring-2 focus:ring-red-400/10 transition-all"
              />
            </div>
            <div>
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">New Password</label>
              <input 
                type="password" 
                value={security.new_password}
                onChange={e => setSecurity({...security, new_password: e.target.value})}
                placeholder="••••••••••••"
                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl font-mono text-sm outline-none focus:border-red-400 focus:ring-2 focus:ring-red-400/10 transition-all"
              />
            </div>
            <div>
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Confirm Protocol</label>
              <input 
                type="password" 
                value={security.confirm_password}
                onChange={e => setSecurity({...security, confirm_password: e.target.value})}
                placeholder="••••••••••••"
                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl font-mono text-sm outline-none focus:border-red-400 focus:ring-2 focus:ring-red-400/10 transition-all"
              />
            </div>
          </div>
        </section>

        <div className="flex justify-end pt-4">
          <button 
            type="submit" 
            disabled={isSaving}
            className="flex items-center gap-2 bg-navy text-white px-8 py-3 rounded-xl font-black text-sm uppercase tracking-widest shadow-lg hover:shadow-navy/20 hover:bg-navy/90 transition-all active:scale-95 disabled:opacity-50"
          >
            {isSaving ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
            {isSaving ? 'Synchronizing...' : 'Save Configuration'}
          </button>
        </div>

      </form>
    </div>
  );
}