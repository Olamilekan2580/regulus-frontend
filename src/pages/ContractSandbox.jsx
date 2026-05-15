import { useState } from 'react';
import { Scale, ShieldAlert, CheckCircle2, Copy, AlertTriangle, FileText, Zap } from 'lucide-react';
import api from '../lib/api';

export default function ContractSandbox() {
  const [contractText, setContractText] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [flags, setFlags] = useState([]);
  const [error, setError] = useState(null);
  const [copiedIndex, setCopiedIndex] = useState(null);

  const handleAnalyze = async () => {
    if (!contractText.trim()) return;
    
    // CRITICAL: Get the Org Context from storage
    const orgId = localStorage.getItem('current_org_id');
    if (!orgId) {
      setError('Workspace context missing. Please refresh or re-login.');
      return;
    }

    setIsAnalyzing(true);
    setError(null);
    setFlags([]);

    try {
      // UPGRADE: Passing org_id in the payload for multi-tenant isolation
      const res = await api.post('/contracts/analyze', { 
        contract_text: contractText,
        org_id: orgId 
      });
      
      setFlags(res.data.flags || []);
    } catch (err) {
      console.error('[Audit Error]:', err.response?.data);
      setError(err.response?.data?.error || 'Failed to audit the contract. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const copyCounterProposal = (text, index) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <div className="space-y-6 flex flex-col min-h-full">
      {/* 1. RESPONSIVE HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-navy flex items-center gap-2">
            <Scale className="text-accent" /> AI Contract Sandbox
          </h1>
          <p className="text-sm text-gray-500 mt-1 font-medium">Audit MSAs for scope creep, IP theft, and liability risks.</p>
        </div>
        <button 
          onClick={handleAnalyze}
          disabled={isAnalyzing || !contractText.trim()}
          className="w-full md:w-auto flex justify-center items-center gap-2 bg-navy text-white px-6 py-3 md:py-2.5 rounded-xl font-bold shadow-sm hover:bg-navy/90 disabled:opacity-50 transition-all active:scale-95"
        >
          {isAnalyzing ? (
            <><div className="w-4 h-4 border-2 border-white/30 border-t-white animate-spin rounded-full" /> Auditing Clauses...</>
          ) : (
            <><Zap size={18} /> Run Legal Audit</>
          )}
        </button>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-xl border border-red-100 flex items-center gap-3 font-semibold shrink-0 animate-in slide-in-from-top-2">
          <AlertTriangle size={20} /> {error}
        </div>
      )}

      {/* 2. RESPONSIVE GRID (Stacks on mobile, side-by-side on desktop) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1">
        
        {/* LEFT PANE: Raw Input */}
        <div className="flex flex-col bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden focus-within:border-accent/50 transition-colors min-h-[400px] lg:min-h-[600px]">
          <div className="bg-gray-50 px-6 py-4 border-b border-gray-100 flex items-center gap-2 shrink-0">
            <FileText size={18} className="text-gray-400" />
            <h2 className="font-black text-navy text-[10px] uppercase tracking-[0.2em]">Client MSA / Agreement</h2>
          </div>
          <textarea 
            className="flex-1 w-full p-6 outline-none resize-none text-sm text-gray-700 leading-relaxed font-mono bg-transparent"
            placeholder="Paste the raw text of the contract here..."
            value={contractText}
            onChange={(e) => setContractText(e.target.value)}
          />
        </div>

        {/* RIGHT PANE: AI Audit Results */}
        <div className="flex flex-col bg-gray-50 rounded-2xl shadow-inner border border-gray-200 overflow-hidden min-h-[500px] lg:min-h-[600px] max-h-[800px] lg:max-h-none">
          <div className="bg-navy px-6 py-4 flex items-center justify-between shrink-0">
            <h2 className="font-bold text-white text-xs uppercase tracking-widest flex items-center gap-2">
              <ShieldAlert size={18} className="text-accent" /> Risk Analysis
            </h2>
            <span className="text-[10px] font-black text-white/40 bg-white/5 px-2 py-1 rounded-md border border-white/10 uppercase tracking-tighter shrink-0">Powered by Groq</span>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
            {!isAnalyzing && flags.length === 0 && !error && (
              <div className="h-full flex flex-col items-center justify-center text-gray-400 text-center p-8">
                <Scale size={48} className="mb-4 opacity-10" />
                <p className="font-bold text-navy/40 uppercase tracking-widest text-xs">Awaiting Input</p>
                <p className="text-sm mt-2 opacity-60 max-w-xs font-medium">Paste a contract and run the audit. The AI will flag toxic clauses and suggest protective counter-proposals.</p>
              </div>
            )}

            {isAnalyzing && (
              <div className="space-y-4 animate-pulse">
                {[1, 2, 3].map(i => (
                  <div key={i} className="bg-white p-6 rounded-xl border border-gray-100 space-y-3">
                    <div className="h-3 bg-gray-100 rounded w-1/4" />
                    <div className="h-16 bg-gray-50 rounded w-full" />
                    <div className="h-12 bg-gray-50/50 rounded w-full mt-4" />
                  </div>
                ))}
              </div>
            )}

            {!isAnalyzing && flags.map((flag, index) => (
              <div key={index} className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm hover:border-accent/30 transition-all duration-300">
                <div className={`px-4 py-2 border-b text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-2 ${
                  flag.risk === 'High' ? 'bg-red-50 text-red-700 border-red-100' : 
                  flag.risk === 'Medium' ? 'bg-orange-50 text-orange-700 border-orange-100' : 
                  'bg-yellow-50 text-yellow-700 border-yellow-100'
                }`}>
                  <AlertTriangle size={14} /> {flag.risk} Risk Liability
                </div>
                
                <div className="p-4 md:p-5 space-y-4">
                  <div>
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Problematic Clause</span>
                    <p className="text-xs text-gray-600 bg-gray-50 p-3 md:p-4 rounded-xl border border-gray-100 italic leading-relaxed break-words">
                      "{flag.clause}"
                    </p>
                  </div>
                  
                  <div>
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Architect Risk Assessment</span>
                    <p className="text-sm text-navy font-bold leading-snug">
                      {flag.reason}
                    </p>
                  </div>

                  <div className="pt-5 border-t border-gray-100">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-0 mb-3">
                      <span className="text-[10px] font-black text-accent uppercase tracking-widest">Suggested Counter-Proposal</span>
                      <button 
                        onClick={() => copyCounterProposal(flag.counter_proposal, index)}
                        className="text-[10px] font-black text-navy hover:text-accent flex items-center gap-1.5 transition-colors uppercase tracking-widest bg-gray-50 sm:bg-transparent px-3 py-1.5 sm:p-0 rounded-md sm:rounded-none"
                      >
                        {copiedIndex === index ? <CheckCircle2 size={12} className="text-green-500 shrink-0" /> : <Copy size={12} className="shrink-0" />}
                        {copiedIndex === index ? 'Copied' : 'Copy Override'}
                      </button>
                    </div>
                    <p className="text-sm text-gray-800 bg-accent/5 p-3 md:p-4 rounded-xl border border-accent/10 font-medium leading-relaxed break-words">
                      {flag.counter_proposal}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}