import { useState, useEffect } from 'react';
import { Users, Palette, Trash2, ShieldAlert, CreditCard, Copy, Crown, Clock } from 'lucide-react';
import InviteModal from '../components/InviteModal';
import api from '../lib/api';

export default function Settings() {
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [members, setMembers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [orgData, setOrgData] = useState(null);
  
  // Theme States
  const [navyColor, setNavyColor] = useState('#0A0F1E');
  const [accentColor, setAccentColor] = useState('#00C896');
  const [isSavingTheme, setIsSavingTheme] = useState(false);

  // Payment States
  const [provider, setProvider] = useState('paystack');
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
        const [brandRes, teamRes] = await Promise.all([
          api.get(`/orgs/${orgId}`),
          api.get(`/orgs/${orgId}/members`)
        ]);
        
        const data = brandRes.data;
        setOrgData(data);
        
        // Robust Theme Hydration
        if (data?.brand_settings) {
          const brand = typeof data.brand_settings === 'string' ? JSON.parse(data.brand_settings) : data.brand_settings;
          if (brand.primary) setNavyColor(brand.primary);
          if (brand.accent) setAccentColor(brand.accent);
        }

        // Robust Payment Hydration (Fixes the "disappearing" bug)
        if (data?.payment_settings) {
          const pay = typeof data.payment_settings === 'string' ? JSON.parse(data.payment_settings) : data.payment_settings;
          if (pay.provider) setProvider(pay.provider);
          if (pay.stripe_pk) setStripePk(pay.stripe_pk);
          if (pay.stripe_sk) setStripeSk(pay.stripe_sk);
          if (pay.paystack_pk) setPaystackPk(pay.paystack_pk);
          if (pay.paystack_sk) setPaystackSk(pay.paystack_sk);
        }

        setMembers(teamRes.data || []);
      } catch (err) {
        console.error('Failed to fetch workspace data:', err);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchWorkspaceData();
  }, [orgId, showInviteModal]); 

  const handleSaveBranding = async () => {
    setIsSavingTheme(true);
    try {
      await api.put(`/orgs/${orgId}/branding`, { navy: navyColor, accent: accentColor });
      document.documentElement.style.setProperty('--theme-navy', navyColor);
      document.documentElement.style.setProperty('--theme-accent', accentColor);
    } catch (err) {
      alert('Failed to save branding.');
    } finally {
      setIsSavingTheme(false);
    }
  };

  const handleSavePayments = async () => {
    setIsSavingPayments(true);
    try {
      await api.put(`/orgs/${orgId}/payments`, { 
        provider, 
        stripe_pk: stripePk, 
        stripe_sk: stripeSk, 
        paystack_pk: paystackPk, 
        paystack_sk: paystackSk 
      });
      alert('Payment Configuration locked securely.');
    } catch (err) {
      alert('Failed to save payment settings.');
    } finally {
      setIsSavingPayments(false);
    }
  };

  const handleRemoveMember = async (userId, role) => {
    if (role === 'owner') return alert('Cannot remove the workspace owner.');
    if (!window.confirm('Revoke workspace access for this user?')) return;
    try {
      await api.delete(`/orgs/${orgId}/members/${userId}`);
      setMembers(members.filter(m => m.user_id !== userId));
    } catch (err) {
      alert('Failed to remove member.');
    }
  };

  if (isLoading) return <div className="flex justify-center p-12"><div className="animate-spin w-8 h-8 border-2 border-navy border-t-transparent rounded-full"></div></div>;

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-navy">Workspace Settings</h1>
          <p className="text-gray-500 font-medium mt-1">Manage your agency access, whitelabeling, and integrations.</p>
        </div>
        
        <div className="bg-white border border-gray-200 px-4 py-2 rounded-xl flex items-center gap-3 shadow-sm">
          <div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Workspace ID</p>
            <p className="font-mono text-xs text-navy font-bold">{orgId}</p>
          </div>
          <button onClick={() => navigator.clipboard.writeText(orgId)} className="p-1.5 bg-gray-50 hover:bg-gray-100 text-gray-500 rounded-md transition-colors"><Copy size={14} /></button>
        </div>
      </div>

      <div className="grid gap-6">
        
        {/* BILLING & SUBSCRIPTION SECTION */}
        <section className="bg-gradient-to-br from-navy to-[#1a233a] rounded-2xl p-8 border border-gray-800 shadow-xl text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
            <Crown size={120} />
          </div>
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[10px] font-black text-accent uppercase tracking-widest bg-accent/10 px-2 py-1 rounded border border-accent/20">Current Plan</span>
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">{orgData?.subscription_status || 'Trialing'}</span>
              </div>
              <h2 className="text-3xl font-black text-white capitalize">{orgData?.plan_tier || 'Solo'} Tier</h2>
              <p className="text-sm text-gray-400 font-medium mt-2 max-w-md">Upgrade to Agency to unlock unlimited team members and remove white-labeling restrictions.</p>
            </div>
            <div className="shrink-0">
              <button className="bg-accent text-navy px-8 py-3 rounded-xl font-bold hover:bg-accent/90 transition-all shadow-[0_0_20px_rgba(0,200,150,0.3)] active:scale-95">
                Upgrade Workspace
              </button>
            </div>
          </div>
        </section>

        {/* FINANCIAL INTEGRATIONS */}
        <section className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-green-100 text-green-600 rounded-lg"><CreditCard size={20} /></div>
            <div>
              <h2 className="text-xl font-bold text-navy">Payment Gateway</h2>
              <p className="text-sm text-gray-500 font-medium mt-1">Connect your preferred processor to get paid directly.</p>
            </div>
          </div>
          
          <div className="space-y-6">
            <div>
              <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-3">Active Gateway</label>
              <select value={provider} onChange={(e) => setProvider(e.target.value)} className="w-full p-3.5 bg-gray-50 border border-gray-200 rounded-xl font-bold text-navy outline-none focus:border-accent transition-colors appearance-none cursor-pointer">
                <option value="stripe">Stripe (Global / USD)</option>
                <option value="paystack">Paystack (Africa / NGN / USD)</option>
              </select>
            </div>

            {provider === 'stripe' && (
              <div className="grid md:grid-cols-2 gap-4 animate-in fade-in duration-300">
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Publishable Key</label>
                  <input type="text" value={stripePk} onChange={(e) => setStripePk(e.target.value)} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:border-accent font-mono text-sm" />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Secret Key</label>
                  <input type="password" value={stripeSk} onChange={(e) => setStripeSk(e.target.value)} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:border-accent font-mono text-sm" />
                </div>
              </div>
            )}

            {provider === 'paystack' && (
              <div className="grid md:grid-cols-2 gap-4 animate-in fade-in duration-300">
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Public Key</label>
                  <input type="text" value={paystackPk} onChange={(e) => setPaystackPk(e.target.value)} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:border-accent font-mono text-sm" />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Secret Key</label>
                  <input type="password" value={paystackSk} onChange={(e) => setPaystackSk(e.target.value)} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:border-accent font-mono text-sm" />
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end border-t border-gray-50 pt-6 mt-6">
            <button onClick={handleSavePayments} disabled={isSavingPayments} className="px-6 py-2.5 bg-green-600 text-white font-bold rounded-xl hover:shadow-lg hover:shadow-green-600/20 transition-all active:scale-95 disabled:opacity-50">
              {isSavingPayments ? 'Securing...' : 'Save Configuration'}
            </button>
          </div>
        </section>

        {/* Dynamic Branding Section */}
        <section className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-accent/10 text-accent rounded-lg"><Palette size={20} /></div>
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
            <p className="text-xs text-gray-400 font-medium max-w-[250px]">Applies globally to UI and invoices.</p>
            <button onClick={handleSaveBranding} disabled={isSavingTheme} className="px-6 py-2.5 bg-navy text-white font-bold rounded-xl hover:shadow-lg hover:shadow-navy/20 transition-all active:scale-95 disabled:opacity-50">
              {isSavingTheme ? 'Applying...' : 'Apply Theme'}
            </button>
          </div>
        </section>

        {/* Team Management Section */}
        <section className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-navy text-white rounded-lg"><Users size={20} /></div>
              <h2 className="text-xl font-bold text-navy">Team Members</h2>
            </div>
            <button onClick={() => setShowInviteModal(true)} className="bg-accent text-white px-4 py-2 rounded-lg font-bold hover:bg-accent/90 transition-all active:scale-95">
              Invite Member
            </button>
          </div>

          <div className="space-y-3">
            {members.length === 0 ? (
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
                    <button onClick={() => handleRemoveMember(member.user_id, member.role)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
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
        <div className="fixed inset-0 bg-navy/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="relative w-full max-w-md animate-in zoom-in-95 duration-200">
            <InviteModal orgId={orgId} onClose={() => setShowInviteModal(false)} />
          </div>
        </div>
      )}
    </div>
  );
}