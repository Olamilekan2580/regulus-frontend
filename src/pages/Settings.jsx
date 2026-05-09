import { useState, useEffect } from 'react';
import { Users, Palette, Trash2, ShieldAlert, CreditCard } from 'lucide-react';
import InviteModal from '../components/InviteModal';
import api from '../lib/api';

export default function Settings() {
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [members, setMembers] = useState([]);
  const [isLoadingMembers, setIsLoadingMembers] = useState(true);
  
  // Theme States
  const [navyColor, setNavyColor] = useState('#0A0F1E');
  const [accentColor, setAccentColor] = useState('#00C896');
  const [isSavingTheme, setIsSavingTheme] = useState(false);

  // Payment States
  const [provider, setProvider] = useState('paystack'); // default
  const [stripePk, setStripePk] = useState('');
  const [stripeSk, setStripeSk] = useState('');
  const [paystackPk, setPaystackPk] = useState('');
  const [paystackSk, setPaystackSk] = useState('');
  const [isSavingPayments, setIsSavingPayments] = useState(false);

  const orgId = localStorage.getItem('current_org_id'); 

  useEffect(() => {
    const fetchWorkspaceData = async () => {
      if (!orgId) return;
      
      try {
        const brandRes = await api.get(`/orgs/${orgId}`);
        const orgData = brandRes.data;
        
        // Inject Branding
        if (orgData?.brand_settings) {
          if (orgData.brand_settings.primary) setNavyColor(orgData.brand_settings.primary);
          if (orgData.brand_settings.accent) setAccentColor(orgData.brand_settings.accent);
        }

        // Inject Payments
        if (orgData?.payment_settings) {
          if (orgData.payment_settings.provider) setProvider(orgData.payment_settings.provider);
          if (orgData.payment_settings.stripe_pk) setStripePk(orgData.payment_settings.stripe_pk);
          if (orgData.payment_settings.stripe_sk) setStripeSk(orgData.payment_settings.stripe_sk);
          if (orgData.payment_settings.paystack_pk) setPaystackPk(orgData.payment_settings.paystack_pk);
          if (orgData.payment_settings.paystack_sk) setPaystackSk(orgData.payment_settings.paystack_sk);
        }

        // Fetch Team
        const teamRes = await api.get(`/orgs/${orgId}/members`);
        setMembers(teamRes.data || []);
      } catch (err) {
        console.error('Failed to fetch workspace data.');
      } finally {
        setIsLoadingMembers(false);
      }
    };
    
    fetchWorkspaceData();
  }, [orgId, showInviteModal]); 

  const handleSaveBranding = async () => {
    if (!orgId) return alert('Organization ID missing.');
    setIsSavingTheme(true);
    try {
      await api.put(`/orgs/${orgId}/branding`, { navy: navyColor, accent: accentColor });
      document.documentElement.style.setProperty('--theme-navy', navyColor);
      document.documentElement.style.setProperty('--theme-accent', accentColor);
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to save branding.');
    } finally {
      setIsSavingTheme(false);
    }
  };

  const handleSavePayments = async () => {
    if (!orgId) return alert('Organization ID missing.');
    setIsSavingPayments(true);
    try {
      await api.put(`/orgs/${orgId}/payments`, { 
        provider, 
        stripe_pk: stripePk, 
        stripe_sk: stripeSk, 
        paystack_pk: paystackPk, 
        paystack_sk: paystackSk 
      });
      alert('Payment Gateway settings saved successfully. Your clients can now pay you directly.');
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to save payment settings.');
    } finally {
      setIsSavingPayments(false);
    }
  };

  const handleRemoveMember = async (userId, role) => {
    if (role === 'owner') return alert('Cannot remove the workspace owner.');
    if (!window.confirm('Are you sure you want to revoke workspace access for this user?')) return;

    try {
      await api.delete(`/orgs/${orgId}/members/${userId}`);
      setMembers(members.filter(m => m.user_id !== userId));
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to remove member. You must be an Admin.');
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      <div>
        <h1 className="text-3xl font-black text-navy">Workspace Settings</h1>
        <p className="text-gray-500 font-medium">Manage your agency access, whitelabeling, and integrations.</p>
      </div>

      <div className="grid gap-6">
        
        {/* FINANCIAL INTEGRATIONS SECTION */}
        <section className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-green-100 text-green-600 rounded-lg">
              <CreditCard size={20} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-navy">Payment Gateway</h2>
              <p className="text-sm text-gray-500 font-medium mt-1">Connect your preferred processor to get paid directly by clients.</p>
            </div>
          </div>
          
          <div className="space-y-6">
            <div>
              <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-3">Active Gateway</label>
              <select 
                value={provider} 
                onChange={(e) => setProvider(e.target.value)}
                className="w-full p-3.5 bg-gray-50 border border-gray-200 rounded-xl font-bold text-navy outline-none focus:border-accent transition-colors appearance-none cursor-pointer"
              >
                <option value="stripe">Stripe (Global / USD)</option>
                <option value="paystack">Paystack (Africa / NGN / USD)</option>
              </select>
            </div>

            {provider === 'stripe' && (
              <div className="grid md:grid-cols-2 gap-4 animate-in fade-in duration-300">
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Stripe Publishable Key</label>
                  <input type="text" placeholder="pk_live_..." value={stripePk} onChange={(e) => setStripePk(e.target.value)} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:border-accent font-mono text-sm" />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Stripe Secret Key</label>
                  <input type="password" placeholder="sk_live_..." value={stripeSk} onChange={(e) => setStripeSk(e.target.value)} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:border-accent font-mono text-sm" />
                </div>
              </div>
            )}

            {provider === 'paystack' && (
              <div className="grid md:grid-cols-2 gap-4 animate-in fade-in duration-300">
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Paystack Public Key</label>
                  <input type="text" placeholder="pk_live_..." value={paystackPk} onChange={(e) => setPaystackPk(e.target.value)} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:border-accent font-mono text-sm" />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Paystack Secret Key</label>
                  <input type="password" placeholder="sk_live_..." value={paystackSk} onChange={(e) => setPaystackSk(e.target.value)} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:border-accent font-mono text-sm" />
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end border-t border-gray-50 pt-6 mt-6">
            <button 
              onClick={handleSavePayments}
              disabled={isSavingPayments}
              className="px-6 py-2.5 bg-green-600 text-white font-bold rounded-xl hover:shadow-lg hover:shadow-green-600/20 transition-all active:scale-95 disabled:opacity-50"
            >
              {isSavingPayments ? 'Securing Vault...' : 'Save Payment Configuration'}
            </button>
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
                <input type="color" value={navyColor} onChange={(e) => setNavyColor(e.target.value)} className="w-12 h-12 rounded cursor-pointer border-0 p-0 bg-transparent" />
                <input type="text" value={navyColor} onChange={(e) => setNavyColor(e.target.value)} className="font-mono text-sm font-bold border border-gray-200 p-2.5 rounded-lg w-full uppercase outline-none focus:border-accent transition-colors" />
              </div>
            </div>
            
            <div>
              <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-3">Accent Color</label>
              <div className="flex items-center gap-4">
                <input type="color" value={accentColor} onChange={(e) => setAccentColor(e.target.value)} className="w-12 h-12 rounded cursor-pointer border-0 p-0 bg-transparent" />
                <input type="text" value={accentColor} onChange={(e) => setAccentColor(e.target.value)} className="font-mono text-sm font-bold border border-gray-200 p-2.5 rounded-lg w-full uppercase outline-none focus:border-accent transition-colors" />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between border-t border-gray-50 pt-6">
            <p className="text-xs text-gray-400 font-medium max-w-[250px]">
              These colors will immediately apply to your UI and generated PDF invoices.
            </p>
            <button onClick={handleSaveBranding} disabled={isSavingTheme} className="px-6 py-2.5 bg-navy text-white font-bold rounded-xl hover:shadow-lg hover:shadow-navy/20 transition-all active:scale-95 disabled:opacity-50">
              {isSavingTheme ? 'Applying...' : 'Apply Workspace Theme'}
            </button>
          </div>
        </section>

        {/* Team Management Section */}
        <section className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-navy text-white rounded-lg">
                <Users size={20} />
              </div>
              <h2 className="text-xl font-bold text-navy">Team Members</h2>
            </div>
            <button onClick={() => setShowInviteModal(true)} className="bg-accent text-white px-4 py-2 rounded-lg font-bold hover:bg-accent/90 transition-all active:scale-95">
              Invite Member
            </button>
          </div>

          <div className="space-y-3">
            {isLoadingMembers ? (
              <p className="text-sm text-gray-400 italic font-medium">Loading team directory...</p>
            ) : members.length === 0 ? (
              <p className="text-sm text-gray-400 italic font-medium">No other members in this organization yet.</p>
            ) : (
              members.map((member) => (
                <div key={member.user_id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
                  <div>
                    <p className="font-bold text-navy">{member.email}</p>
                    <p className="text-xs text-gray-500 flex items-center gap-1 uppercase tracking-widest mt-1">
                      {member.role === 'owner' && <ShieldAlert size={12} className="text-accent" />}
                      {member.role}
                    </p>
                  </div>
                  {member.role !== 'owner' && (
                    <button onClick={() => handleRemoveMember(member.user_id, member.role)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="Revoke Access">
                      <Trash2 size={18} />
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </section>
        
      </div>

      {showInviteModal && (
        <div className="fixed inset-0 bg-navy/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 z-50">
          <div className="relative w-full max-w-md animate-in zoom-in-95 duration-200">
            <InviteModal orgId={orgId} onClose={() => setShowInviteModal(false)} />
          </div>
        </div>
      )}
    </div>
  );
}