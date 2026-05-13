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
        <div className="p-8 space-y-10">
          
          {/* Document Header (Prepared For/By) */}
          <div className="flex flex-wrap gap-12 border-b border-gray-100 pb-8">
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Prepared For</p>
              <p className="font-bold text-navy text-lg">{proposal.clients?.company || proposal.clients?.name || 'Unknown Client'}</p>
              <p className="text-sm text-gray-500">{proposal.clients?.email || ''}</p>
            </div>
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Prepared By</p>
              <p className="font-bold text-navy text-lg">Omole Arch</p> 
            </div>
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Date</p>
              <p className="font-bold text-navy text-lg">{new Date(proposal.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
            </div>
          </div>

          {/* Dynamic Sections */}
          {[
            { id: '1.0', title: 'Executive Summary', content: proposal.executive_summary },
            { id: '2.0', title: 'Project Objectives', content: proposal.objectives },
            { id: '3.0', title: 'Proposed Solution', content: proposal.proposed_solution },
            { id: '4.0', title: 'Project Timeline', content: proposal.timeline },
            { id: '5.0', title: 'Estimated Budget', content: proposal.price ? `Estimated cost: $${proposal.price.toLocaleString()}\n\nFinal pricing depends on feature finalization.` : null },
            { id: '6.0', title: 'Deliverables', content: proposal.deliverables },
            { id: '7.0', title: 'Assumptions', content: proposal.assumptions },
            { id: '8.0', title: 'Additional Scope', content: proposal.description }
          ].map((section) => section.content && (
            <div key={section.id}>
              <h3 className="text-sm font-black text-navy uppercase tracking-widest mb-4 flex items-center gap-2">
                <span className="text-accent">{section.id}</span> {section.title}
              </h3>
              <div className="bg-gray-50/50 p-6 rounded-2xl text-navy font-medium whitespace-pre-wrap leading-relaxed border border-gray-100">
                {section.content}
              </div>
            </div>
          ))}

          {/* Display Attachment if it exists */}
          {proposal.attachment_url && (
            <div className="pt-8 border-t border-gray-100">
              <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                Attached Documents
              </h3>
              <a 
                href={proposal.attachment_url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-gray-50 border border-gray-200 text-navy font-bold text-sm px-4 py-3 rounded-xl hover:border-navy hover:bg-white transition-colors"
              >
                <FileText size={18} className="text-blue-500" />
                View Attached Document
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}