import { useState, useEffect, useRef } from 'react';
import { User, Mail, Camera, Save, CheckCircle2, Lock } from 'lucide-react';
import api from '../lib/api';

export default function Profile() {
  const fileInputRef = useRef(null);
  const [formData, setFormData] = useState({ first_name: '', last_name: '', email: '' });
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    api.get('/auth/me').then(res => {
      if (res.data) {
        // SURGERY: Only pull personal fields, ignore the rest
        setFormData({
          first_name: res.data.first_name || '',
          last_name: res.data.last_name || '',
          email: res.data.email || ''
        });
        if (res.data.avatar_url) setAvatarPreview(res.data.avatar_url);
      }
    });
  }, []);

  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    // Preview locally
    setAvatarPreview(URL.createObjectURL(file));
    
    const uploadData = new FormData();
    uploadData.append('avatar', file);
    try {
      await api.post('/users/avatar', uploadData);
      setMessage('Avatar updated!');
    } catch (err) { alert('Upload failed'); }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.put('/users/me', formData);
      setMessage('Profile saved successfully.');
    } catch (err) { setMessage('Save failed.'); }
    finally { setSaving(false); }
  };

  return (
    <div className="max-w-2xl space-y-8">
      <h1 className="text-2xl font-black text-navy">Personal Profile</h1>
      
      <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm">
        <div className="flex items-center gap-6 mb-8">
          <div className="relative group cursor-pointer" onClick={() => fileInputRef.current.click()}>
            <div className="w-24 h-24 rounded-full bg-gray-100 overflow-hidden border-2 border-gray-200">
              {avatarPreview ? <img src={avatarPreview} className="w-full h-full object-cover" /> : <User className="w-full h-full p-6 text-gray-300" />}
            </div>
            <div className="absolute inset-0 bg-navy/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <Camera className="text-white" size={20} />
            </div>
          </div>
          <input type="file" ref={fileInputRef} hidden onChange={handleAvatarUpload} />
          <div>
            <h2 className="font-bold text-navy">{formData.first_name} {formData.last_name}</h2>
            <p className="text-sm text-gray-400 font-medium">{formData.email}</p>
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <input type="text" placeholder="First Name" className="p-3 bg-gray-50 rounded-xl border border-gray-100 text-sm font-bold" value={formData.first_name} onChange={e => setFormData({...formData, first_name: e.target.value})} />
            <input type="text" placeholder="Last Name" className="p-3 bg-gray-50 rounded-xl border border-gray-100 text-sm font-bold" value={formData.last_name} onChange={e => setFormData({...formData, last_name: e.target.value})} />
          </div>
          <input type="email" placeholder="Email" className="w-full p-3 bg-gray-50 rounded-xl border border-gray-100 text-sm font-bold opacity-60" value={formData.email} disabled />
          
          <button type="submit" className="w-full py-3 bg-navy text-white rounded-xl font-bold flex items-center justify-center gap-2">
            <Save size={18} /> {saving ? 'Saving...' : 'Save Profile'}
          </button>
        </form>
      </div>
    </div>
  );
}