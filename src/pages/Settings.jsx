import { useState, useEffect } from 'react';
import { Users, Palette, Trash2, ShieldAlert, CreditCard, Copy, Crown, Lock, Edit2, CheckCircle2, Zap, GitBranch, Shield, AlertCircle, Star } from 'lucide-react';
import InviteModal from '../components/InviteModal';
import api from '../lib/api';
import DomainManager from '../components/DomainManager';

// Flutterwave supported banks for Nigeria
const NIGERIAN_BANKS = [
  { code: '044', name: 'Access Bank' },
  { code: '050', name: 'Ecobank' },
  { code: '070', name: 'Fidelity Bank' },
  { code: '011', name: 'First Bank of Nigeria' },
  { code: '214', name: 'FCMB' },
  { code: '058', name: 'Guaranty Trust Bank (GTB)' },
  { code: '030', name: 'Heritage Bank' },
  { code: '082', name: 'Keystone Bank' },
  { code: '076', name: 'Polaris Bank' },
  { code: '221', name: 'Stanbic IBTC' },
  { code: '232', name: 'Sterling Bank' },
  { code: '032', name: 'Union Bank' },
  { code: '033', name: 'United Bank for Africa (UBA)' },
  { code: '215', name: 'Unity Bank' },
  { code: '035', name: 'Wema Bank' },
  { code: '057', name: 'Zenith Bank' }
];

