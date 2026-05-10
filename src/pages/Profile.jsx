import { useState, useEffect, useRef } from 'react';
import { User, Mail, Lock, Camera, Save, CheckCircle2, AlertCircle } from 'lucide-react';
import api from '../lib/api';

export default function Profile() {
  const fileInputRef = useRef(null);
  
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    current_password: '',
    new_password: '',
    confirm_password: ''
  });
  
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [avatarFile, setAvatarFile] = useState(null);
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    // Fetch the current user's personal context
    api.get('/users/me').then(res => {
      if (res.data) {
        setFormData(prev => ({
          ...prev,
          first_name: res.data.first_name || '',
          last_name: res.data.last_name || '',
          email: res.data.email || ''
        }));
        if (res.data.avatar_url) {
          setAvatarPreview(res.data.avatar_url);
        }
      }
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleAvatarSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setMessage({ type: 'error', text: 'Image must be less than 5MB.' });
        return;
      }
      // Create a local preview URL instantly
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result);
      };
      reader.readAsDataURL(file);
      setAvatarFile(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Password Validation
    if (formData.new_password && formData.new_password !== formData.confirm_password) {
      setMessage({ type: 'error', text: 'New passwords do not match.' });
      return;
    }

    setSaving(true);
    setMessage({ type: '', text: '' });

    try {
      // 1. Handle Avatar Upload (Multipart Form Data)
      if (avatarFile) {
        const uploadData = new FormData();
        uploadData.append('avatar', avatarFile);
        await api.post('/users/me/avatar', uploadData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      }

      // 2. Handle Profile & Security Update (JSON Payload)
      const payload = {
        first_name: formData.first_name,
        last_name: formData.last_name,
        email: formData.email
      };
      
      // Only append security payload if user is trying to change password
      if (formData.current_password && formData.new_password) {
        payload.current_password = formData.current_password;
        payload.new_password = formData.new_password;
      }

      await api.put('/users/me', payload);

      // Clear password fields on success
      setFormData(prev => ({
        ...prev,
        current_password: '',
        new_password: '',
        confirm_password: ''
      }));

      setMessage({ type: 'success', text: 'Personal profile updated successfully.' });
      setTimeout(() => setMessage({ type: '', text: '' }), 4000);
      
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.error || 'Failed to update profile.' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center p-12 text-gray-400">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-navy mr-3"></div>
      Loading personal details...
    </div>
  );

  return (
    <div className="max-w-4xl space-y-8 pb-12">
      <div>
        <h1 className="text-2xl font-bold text-navy tracking-tight">Personal Profile</h1>
        <p className="text-sm text-gray-500 mt-1 font-medium">Manage your personal identity, avatar, and security credentials.</p>
      </div>

      {message.text && (
        <div className={`p-4 rounded-xl font-medium text-sm flex items-center gap-2 animate-in fade-in slide-in-from-top-2 ${message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
          {message.type === 'success' ? <CheckCircle2 size={16} className="text-green-600" /> : <AlertCircle size={16} className="text-red-600" />}
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        
        {/* AVATAR & IDENTITY SECTION */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <h2 className="text-lg font-bold text-navy mb-6 flex items-center gap-2">
            <User size={20} className="text-gray-400" /> Identity
          </h2>
          
          <div className="flex flex-col md:flex-row gap-8 mb-8">
            {/* Avatar Uploader */}
            <div className="flex flex-col items-center gap-3">
              <div 
                className="relative w-32 h-32 rounded-full border-4 border-gray-50 bg-gray-100 shadow-sm flex items-center justify-center overflow-hidden group cursor-pointer"
                onClick={() => fileInputRef.current?.click()}
              >
                {avatarPreview ? (
                  <img src={avatarPreview} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-4xl font-black text-gray-300">
                    {formData.first_name ? formData.first_name.charAt(0).toUpperCase() : 'U'}
                  </span>
                )}
                
                {/* Hover Overlay */}
                <div className="absolute inset-0 bg-navy/50 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <Camera size={24} className="text-white mb-1" />
                  <span className="text-[10px] font-bold text-white uppercase tracking-widest">Change</span>
                </div>
              </div>
              
              <input 
                type="file" 
                ref={fileInputRef}
                onChange={handleAvatarSelect}
                accept="image/jpeg, image/png, image/webp"
                className="hidden"
              />
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">JPG, PNG (Max 5MB)</p>
            </div>

            {/* Name Fields */}
            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">First Name</label>
                <input type="text" name="first_name" className="w-full bg-gray-50 border border-gray-200 p-3 rounded-xl focus:bg-white focus:ring-2 focus:ring-navy/20 focus:border-navy outline-none transition-all text-sm font-medium" value={formData.first_name} onChange={handleInputChange} placeholder="Akeem" required />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Last Name</label>
                <input type="text" name="last_name" className="w-full bg-gray-50 border border-gray-200 p-3 rounded-xl focus:bg-white focus:ring-2 focus:ring-navy/20 focus:border-navy outline-none transition-all text-sm font-medium" value={formData.last_name} onChange={handleInputChange} placeholder="Omole" required />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Email Address</label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input type="email" name="email" className="w-full bg-gray-50 border border-gray-200 p-3 pl-10 rounded-xl focus:bg-white focus:ring-2 focus:ring-navy/20 focus:border-navy outline-none transition-all text-sm font-medium" value={formData.email} onChange={handleInputChange} required />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* SECURITY SECTION */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <h2 className="text-lg font-bold text-navy mb-6 flex items-center gap-2">
            <Lock size={20} className="text-gray-400" /> Password & Security
          </h2>
          
          <div className="space-y-6">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Current Password</label>
              <input type="password" name="current_password" className="w-full max-w-md bg-gray-50 border border-gray-200 p-3 rounded-xl focus:bg-white focus:ring-2 focus:ring-navy/20 focus:border-navy outline-none transition-all text-sm" value={formData.current_password} onChange={handleInputChange} placeholder="Required to set a new password" />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">New Password</label>
                <input type="password" name="new_password" className="w-full bg-gray-50 border border-gray-200 p-3 rounded-xl focus:bg-white focus:ring-2 focus:ring-navy/20 focus:border-navy outline-none transition-all text-sm" value={formData.new_password} onChange={handleInputChange} placeholder="Leave blank to keep current" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Confirm New Password</label>
                <input type="password" name="confirm_password" className="w-full bg-gray-50 border border-gray-200 p-3 rounded-xl focus:bg-white focus:ring-2 focus:ring-navy/20 focus:border-navy outline-none transition-all text-sm" value={formData.confirm_password} onChange={handleInputChange} placeholder="Verify your new password" />
              </div>
            </div>
          </div>
        </div>

        {/* Sticky Action Footer */}
        <div className="flex justify-end pt-4">
          <button 
            disabled={saving} 
            type="submit" 
            className="flex items-center gap-2 px-8 py-3.5 bg-navy text-white font-bold rounded-xl hover:bg-navy/90 transition-all shadow-lg active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {saving ? (
              <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> Updating Profile...</>
            ) : (
              <><Save size={18} /> Save Changes</>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}