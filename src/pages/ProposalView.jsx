import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, FileText, DollarSign, Calendar, Building, CheckCircle } from 'lucide-react';
import api from '../lib/api';

export default function ProposalView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [proposal, setProposal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchProposal = async () => {
      try {
        const res = await api.get(`/proposals/${id}`);
        // Handle both possible backend structures (wrapped or direct)
        const data = res.data?.data || res.data;
        setProposal(data);
      } catch (err) {
        console.error(err);
        setError('Failed to load proposal. It may have been deleted.');
      } finally {
        setLoading(false);
      }
    };
    fetchProposal();
  }, [id]);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center text-navy">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-navy"></div>
      </div>
    );
  }

  if (error || !proposal) {
    return (
      <div className="flex flex-col items-center justify-center h-full space-y-4">
        <h2 className="text-xl font-bold text-red-500">404: Proposal Not Found</h2>
        <button onClick={() => navigate('/proposals')} className="text-navy underline">Return to Proposals</button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-300">
      <button 
        onClick={() => navigate('/proposals')}
        className="flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-navy transition-colors"
      >
        <ArrowLeft size={16} /> Back to Proposals
      </button>

      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Header Section */}
        <div className="bg-navy p-8 text-white flex justify-between items-start">
          <div>
            <span className="text-[10px] uppercase tracking-widest bg-white/10 px-3 py-1 rounded-full font-bold mb-4 inline-block">
              {proposal.status}
            </span>
            <h1 className="text-3xl font-black tracking-tight mb-2">{proposal.title}</h1>
            <div className="flex items-center gap-2 text-gray-300 text-sm font-medium">
              <Calendar size={16} />
              Created {new Date(proposal.created_at).toLocaleDateString()}
            </div>
          </div>
          <div className="text-right">
            <p className="text-[10px] uppercase tracking-widest text-gray-400 font-bold mb-1">Estimated Value</p>
            <div className="text-3xl font-black text-accent flex items-center justify-end gap-1">
              <DollarSign size={24} />
              {proposal.price ? proposal.price.toLocaleString() : '0'}
            </div>
          </div>
        </div>

        {/* Content Section */}
        <div className="p-8 space-y-8">
          <div>
            <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
              <FileText size={16} /> Scope of Work
            </h3>
            <div className="bg-gray-50 p-6 rounded-2xl text-navy font-medium whitespace-pre-wrap leading-relaxed border border-gray-100">
              {proposal.description || "No description provided for this scope of work."}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}