export default function Settings() {
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showPricingModal, setShowPricingModal] = useState(false);
  const [members, setMembers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [orgData, setOrgData] = useState(null);
  
  // Theme States
  const [navyColor, setNavyColor] = useState('#0A0F1E');
  const [accentColor, setAccentColor] = useState('#00C896');
  const [isSavingTheme, setIsSavingTheme] = useState(false);

  // Multi-Currency Payout States
  const [activeTab, setActiveTab] = useState('NGN');
  const [defaultCurrency, setDefaultCurrency] = useState('NGN');
  const [isSettingDefault, setIsSettingDefault] = useState(false);

  const [ngnVault, setNgnVault] = useState({
    fw_subaccount_id: null, bank_code: '', account_number: '', bank_name: ''
  });
  
  const [usdVault, setUsdVault] = useState({
    fw_subaccount_id: null, routing_number: '', account_number: '', bank_name: ''
  });

  const [isSavingPayments, setIsSavingPayments] = useState(false);
  const [paymentError, setPaymentError] = useState('');
  const [paymentSuccess, setPaymentSuccess] = useState('');

  const [isProcessingUpgrade, setIsProcessingUpgrade] = useState(false);
  
  // Developer Integration States
  const [githubHandle, setGithubHandle] = useState('');
  const [isSavingGithub, setIsSavingGithub] = useState(false);

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

        if (data?.github_handle) {
          setGithubHandle(data.github_handle);
        }
        
        if (data?.brand_settings) {
          const brand = typeof data.brand_settings === 'string' ? JSON.parse(data.brand_settings) : data.brand_settings;
          if (brand.primary) setNavyColor(brand.primary);
          if (brand.accent) setAccentColor(brand.accent);
        }

        // Hydrate Dual Vaults
        setNgnVault(prev => ({
          ...prev,
          fw_subaccount_id: data?.fw_subaccount_ngn || null,
          account_number: data?.ngn_account_number || '',
          bank_name: data?.ngn_bank_name || ''
        }));

        setUsdVault(prev => ({
          ...prev,
          fw_subaccount_id: data?.fw_subaccount_usd || null,
          account_number: data?.usd_account_number || '',
          bank_name: data?.usd_bank_name || ''
        }));

        setDefaultCurrency(data?.default_payout_currency || 'NGN');
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

  const handleConnectBank = async (e, type) => {
    e.preventDefault();
    setPaymentError('');
    setPaymentSuccess('');
    setIsSavingPayments(true);

    try {
      const activeData = type === 'NGN' ? ngnVault : usdVault;
      const selectedBank = type === 'NGN' 
        ? NIGERIAN_BANKS.find(b => b.code === activeData.bank_code)?.name 
        : activeData.bank_name;

      const payload = {
        org_id: orgId,
        payout_type: type,
        bank_name: selectedBank,
        ...activeData
      };

      const res = await api.post(`/payouts/connect`, payload);
      
      if (type === 'NGN') {
        setNgnVault(prev => ({ ...prev, fw_subaccount_id: res.data.subaccount_id, bank_name: selectedBank }));
      } else {
        setUsdVault(prev => ({ ...prev, fw_subaccount_id: res.data.subaccount_id, bank_name: selectedBank }));
      }
      setPaymentSuccess(`${type} bank account verified and locked.`);
    } catch (err) {
      setPaymentError(err.response?.data?.error || `Failed to verify ${type} account with Flutterwave.`);
    } finally {
      setIsSavingPayments(false);
    }
  };

  const handleSetDefault = async (currency) => {
    if (defaultCurrency === currency) return;
    setIsSettingDefault(true);
    try {
      await api.put(`/payouts/default`, { org_id: orgId, default_currency: currency });
      setDefaultCurrency(currency);
    } catch (err) {
      alert('Failed to update default routing.');
    } finally {
      setIsSettingDefault(false);
    }
  };

  const handleSaveGithub = async () => {
    setIsSavingGithub(true);
    try {
      await api.put(`/orgs/${orgId}/integrations`, { github_handle: githubHandle });
      alert('GitHub handle saved successfully.');
    } catch (err) {
      alert('Failed to save GitHub integration.');
    } finally {
      setIsSavingGithub(false);
    }
  };

  const handleRemoveMember = async (userId, role) => {
    if (role === 'owner') return alert('Cannot remove the workspace owner.');
    if (!window.confirm('Revoke workspace access for this user?')) return;
    try {
      await api.delete(`/orgs/${orgId}/members/${userId}`);
      setMembers(members.filter(m => m.user_id !== userId));
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to remove member.');
    }
  };

  const handlePlanSelection = async (tier) => {
    setIsProcessingUpgrade(true);
    try {
      const res = await api.post('/billing/subscribe', { 
        plan_tier: tier, 
        org_id: orgId 
      });

      if (res.data?.url) {
        window.location.href = res.data.url;
      } else {
        throw new Error('No checkout URL received.');
      }
    } catch (err) {
      alert(err.response?.data?.error || 'Checkout failed to initialize.');
    } finally {
      setIsProcessingUpgrade(false);
    }
  };

  if (isLoading) return <div className="flex justify-center p-12"><div className="animate-spin w-8 h-8 border-2 border-navy border-t-transparent rounded-full"></div></div>;

  const isAdminOrOwner = ['owner', 'admin'].includes(orgData?.role);

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
        {isAdminOrOwner && (
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
                <button onClick={() => setShowPricingModal(true)} className="bg-accent text-navy px-8 py-3 rounded-xl font-bold hover:bg-accent/90 transition-all shadow-[0_0_20px_rgba(0,200,150,0.3)] active:scale-95">
                  Upgrade Workspace
                </button>
              </div>
            </div>
          </section>
        )}

        {/* TEAM DIRECTORY SECTION */}
        <section className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 text-blue-600 rounded-lg"><Users size={20} /></div>
              <div>
                <h2 className="text-xl font-bold text-navy">Team Directory</h2>
                <p className="text-sm text-gray-500 font-medium mt-1">Manage workspace access and member roles.</p>
              </div>
            </div>
            {isAdminOrOwner && (
              <button 
                onClick={() => setShowInviteModal(true)} 
                className="flex items-center gap-2 bg-navy text-white px-4 py-2 rounded-lg font-medium hover:bg-navy/90 transition-colors text-sm"
              >
                <Users size={16} /> Invite Member
              </button>
            )}
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-gray-100 text-xs text-gray-400 uppercase tracking-widest">
                  <th className="py-3 font-black">User Email</th>
                  <th className="py-3 font-black">Assigned Role</th>
                  <th className="py-3 font-black text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {members.map(member => (
                  <tr key={member.user_id} className="group hover:bg-gray-50/50 transition-colors">
                    <td className="py-4 text-sm font-bold text-navy">{member.email}</td>
                    <td className="py-4">
                      <span className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-md ${
                        member.role === 'owner' ? 'bg-purple-100 text-purple-700' :
                        member.role === 'admin' ? 'bg-blue-100 text-blue-700' :
                        'bg-gray-100 text-gray-600'
                      }`}>
                        {member.role}
                      </span>
                    </td>
                    <td className="py-4 text-right">
                      {isAdminOrOwner && member.role !== 'owner' && (
                        <button 
                          onClick={() => handleRemoveMember(member.user_id, member.role)} 
                          className="text-gray-300 hover:text-red-500 transition-colors p-2 rounded-lg hover:bg-red-50"
                          title="Revoke Access"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {members.length === 0 && (
              <div className="text-center py-8 text-sm text-gray-400 font-medium">No team members found.</div>
            )}
          </div>
        </section>

        {/* DEVELOPER INTEGRATIONS */}
        <section className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm mb-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-gray-100 text-gray-700 rounded-lg"><GitBranch size={20} /></div>
            <div>
              <h2 className="text-xl font-bold text-navy">Developer Integrations</h2>
              <p className="text-sm text-gray-500 font-medium mt-1">Connect external platforms for infrastructure provisioning.</p>
            </div>
          </div>
          
          <div className="max-w-md">
            <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-3">GitHub Organization / User Handle</label>
            <div className="flex items-center gap-3">
              <div className="relative flex-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold">github.com/</span>
                <input 
                  type="text" 
                  disabled={!isAdminOrOwner}
                  value={githubHandle} 
                  onChange={(e) => setGithubHandle(e.target.value.replace(/[^a-zA-Z0-9-]/g, ''))} 
                  placeholder="your-handle"
                  className="w-full pl-28 p-3 bg-gray-50 border border-gray-200 rounded-xl font-mono text-sm outline-none focus:border-accent transition-colors disabled:opacity-50 disabled:cursor-not-allowed" 
                />
              </div>
              {isAdminOrOwner && (
                <button 
                  onClick={handleSaveGithub} 
                  disabled={isSavingGithub || !githubHandle}
                  className="px-6 py-3 bg-navy text-white font-bold rounded-xl hover:bg-navy/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 shrink-0"
                >
                  {isSavingGithub ? 'Saving...' : 'Save'}
                </button>
              )}
            </div>
            <p className="text-xs text-gray-400 font-medium mt-3">This handle is used to dynamically route you to your provisioned repositories.</p>
          </div>
        </section>

        {/* MULTI-CURRENCY PAYOUT VAULT */}
        <section className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 text-green-600 rounded-lg"><CreditCard size={20} /></div>
              <div>
                <h2 className="text-xl font-bold text-navy">Global Payout Vault</h2>
                <p className="text-sm text-gray-500 font-medium mt-1">Manage your local and international settlement accounts.</p>
              </div>
            </div>
          </div>
          
          {/* Dual-Vault Toggle */}
          <div className="flex gap-4 p-1 bg-gray-50 border border-gray-200 rounded-xl max-w-md mb-6">
            <button 
              onClick={() => setActiveTab('NGN')} 
              className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${activeTab === 'NGN' ? 'bg-white shadow-sm text-navy' : 'text-gray-400 hover:text-navy'}`}
            >
              Local Bank (NGN) {defaultCurrency === 'NGN' && <Star size={14} className="text-accent fill-accent" />}
            </button>
            <button 
              onClick={() => setActiveTab('USD')} 
              className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${activeTab === 'USD' ? 'bg-white shadow-sm text-navy' : 'text-gray-400 hover:text-navy'}`}
            >
              US / Payoneer (USD) {defaultCurrency === 'USD' && <Star size={14} className="text-accent fill-accent" />}
            </button>
          </div>

          {paymentError && (
            <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl flex items-center gap-3 text-red-600 text-sm font-medium">
              <AlertCircle size={18} /> {paymentError}
            </div>
          )}
          
          {paymentSuccess && (
            <div className="mb-6 p-4 bg-green-50 border border-green-100 rounded-xl flex items-center gap-3 text-green-600 text-sm font-medium">
              <CheckCircle2 size={18} /> {paymentSuccess}
            </div>
          )}

          {/* NGN TAB */}
          {activeTab === 'NGN' && (
            <div className="animate-in fade-in duration-300">
              {!ngnVault.fw_subaccount_id ? (
                <form onSubmit={(e) => handleConnectBank(e, 'NGN')} className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Select Bank</label>
                      <select required value={ngnVault.bank_code} onChange={e => setNgnVault({...ngnVault, bank_code: e.target.value})} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-accent font-semibold text-sm cursor-pointer">
                        <option value="">Choose a bank...</option>
                        {NIGERIAN_BANKS.map(bank => <option key={bank.code} value={bank.code}>{bank.name}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Account Number</label>
                      <input type="text" required maxLength="10" placeholder="e.g. 0123456789" value={ngnVault.account_number} onChange={e => setNgnVault({...ngnVault, account_number: e.target.value.replace(/\D/g, '')})} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-accent font-semibold text-sm" />
                    </div>
                  </div>
                  <div className="flex justify-between items-center border-t border-gray-50 pt-6 mt-6">
                    <div className="flex items-center gap-2 text-xs font-bold text-gray-400">
                      <Shield size={14} /> Powered by Flutterwave
                    </div>
                    <button type="submit" disabled={isSavingPayments} className="flex items-center justify-center gap-2 px-6 py-3 bg-navy text-white font-bold rounded-xl hover:shadow-lg transition-all active:scale-95 disabled:opacity-50 min-w-[160px]">
                      {isSavingPayments ? <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/20 border-t-white"></div> : <><Lock size={16} /> Connect NGN Vault</>}
                    </button>
                  </div>
                </form>
              ) : (
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-white rounded-xl shadow-sm border border-gray-100 flex items-center justify-center text-green-500">
                      <CheckCircle2 size={24} />
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Status</p>
                      <p className="font-bold text-navy text-lg">Active NGN Subaccount</p>
                    </div>
                  </div>
                  <div className="text-left md:text-right flex flex-col items-start md:items-end gap-3">
                    <p className="font-bold text-sm text-navy">{ngnVault.bank_name}</p>
                    <p className="font-mono text-xs text-gray-500 bg-white border border-gray-100 px-3 py-1.5 rounded-md">ACCT: ••••••{ngnVault.account_number?.slice(-4) || '••••'}</p>
                    {defaultCurrency !== 'NGN' && isAdminOrOwner && (
                      <button onClick={() => handleSetDefault('NGN')} disabled={isSettingDefault} className="text-xs font-bold text-accent hover:text-accent/80 transition-colors flex items-center gap-1 mt-1">
                        <Star size={14} /> Set as Default Route
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* USD TAB */}
          {activeTab === 'USD' && (
            <div className="animate-in fade-in duration-300">
              {!usdVault.fw_subaccount_id ? (
                <form onSubmit={(e) => handleConnectBank(e, 'USD')} className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Bank Name</label>
                      <input type="text" required placeholder="e.g. First Century Bank (Payoneer)" value={usdVault.bank_name} onChange={e => setUsdVault({...usdVault, bank_name: e.target.value})} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-accent font-semibold text-sm" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Account Number</label>
                      <input type="text" required placeholder="USD Account Number" value={usdVault.account_number} onChange={e => setUsdVault({...usdVault, account_number: e.target.value.replace(/\D/g, '')})} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-accent font-semibold text-sm" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Routing Number / SWIFT</label>
                      <input type="text" required placeholder="ABA Routing or SWIFT Code" value={usdVault.routing_number} onChange={e => setUsdVault({...usdVault, routing_number: e.target.value})} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-accent font-semibold text-sm" />
                    </div>
                  </div>
                  <div className="flex justify-between items-center border-t border-gray-50 pt-6 mt-6">
                    <div className="flex items-center gap-2 text-xs font-bold text-gray-400">
                      <Shield size={14} /> Powered by Flutterwave
                    </div>
                    <button type="submit" disabled={isSavingPayments} className="flex items-center justify-center gap-2 px-6 py-3 bg-navy text-white font-bold rounded-xl hover:shadow-lg transition-all active:scale-95 disabled:opacity-50 min-w-[160px]">
                      {isSavingPayments ? <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/20 border-t-white"></div> : <><Lock size={16} /> Connect USD Vault</>}
                    </button>
                  </div>
                </form>
              ) : (
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-white rounded-xl shadow-sm border border-gray-100 flex items-center justify-center text-green-500">
                      <CheckCircle2 size={24} />
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Status</p>
                      <p className="font-bold text-navy text-lg">Active USD Subaccount</p>
                    </div>
                  </div>
                  <div className="text-left md:text-right flex flex-col items-start md:items-end gap-3">
                    <p className="font-bold text-sm text-navy">{usdVault.bank_name}</p>
                    <p className="font-mono text-xs text-gray-500 bg-white border border-gray-100 px-3 py-1.5 rounded-md">ACCT: ••••••{usdVault.account_number?.slice(-4) || '••••'}</p>
                    {defaultCurrency !== 'USD' && isAdminOrOwner && (
                      <button onClick={() => handleSetDefault('USD')} disabled={isSettingDefault} className="text-xs font-bold text-accent hover:text-accent/80 transition-colors flex items-center gap-1 mt-1">
                        <Star size={14} /> Set as Default Route
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
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
                <input type="color" disabled={!isAdminOrOwner} value={navyColor} onChange={(e) => setNavyColor(e.target.value)} className={`w-12 h-12 rounded border-0 p-0 bg-transparent ${isAdminOrOwner ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'}`} />
                <input type="text" disabled={!isAdminOrOwner} value={navyColor} onChange={(e) => setNavyColor(e.target.value)} className="font-mono text-sm font-bold border border-gray-200 p-2.5 rounded-lg w-full uppercase outline-none focus:border-accent transition-colors disabled:bg-gray-50" />
              </div>
            </div>
            
            <div>
              <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-3">Accent Color</label>
              <div className="flex items-center gap-4">
                <input type="color" disabled={!isAdminOrOwner} value={accentColor} onChange={(e) => setAccentColor(e.target.value)} className={`w-12 h-12 rounded border-0 p-0 bg-transparent ${isAdminOrOwner ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'}`} />
                <input type="text" disabled={!isAdminOrOwner} value={accentColor} onChange={(e) => setAccentColor(e.target.value)} className="font-mono text-sm font-bold border border-gray-200 p-2.5 rounded-lg w-full uppercase outline-none focus:border-accent transition-colors disabled:bg-gray-50" />
              </div>
            </div>
          </div>

          {isAdminOrOwner && (
            <div className="flex items-center justify-between border-t border-gray-50 pt-6">
              <p className="text-xs text-gray-400 font-medium max-w-[250px]">Applies globally to UI and invoices.</p>
              <button onClick={handleSaveBranding} disabled={isSavingTheme} className="px-6 py-2.5 bg-navy text-white font-bold rounded-xl hover:shadow-lg hover:shadow-navy/20 transition-all active:scale-95 disabled:opacity-50">
                {isSavingTheme ? 'Applying...' : 'Apply Theme'}
              </button>
            </div>
          )}
        </section>

        {/* WHITE-LABEL ENGINE (DOMAIN MANAGER) */}
        {isAdminOrOwner && (
          <div className="mt-4">
            <DomainManager currentDomain={orgData?.custom_domain} status={orgData?.domain_status} />
          </div>
        )}
        
      </div>

      {/* MODALS */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-navy/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="relative w-full max-w-md animate-in zoom-in-95 duration-200">
            <InviteModal orgId={orgId} onClose={() => setShowInviteModal(false)} />
          </div>
        </div>
      )}

      {/* PRICING MODAL */}
      {showPricingModal && (
        <div className="fixed inset-0 bg-navy/80 backdrop-blur-md flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-gray-50 rounded-3xl w-full max-w-5xl shadow-2xl animate-in zoom-in-95 duration-200 my-8 overflow-hidden flex flex-col">
            <div className="bg-navy p-8 text-center relative">
              <button onClick={() => setShowPricingModal(false)} className="absolute top-6 right-6 text-white/50 hover:text-white font-bold text-sm uppercase tracking-widest transition-colors">Close</button>
              <h2 className="text-3xl font-black text-white mb-2">Scale Your Agency</h2>
              <p className="text-gray-400 font-medium max-w-lg mx-auto">Select the plan that fits your current operational volume. All plans include the AI Sandbox and automated invoices.</p>
            </div>
            
            <div className="p-8 grid md:grid-cols-3 gap-6">
              
              {/* Solo Plan */}
              <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm flex flex-col relative">
                {orgData?.plan_tier === 'solo' && <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full">Current Plan</div>}
                <h3 className="text-xl font-bold text-navy mb-1">Solo</h3>
                <p className="text-sm text-gray-500 font-medium mb-6">Perfect for independent freelancers.</p>
                <div className="mb-6"><span className="text-4xl font-black text-navy">$29</span><span className="text-gray-500 font-medium">/month</span></div>
                <ul className="space-y-3 mb-8 flex-1">
                  <li className="flex items-start gap-2 text-sm text-gray-700 font-medium"><CheckCircle2 size={16} className="text-accent shrink-0 mt-0.5"/> 1 User Account</li>
                  <li className="flex items-start gap-2 text-sm text-gray-700 font-medium"><CheckCircle2 size={16} className="text-accent shrink-0 mt-0.5"/> Unlimited Clients</li>
                  <li className="flex items-start gap-2 text-sm text-gray-700 font-medium"><CheckCircle2 size={16} className="text-accent shrink-0 mt-0.5"/> Standard White-labeling</li>
                </ul>
                <button 
                  onClick={() => handlePlanSelection('solo')}
                  disabled={isProcessingUpgrade || orgData?.plan_tier === 'solo'}
                  className="w-full py-3 rounded-xl font-bold bg-gray-100 text-navy hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {orgData?.plan_tier === 'solo' ? 'Current Plan' : 'Select Solo'}
                </button>
              </div>

              {/* Agency Plan */}
              <div className="bg-navy rounded-2xl p-6 border border-navy shadow-xl flex flex-col relative transform md:-translate-y-4">
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-accent text-navy text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full flex items-center gap-1"><Zap size={10}/> Recommended</div>
                <h3 className="text-xl font-bold text-white mb-1">Agency</h3>
                <p className="text-sm text-gray-400 font-medium mb-6">For growing teams and studios.</p>
                <div className="mb-6"><span className="text-4xl font-black text-white">$99</span><span className="text-gray-400 font-medium">/month</span></div>
                <ul className="space-y-3 mb-8 flex-1">
                  <li className="flex items-start gap-2 text-sm text-gray-300 font-medium"><CheckCircle2 size={16} className="text-accent shrink-0 mt-0.5"/> Up to 5 Team Members</li>
                  <li className="flex items-start gap-2 text-sm text-gray-300 font-medium"><CheckCircle2 size={16} className="text-accent shrink-0 mt-0.5"/> Unlimited Clients & Projects</li>
                  <li className="flex items-start gap-2 text-sm text-gray-300 font-medium"><CheckCircle2 size={16} className="text-accent shrink-0 mt-0.5"/> Advanced Permissions</li>
                </ul>
                <button 
                  onClick={() => handlePlanSelection('agency')}
                  disabled={isProcessingUpgrade || orgData?.plan_tier === 'agency'}
                  className="w-full py-3 rounded-xl font-bold bg-accent text-navy hover:bg-accent/90 transition-all shadow-[0_0_15px_rgba(0,200,150,0.3)] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isProcessingUpgrade ? 'Processing...' : (orgData?.plan_tier === 'agency' ? 'Current Plan' : 'Upgrade to Agency')}
                </button>
              </div>

              {/* White-Label Setup */}
              <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm flex flex-col relative">
                <h3 className="text-xl font-bold text-navy mb-1">Full Setup</h3>
                <p className="text-sm text-gray-500 font-medium mb-6">We configure your entire system.</p>
                <div className="mb-6"><span className="text-4xl font-black text-navy">$299</span><span className="text-gray-500 font-medium"> one-time</span></div>
                <ul className="space-y-3 mb-8 flex-1">
                  <li className="flex items-start gap-2 text-sm text-gray-700 font-medium"><CheckCircle2 size={16} className="text-accent shrink-0 mt-0.5"/> Complete Gateway Integration</li>
                  <li className="flex items-start gap-2 text-sm text-gray-700 font-medium"><CheckCircle2 size={16} className="text-accent shrink-0 mt-0.5"/> Custom Domain Mapping</li>
                  <li className="flex items-start gap-2 text-sm text-gray-700 font-medium"><CheckCircle2 size={16} className="text-accent shrink-0 mt-0.5"/> Hands-free Onboarding</li>
                </ul>
                <button 
                  onClick={() => window.location.href = 'https://buy.stripe.com/test_4gM9AV0h693n8hUgOz2Ji00'}
                  className="w-full py-3 rounded-xl font-bold bg-gray-100 text-navy hover:bg-gray-200 transition-colors"
                >
                  Request Setup
                </button>
                  
              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  );
}