import { useState, useEffect } from 'react';
import { Users, Palette } from 'lucide-react';
import InviteModal from '../components/InviteModal';
import api from '../lib/api';

export default function Settings() {
  const [showInviteModal, setShowInviteModal] = useState(false);
  
  // Theme States
  const [navyColor, setNavyColor] = useState('#0A0F1E');
  const [accentColor, setAccentColor] = useState('#00C896');
  const [isSavingTheme, setIsSavingTheme] = useState(false);

  const orgId = localStorage.getItem('current_org_id'); 

  // Fetch current branding on mount so inputs reflect the active theme
  useEffect(() => {
    const fetchBranding = async () => {
      if (!orgId) return;
      try {
        const res = await api.get(`/orgs/${orgId}`);
        const branding = res.data?.brand_settings;
        if (branding) {
          if (branding.primary) setNavyColor(branding.primary);
          if (branding.accent) setAccentColor(branding.accent);
        }
      } catch (err) {
        console.error('Failed to fetch current workspace branding.');
      }
    };
    fetchBranding();
  }, [orgId]);

  const handleSaveBranding = async () => {
    if (!orgId) return alert('Organization ID missing.');
    setIsSavingTheme(true);
    
    try {
      await api.put(`/orgs/${orgId}/branding`, { navy: navyColor, accent: accentColor });
      
      // Instantly inject to the DOM to avoid requiring a page refresh
      document.documentElement.style.setProperty('--theme-navy', navyColor);
      document.documentElement.style.setProperty('--theme-accent', accentColor);
      
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to save branding. Ensure you have Admin privileges.');
    } finally {
      setIsSavingTheme(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-black text-navy">Workspace Settings</h1>
        <p className="text-gray-500 font-medium">Manage your agency access and whitelabeling.</p>
      </div>

      <div className="grid gap-6">
        
        {/* Team Management Section */}
        <section className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-navy text-white rounded-lg">
                <Users size={20} />
              </div>
              <h2 className="text-xl font-bold text-navy">Team Members</h2>
            </div>
            <button 
              onClick={() => setShowInviteModal(true)}
              className="bg-accent text-white px-4 py-2 rounded-lg font-bold hover:bg-accent/90 transition-all active:scale-95"
            >
              Invite Member
            </button>
          </div>

          <div className="space-y-4">
            {/* List members here from a fetch call to /org_memberships */}
            <p className="text-sm text-gray-400 italic font-medium">No other members in this organization yet.</p>
          </div>
        </section>

        {/* Dynamic Branding Section */}
        <section className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-accent/10 text-accent rounded-lg">
              <Palette size={20} />
            </div>
            <h2 className="text-xl font-bold text-navy">Whitelabeling</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            <div>
              <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-3">Primary Brand Color</label>
              <div className="flex items-center gap-4">
                <input 
                  type="color" 
                  value={navyColor}
                  onChange={(e) => setNavyColor(e.target.value)}
                  className="w-12 h-12 rounded cursor-pointer border-0 p-0 bg-transparent"
                />
                <input 
                  type="text" 
                  value={navyColor}
                  onChange={(e) => setNavyColor(e.target.value)}
                  className="font-mono text-sm font-bold border border-gray-200 p-2.5 rounded-lg w-full uppercase outline-none focus:border-accent transition-colors"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-3">Accent Color</label>
              <div className="flex items-center gap-4">
                <input 
                  type="color" 
                  value={accentColor}
                  onChange={(e) => setAccentColor(e.target.value)}
                  className="w-12 h-12 rounded cursor-pointer border-0 p-0 bg-transparent"
                />
                <input 
                  type="text" 
                  value={accentColor}
                  onChange={(e) => setAccentColor(e.target.value)}
                  className="font-mono text-sm font-bold border border-gray-200 p-2.5 rounded-lg w-full uppercase outline-none focus:border-accent transition-colors"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between border-t border-gray-50 pt-6">
            <p className="text-xs text-gray-400 font-medium max-w-[250px]">
              These colors will immediately apply to your UI and generated PDF invoices.
            </p>
            <button 
              onClick={handleSaveBranding}
              disabled={isSavingTheme}
              className="px-6 py-2.5 bg-navy text-white font-bold rounded-xl hover:shadow-lg hover:shadow-navy/20 transition-all active:scale-95 disabled:opacity-50"
            >
              {isSavingTheme ? 'Applying...' : 'Apply Workspace Theme'}
            </button>
          </div>
        </section>
        
      </div>

      {showInviteModal && (
        <div className="fixed inset-0 bg-navy/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="relative w-full max-w-md animate-in zoom-in-95 duration-200">
            <button 
              onClick={() => setShowInviteModal(false)}
              className="absolute -top-12 right-0 text-white font-bold hover:text-accent transition-colors"
            >
              Close
            </button>
            <InviteModal orgId={orgId} />
          </div>
        </div>
      )}
    </div>
  );
}