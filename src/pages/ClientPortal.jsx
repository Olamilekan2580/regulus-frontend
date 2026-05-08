import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { CheckCircle, FileText, FileSignature, CreditCard, Clock } from 'lucide-react';
import { usePaystackPayment } from 'react-paystack';
import axios from 'axios';

const PayButton = ({ invoice, client, settings }) => {
  if (!settings.paystack_public_key) return <span className="text-xs text-red-500 font-bold">Setup Incomplete</span>;

  const config = {
    reference: (new Date()).getTime().toString(),
    email: client.email || 'billing@client.com',
    amount: parseFloat(invoice.total) * 100,
    publicKey: settings.paystack_public_key,
    metadata: {
      invoice_id: invoice.id,
      freelancer_id: client.freelancer_id 
    }
  };

  const initializePayment = usePaystackPayment(config);

  if (invoice.status === 'Paid') return <span className="px-3 py-1 bg-green-100 text-green-700 rounded text-xs font-bold">Paid</span>;

  return (
    <button 
      onClick={() => initializePayment(() => window.location.reload(), () => console.log('Closed'))}
      style={{ backgroundColor: settings.brand_color || '#1E293B' }}
      className="flex items-center gap-2 text-white px-4 py-2 rounded-lg text-sm hover:opacity-90 transition-opacity font-medium shadow-sm"
    >
      <CreditCard size={16} /> Pay Now
    </button>
  );
};

