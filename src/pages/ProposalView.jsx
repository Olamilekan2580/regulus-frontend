import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, FileText, DollarSign, Calendar, Building } from 'lucide-react';
import api from '../lib/api';

export default function ProposalView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [proposal, setProposal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // ARCHITECT FIX: Determine if this is a public client view or an internal admin view
  const isClientView = location.pathname.startsWith('/p/');

  useEffect(() => {
    const fetchProposal = async () => {
      try {
        // ARCHITECT FIX: Route the request to the public bypass endpoint
        const res = await api.get(`/public/proposals/${id}`);
        
        const data = res.data?.data || res.data;
        setProposal(data);
      } catch (err) {
        console.error(err);
        setError('Failed to load proposal. It may have been deleted or the URL is incorrect.');
      } finally {
        setLoading(false);
      }
    };
    fetchProposal();
  }, [id]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#0A0F1E]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00C896]"></div>
      </div>
    );
  }

  if (error || !proposal) {
    return (
      <div className="flex flex-col items-center justify-center h-screen space-y-4 bg-[#0A0F1E]">
        <h2 className="text-2xl font-black text-red-500">404: Proposal Not Found</h2>
        <p className="text-gray-400 font-medium">This document may have been revoked or deleted.</p>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${isClientView ? 'bg-[#0A0F1E] py-12 px-4' : ''}`}>
      <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-300">
        
        {/* ARCHITECT FIX: Hide the Back button from clients so they don't hit the AuthGuard */}
        {!isClientView && (
          <button 
            onClick={() => navigate('/proposals')}
            className="flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-navy transition-colors"
          >
            <ArrowLeft size={16} /> Back to Proposals
          </button>
        )}

        <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden">
          {/* Header Section */}
          <div className="bg-navy p-8 md:p-12 text-white flex flex-col md:flex-row justify-between items-start gap-6">
            <div>
              <span className="text-[10px] uppercase tracking-widest bg-white/10 px-3 py-1 rounded-full font-bold mb-4 inline-block">
                {proposal.status}
              </span>
              <h1 className="text-3xl md:text-4xl font-black tracking-tight mb-2 leading-tight">{proposal.title}</h1>
              <div className="flex items-center gap-2 text-gray-300 text-sm font-medium">
                <Calendar size={16} />
                Created {new Date(proposal.created_at).toLocaleDateString()}
              </div>
            </div>
            <div className="md:text-right shrink-0">
              <p className="text-[10px] uppercase tracking-widest text-[#00C896] font-black mb-1">Estimated Value</p>
              <div className="text-3xl md:text-4xl font-black text-white flex items-center md:justify-end gap-1">
                <DollarSign size={28} className="text-[#00C896]" />
                {proposal.price ? proposal.price.toLocaleString() : '0'}
              </div>
            </div>
          </div>

          {/* Content Section */}
          <div className="p-8 md:p-12 space-y-12">
            
            {/* Document Header (Prepared For/By) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 border-b border-gray-100 pb-8">
              <div>
                <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                  <Building size={14} /> Prepared For
                </p>
                <p className="font-black text-navy text-xl">{proposal.clients?.company || proposal.clients?.name || 'Unknown Client'}</p>
                <p className="text-sm text-gray-500 font-medium mt-1">{proposal.clients?.email || ''}</p>
              </div>
              <div>
                <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                  <Building size={14} /> Prepared By
                </p>
                <p className="font-black text-navy text-xl">Akeem Omole</p> 
                <p className="text-sm text-gray-500 font-medium mt-1">Cloud-Native Systems Architect</p>
              </div>
              <div>
                <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Valid Until</p>
                <p className="font-black text-navy text-xl">
                  {new Date(new Date(proposal.created_at).setDate(new Date(proposal.created_at).getDate() + 14)).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
                </p>
              </div>
            </div>

            {/* Dynamic Sections */}
            {[
              { id: '1.0', title: 'Executive Summary', content: proposal.executive_summary },
              { id: '2.0', title: 'Project Objectives', content: proposal.objectives },
              { id: '3.0', title: 'Proposed Solution', content: proposal.proposed_solution },
              { id: '4.0', title: 'Project Timeline', content: proposal.timeline },
              { id: '5.0', title: 'Estimated Budget', content: proposal.price ? `Estimated base investment: $${proposal.price.toLocaleString()}\n\nFinal pricing is subject to feature finalization.` : null },
              { id: '6.0', title: 'Deliverables', content: proposal.deliverables },
              { id: '7.0', title: 'Assumptions', content: proposal.assumptions },
              { id: '8.0', title: 'Additional Scope', content: proposal.description }
            ].map((section) => section.content && (
              <div key={section.id}>
                <h3 className="text-sm font-black text-navy uppercase tracking-widest mb-4 flex items-center gap-2 border-b border-gray-100 pb-2">
                  <span className="text-[#00C896]">{section.id}</span> {section.title}
                </h3>
                <div className="bg-gray-50/50 p-6 md:p-8 rounded-2xl text-gray-700 font-medium whitespace-pre-wrap leading-relaxed border border-gray-100 shadow-sm">
                  {section.content}
                </div>
              </div>
            ))}

            {/* Display Attachment if it exists */}
            {proposal.attachment_url && (
              <div className="pt-8 border-t border-gray-100">
                <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-4">
                  Attached Documents
                </h3>
                <a 
                  href={proposal.attachment_url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-3 bg-[#0A0F1E] text-white font-bold text-sm px-6 py-4 rounded-xl hover:bg-[#0A0F1E]/90 transition-colors shadow-lg shadow-navy/10 active:scale-95"
                >
                  <FileText size={18} className="text-[#00C896]" />
                  View Additional Documentation
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}