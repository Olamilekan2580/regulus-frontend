import React, { useState } from 'react';
import { Globe, CheckCircle2, RefreshCw, Server, AlertCircle } from 'lucide-react';
import api from '../lib/api';

export default function DomainManager({ currentDomain = '', status = 'none' }) {
  const [domainInput, setDomainInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [localStatus, setLocalStatus] = useState(status);
  const [activeDomain, setActiveDomain] = useState(currentDomain);
  const [error, setError] = useState(null);

  const handleConnect = async (e) => {
    e.preventDefault();
    setError(null);
    
    if (!domainInput.includes('.')) {
      return setError('Please enter a valid subdomain (e.g., portal.agency.com)');
    }
    
    setLoading(true);
    try {
      // NOTE: We will wire this to the real backend in Step 3.
      // await api.post('/orgs/domain', { domain: domainInput });
      
      // Simulating a successful API response for now so you can test the UI
      setTimeout(() => {
        setActiveDomain(domainInput);
        setLocalStatus('pending');
        setLoading(false);
      }, 1000);
    } catch (err) {
      console.error(err);
      setError('Failed to register domain. Please try again.');
      setLoading(false);
    }
  };

  const handleRemove = () => {
    // We will wire this to delete the domain later
    setLocalStatus('none');
    setActiveDomain('');
    setDomainInput('');
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 md:p-8 shadow-xl">
      <div className="flex items-start gap-4 mb-8">
        <div className="p-3 bg-accent/10 text-accent rounded-xl">
          <Globe size={24} />
        </div>
        <div>
          <h2 className="text-xl font-bold text-white mb-1">Custom Domain</h2>
          <p className="text-sm text-slate-400">
            White-label your portal. Connect a custom subdomain to remove all platform branding.
          </p>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 text-red-400 text-sm font-bold">
          <AlertCircle size={18} />
          {error}
        </div>
      )}

      {localStatus === 'none' ? (
        <form onSubmit={handleConnect} className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            value={domainInput}
            onChange={(e) => setDomainInput(e.target.value.toLowerCase().trim())}
            placeholder="e.g., clients.youragency.com"
            className="flex-1 bg-[#0A0F1E] border border-slate-700 rounded-xl px-4 py-3 text-white placeholder:text-slate-600 focus:outline-none focus:border-accent transition-colors font-mono text-sm"
          />
          <button 
            disabled={loading}
            className="bg-accent hover:bg-accent/90 text-navy font-black px-6 py-3 rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2 min-w-[140px]"
          >
            {loading ? <RefreshCw className="animate-spin" size={18} /> : 'Connect Domain'}
          </button>
        </form>
      ) : (
        <div className="space-y-6">
          {/* Domain Status Card */}
          <div className="bg-[#0A0F1E] border border-slate-800 rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              {localStatus === 'active' ? (
                <CheckCircle2 className="text-accent" size={20} />
              ) : (
                <RefreshCw className="text-amber-500 animate-spin" size={20} />
              )}
              <span className="font-mono text-white font-bold">{activeDomain}</span>
            </div>
            <span className={`text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded-md border w-fit ${
              localStatus === 'active' 
                ? 'bg-accent/10 text-accent border-accent/20'
                : 'bg-amber-500/10 text-amber-500 border-amber-500/20'
            }`}>
              {localStatus === 'active' ? 'Active & Routed' : 'Pending DNS Verification'}
            </span>
          </div>

          {/* DNS Configuration Instructions */}
          {localStatus === 'pending' && (
            <div className="border border-slate-700 rounded-xl overflow-hidden">
              <div className="bg-slate-800 px-5 py-3 border-b border-slate-700 flex items-center gap-2">
                <Server size={16} className="text-slate-400" />
                <h3 className="text-sm font-bold text-white">DNS Configuration Required</h3>
              </div>
              <div className="p-5 bg-[#0A0F1E]">
                <p className="text-sm text-slate-400 mb-4">
                  Log into your domain registrar (GoDaddy, Cloudflare, etc.) and add the following CNAME record to verify your domain.
                </p>
                
                {/* The DNS Table */}
                <div className="hidden sm:grid grid-cols-3 gap-4 text-xs uppercase tracking-wider text-slate-500 font-bold mb-2 px-2">
                  <div>Type</div>
                  <div>Name</div>
                  <div>Value</div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-slate-900 border border-slate-800 rounded-lg p-4 font-mono text-sm text-white">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-0"><span className="sm:hidden text-slate-500 text-xs">Type: </span>CNAME</div>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-0 text-accent"><span className="sm:hidden text-slate-500 text-xs">Name: </span>{activeDomain.split('.')[0]}</div>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-0 break-all"><span className="sm:hidden text-slate-500 text-xs">Value: </span>cname.vercel-dns.com</div>
                </div>
                
                <p className="text-xs text-slate-500 mt-4 italic">
                  Note: DNS propagation can take up to 48 hours, though Vercel usually detects it within 15 minutes.
                </p>
              </div>
            </div>
          )}

          <div className="flex justify-end">
            <button 
              onClick={handleRemove}
              className="text-red-400 hover:text-red-300 text-sm font-bold transition-colors px-4 py-2 hover:bg-red-400/10 rounded-lg"
            >
              Remove Domain
            </button>
          </div>
        </div>
      )}
    </div>
  );
}