export default function ClientPortal() {
  const { token } = useParams();
  const [data, setData] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);

  useEffect(() => {
    axios.get(`${import.meta.env.VITE_API_URL}/public/portal/${token}`)
      .then(res => setData(res.data)).catch(() => setData('error'));
  }, [token]);

  // NEW: Client Proposal Action Handler
  const handleProposalAction = async (proposalId, newStatus) => {
    setUpdatingId(proposalId);
    try {
      // Hits your backend to update the status
      await axios.put(`${import.meta.env.VITE_API_URL}/public/proposals/${proposalId}/status`, { status: newStatus });
      // Optimistically update the UI so they don't have to refresh
      setData(prev => ({
        ...prev,
        proposals: prev.proposals.map(p => p.id === proposalId ? { ...p, status: newStatus } : p)
      }));
    } catch (err) {
      alert('Failed to update proposal status. Please try again.');
    } finally {
      setUpdatingId(null);
    }
  };

  if (!data) return <div className="min-h-screen flex items-center justify-center text-gray-500 font-medium">Loading secure portal...</div>;
  if (data === 'error') return <div className="min-h-screen flex items-center justify-center text-red-500 font-medium">Invalid or expired secure link.</div>;

  // NEW: Added proposals to the destructured data (defaulting to empty array if backend doesn't send it yet)
  const { client, projects = [], invoices = [], proposals = [], settings } = data;

  return (
    <div className="min-h-screen bg-gray-50/50 py-12 px-4">
      <div className="max-w-4xl mx-auto space-y-12">
        
        {/* Header */}
        <div className="flex justify-between items-end border-b border-gray-200 pb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight" style={{ color: settings.brand_color || '#1E293B' }}>
              {client.company || client.name}
            </h1>
            <p className="text-gray-500 mt-1 font-medium">Client Collaboration Portal</p>
          </div>
          <div className="text-right">
            <div className="font-bold text-xl tracking-tight" style={{ color: settings.brand_color || '#1E293B' }}>
              {settings.brand_name || 'Regulus.'}
            </div>
          </div>
        </div>

        {/* NEW: PROPOSALS SECTION (Placed at the very top so it's the first thing they see) */}
        {proposals.length > 0 && (
          <section>
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2" style={{ color: settings.brand_color || '#1E293B' }}>
              <FileSignature size={24} /> Pending Proposals
            </h2>
            <div className="space-y-6">
              {proposals.map(prop => (
                <div key={prop.id} className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200">
                  <div className="flex justify-between items-start mb-6 border-b border-gray-100 pb-6">
                    <div>
                      <h3 className="text-2xl font-bold text-gray-900 tracking-tight">{prop.title || 'Project Proposal'}</h3>
                      <p className="text-gray-500 mt-1 font-medium flex items-center gap-1.5">
                        Scope of Work & Pricing
                      </p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                      prop.status === 'Approved' ? 'bg-green-100 text-green-700' :
                      prop.status === 'Rejected' ? 'bg-red-100 text-red-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {prop.status || 'Awaiting Review'}
                    </span>
                  </div>
                  
                  {/* The Full Description */}
                  <div className="prose prose-sm max-w-none text-gray-600 mb-8 whitespace-pre-wrap leading-relaxed">
                    {prop.description || 'No scope details provided.'}
                  </div>
                  
                  {/* The Terms Box */}
                  <div className="flex items-center justify-between bg-gray-50 p-6 rounded-xl border border-gray-100">
                    <div>
                      <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-1">Investment</p>
                      <p className="text-3xl font-bold text-gray-900">${prop.price}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-1">Timeline</p>
                      <p className="text-lg font-medium text-gray-700 flex items-center gap-1.5 justify-end">
                        <Clock size={16} /> {prop.timeline}
                      </p>
                    </div>
                  </div>

                  {/* Interactive Action Buttons */}
                  {(prop.status === 'Draft' || prop.status === 'Sent' || !prop.status) && (
                    <div className="flex gap-3 mt-8">
                      <button 
                        onClick={() => handleProposalAction(prop.id, 'Approved')}
                        disabled={updatingId === prop.id}
                        className="flex-1 bg-green-600 text-white py-3.5 rounded-xl font-bold hover:bg-green-700 transition-colors shadow-sm disabled:opacity-50"
                      >
                        {updatingId === prop.id ? 'Processing...' : 'Approve & Start Project'}
                      </button>
                      <button 
                        onClick={() => handleProposalAction(prop.id, 'Rejected')}
                        disabled={updatingId === prop.id}
                        className="px-6 py-3.5 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200 transition-colors disabled:opacity-50"
                      >
                        Decline
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Active Projects */}
        <section>
          <h2 className="text-xl font-bold mb-6 flex items-center gap-2" style={{ color: settings.brand_color || '#1E293B' }}>
            <CheckCircle size={24} className="text-green-500" /> Active Projects
          </h2>
          <div className="grid gap-4">
            {projects.length === 0 ? (
              <p className="text-gray-500 italic bg-white p-6 rounded-xl border border-gray-100">No active projects currently.</p>
            ) : projects.map(proj => (
              <div key={proj.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex justify-between items-center hover:shadow-md transition-shadow">
                <div>
                  <h3 className="font-bold text-lg text-gray-900">{proj.name}</h3>
                  <p className="text-sm text-gray-500 mt-1 line-clamp-1">{proj.description}</p>
                </div>
                <span className="px-3 py-1 bg-blue-50 text-blue-700 border border-blue-100 rounded-full text-xs font-bold uppercase tracking-wider">{proj.status}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Invoices & Billing */}
        <section>
          <h2 className="text-xl font-bold mb-6 flex items-center gap-2" style={{ color: settings.brand_color || '#1E293B' }}>
            <FileText size={24} /> Invoices & Billing
          </h2>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            {invoices.length === 0 ? (
              <p className="text-gray-500 italic p-6">No pending invoices.</p>
            ) : (
              <table className="w-full text-left">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Invoice No.</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Amount</th>
                    <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Status / Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {invoices.map(inv => (
                    <tr key={inv.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-5 font-bold text-gray-900">{inv.invoice_number}</td>
                      <td className="px-6 py-5 text-gray-600 font-medium">${inv.total}</td>
                      <td className="px-6 py-5 text-right flex justify-end">
                        <PayButton invoice={inv} client={client} settings={settings} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}