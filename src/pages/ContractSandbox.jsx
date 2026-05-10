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
    
    setIsAnalyzing(true);
    setError(null);
    setFlags([]);

    try {
      const res = await api.post('/contracts/analyze', { contract_text: contractText });
      setFlags(res.data.flags || []);
    } catch (err) {
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
    <div className="space-y-6 h-[calc(100vh-8rem)] flex flex-col">
      <div className="flex justify-between items-center shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-navy flex items-center gap-2">
            <Scale className="text-accent" /> AI Contract Sandbox
          </h1>
          <p className="text-sm text-gray-500 mt-1">Audit MSAs for scope creep, IP theft, and liability risks.</p>
        </div>
        <button 
          onClick={handleAnalyze}
          disabled={isAnalyzing || !contractText.trim()}
          className="flex items-center gap-2 bg-navy text-white px-6 py-2.5 rounded-xl font-bold shadow-sm hover:bg-navy/90 disabled:opacity-50 transition-all active:scale-95"
        >
          {isAnalyzing ? (
            <><div className="w-4 h-4 border-2 border-white/30 border-t-white animate-spin rounded-full" /> Auditing Clauses...</>
          ) : (
            <><Zap size={18} /> Run Legal Audit</>
          )}
        </button>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-xl border border-red-100 flex items-center gap-3 font-medium shrink-0">
          <AlertTriangle size={20} /> {error}
        </div>
      )}

      {/* Split Screen Engine */}
      <div className="flex gap-6 flex-1 min-h-0">
        
        {/* LEFT PANE: Raw Input */}
        <div className="flex-1 flex flex-col bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="bg-gray-50 px-6 py-4 border-b border-gray-100 flex items-center gap-2">
            <FileText size={18} className="text-gray-400" />
            <h2 className="font-bold text-navy text-sm uppercase tracking-wider">Client MSA / Agreement</h2>
          </div>
          <textarea 
            className="flex-1 w-full p-6 outline-none resize-none text-sm text-gray-700 leading-relaxed font-mono"
            placeholder="Paste the raw text of the contract here..."
            value={contractText}
            onChange={(e) => setContractText(e.target.value)}
          />
        </div>

        {/* RIGHT PANE: AI Audit Results */}
        <div className="flex-1 flex flex-col bg-gray-50 rounded-2xl shadow-inner border border-gray-200 overflow-hidden">
          <div className="bg-gray-900 px-6 py-4 flex items-center justify-between">
            <h2 className="font-bold text-white text-sm uppercase tracking-wider flex items-center gap-2">
              <ShieldAlert size={18} className="text-accent" /> Risk Analysis
            </h2>
            <span className="text-xs font-bold text-gray-400 bg-gray-800 px-2 py-1 rounded-md">Powered by Groq</span>
          </div>
          
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {!isAnalyzing && flags.length === 0 && !error && (
              <div className="h-full flex flex-col items-center justify-center text-gray-400 text-center">
                <Scale size={48} className="mb-4 opacity-20" />
                <p className="font-medium">Paste a contract and run the audit.</p>
                <p className="text-sm mt-2 opacity-60 max-w-xs">The AI will flag toxic clauses and suggest protective counter-proposals.</p>
              </div>
            )}

            {isAnalyzing && (
              <div className="space-y-4 animate-pulse">
                {[1, 2, 3].map(i => (
                  <div key={i} className="bg-white p-6 rounded-xl border border-gray-100 space-y-3">
                    <div className="h-4 bg-gray-200 rounded w-1/4" />
                    <div className="h-20 bg-gray-100 rounded w-full" />
                    <div className="h-10 bg-gray-50 rounded w-full mt-4" />
                  </div>
                ))}
              </div>
            )}

            {!isAnalyzing && flags.map((flag, index) => (
              <div key={index} className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm hover:border-accent/30 transition-colors">
                <div className={`px-4 py-2 border-b text-xs font-black uppercase tracking-wider flex items-center gap-2 ${
                  flag.risk === 'High' ? 'bg-red-50 text-red-700 border-red-100' : 
                  flag.risk === 'Medium' ? 'bg-orange-50 text-orange-700 border-orange-100' : 
                  'bg-yellow-50 text-yellow-700 border-yellow-100'
                }`}>
                  <AlertTriangle size={14} /> {flag.risk} Risk Liability
                </div>
                
                <div className="p-5 space-y-4">
                  <div>
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">Problematic Clause</span>
                    <p className="text-sm text-gray-800 bg-red-50/50 p-3 rounded-lg border border-red-100/50 italic">
                      "{flag.clause}"
                    </p>
                  </div>
                  
                  <div>
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">Architect Risk Assessment</span>
                    <p className="text-sm text-gray-600 font-medium">
                      {flag.reason}
                    </p>
                  </div>

                  <div className="pt-4 border-t border-gray-100">
                    <div className="flex justify-between items-end mb-2">
                      <span className="text-[10px] font-black text-accent uppercase tracking-widest">Suggested Counter-Proposal</span>
                      <button 
                        onClick={() => copyCounterProposal(flag.counter_proposal, index)}
                        className="text-xs font-bold text-navy hover:text-accent flex items-center gap-1 transition-colors"
                      >
                        {copiedIndex === index ? <CheckCircle2 size={14} className="text-green-500" /> : <Copy size={14} />}
                        {copiedIndex === index ? 'Copied!' : 'Copy Override'}
                      </button>
                    </div>
                    <p className="text-sm text-gray-800 bg-green-50/50 p-3 rounded-lg border border-green-100/50 font-medium">
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