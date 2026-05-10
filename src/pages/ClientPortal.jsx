import { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { CheckCircle, FileText, FileSignature, CreditCard, Clock } from 'lucide-react';
import { usePaystackPayment } from 'react-paystack';
import axios from 'axios';

// ==========================================
// 1. DYNAMIC INVOICE CHECKOUT COMPONENT
// ==========================================
const PayButton = ({ invoice, client, settings, onPaymentSuccess }) => {
  const [isLoading, setIsLoading] = useState(false);

  if (invoice.status === 'Paid') return <span className="px-3 py-1 bg-green-100 text-green-700 rounded text-xs font-bold shadow-sm border border-green-200">Paid</span>;

  const handleStripe = async () => {
    setIsLoading(true);
    try {
      const res = await axios.post(`${import.meta.env.VITE_API_URL}/public/invoices/${invoice.id}/stripe-checkout`);
      window.location.href = res.data.url; 
    } catch (err) {
      alert(err.response?.data?.error || 'Payment failed to initialize.');
      setIsLoading(false);
    }
  };

  const paystackConfig = {
    reference: `INV_${(new Date()).getTime().toString()}`,
    email: client.email || 'billing@client.com',
    amount: Math.round(parseFloat(invoice.total) * 100),
    currency: invoice.currency || 'USD', // Adjust for NGN if needed
    publicKey: settings.paystack_public_key || '',
  };
  const initializePaystack = usePaystackPayment(paystackConfig);

  if (!settings.provider) return <span className="text-xs text-red-500 font-bold">Gateway Not Configured</span>;

  if (settings.provider === 'stripe') {
    return (
      <button onClick={handleStripe} disabled={isLoading} style={{ backgroundColor: settings.brand_color || '#1E293B' }} className="flex items-center gap-2 text-white px-5 py-2.5 rounded-xl text-sm hover:shadow-lg transition-all active:scale-95 font-bold shadow-sm disabled:opacity-50">
        <CreditCard size={18} /> {isLoading ? 'Connecting...' : 'Pay with Stripe'}
      </button>
    );
  }

  if (settings.provider === 'paystack') {
    if (!settings.paystack_public_key) return <span className="text-xs text-red-500 font-bold">Missing Paystack Key</span>;
    return (
      <button onClick={() => initializePaystack({ onSuccess: (transaction) => onPaymentSuccess(invoice.id, transaction.reference, 'paystack', 'invoice'), onClose: () => {} })} style={{ backgroundColor: settings.brand_color || '#1E293B' }} className="flex items-center gap-2 text-white px-5 py-2.5 rounded-xl text-sm hover:shadow-lg transition-all active:scale-95 font-bold shadow-sm">
        <CreditCard size={18} /> Pay with Paystack
      </button>
    );
  }

  return <span className="text-xs text-red-500 font-bold">Invalid Provider</span>;
};

// ==========================================
// 2. DYNAMIC PROPOSAL CHECKOUT COMPONENT
// ==========================================
const ProposalPayButton = ({ proposal, client, settings, onPaymentSuccess, onDecline }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isDeclining, setIsDeclining] = useState(false);

  const handleStripe = async () => {
    setIsLoading(true);
    try {
      // Hits the public Stripe endpoint for Proposals
      const res = await axios.post(`${import.meta.env.VITE_API_URL}/public/proposals/${proposal.id}/stripe-checkout`);
      window.location.href = res.data.url; 
    } catch (err) {
      alert(err.response?.data?.error || 'Payment failed to initialize.');
      setIsLoading(false);
    }
  };

  const paystackConfig = {
    reference: `PROP_${(new Date()).getTime().toString()}`,
    email: client.email || 'billing@client.com',
    amount: Math.round(parseFloat(proposal.price) * 100),
    currency: 'USD', // Adjust this if your freelancers bill in NGN
    publicKey: settings.paystack_public_key || '',
  };
  const initializePaystack = usePaystackPayment(paystackConfig);

  const handleDecline = async () => {
    setIsDeclining(true);
    await onDecline(proposal.id, 'Rejected');
    setIsDeclining(false);
  };

  return (
    <div className="flex gap-4 mt-8">
      {settings.provider === 'stripe' && (
        <button onClick={handleStripe} disabled={isLoading || isDeclining} className="flex-1 bg-green-500 text-white py-4 rounded-xl font-bold hover:bg-green-600 transition-colors shadow-sm disabled:opacity-50 hover:shadow-lg hover:shadow-green-500/20 active:scale-95 flex justify-center items-center gap-2">
          <CreditCard size={20} /> {isLoading ? 'Connecting...' : 'Approve & Pay Deposit (Stripe)'}
        </button>
      )}

      {settings.provider === 'paystack' && (
        <button onClick={() => initializePaystack({ onSuccess: (transaction) => onPaymentSuccess(proposal.id, transaction.reference, 'paystack', 'proposal'), onClose: () => {} })} disabled={isLoading || isDeclining} className="flex-1 bg-green-500 text-white py-4 rounded-xl font-bold hover:bg-green-600 transition-colors shadow-sm disabled:opacity-50 hover:shadow-lg hover:shadow-green-500/20 active:scale-95 flex justify-center items-center gap-2">
          <CreditCard size={20} /> {isLoading ? 'Processing...' : 'Approve & Pay Deposit (Paystack)'}
        </button>
      )}

      {!settings.provider && (
        <div className="flex-1 bg-red-50 text-red-500 py-4 rounded-xl font-bold border border-red-100 flex justify-center items-center">
          Payment Gateway Not Configured
        </div>
      )}

      <button onClick={handleDecline} disabled={isLoading || isDeclining} className="px-8 py-4 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200 transition-colors disabled:opacity-50 active:scale-95">
        {isDeclining ? 'Declining...' : 'Decline'}
      </button>
    </div>
  );
};


// ==========================================
// 3. MAIN PORTAL COMPONENT
// ==========================================
export default function ClientPortal() {
  const { token } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const [data, setData] = useState(null);

  useEffect(() => {
    axios.get(`${import.meta.env.VITE_API_URL}/public/portal/${token}`)
      .then(res => setData(res.data)).catch(() => setData('error'));
  }, [token]);

  // Stripe Redirect Catcher
  useEffect(() => {
    const success = searchParams.get('success');
    const invoiceId = searchParams.get('invoice_id');
    const proposalId = searchParams.get('proposal_id');
    const sessionId = searchParams.get('session_id');

    if (success === 'true' && sessionId && data) {
      setSearchParams({});
      if (invoiceId) {
        handlePaymentSuccess(invoiceId, sessionId, 'stripe', 'invoice');
      } else if (proposalId) {
        handlePaymentSuccess(proposalId, sessionId, 'stripe', 'proposal');
      }
    }
  }, [searchParams, data, setSearchParams]);

  const handleDeclineProposal = async (proposalId, newStatus) => {
    try {
      await axios.put(`${import.meta.env.VITE_API_URL}/public/proposals/${proposalId}/status`, { status: newStatus });
      setData(prev => ({
        ...prev,
        proposals: prev.proposals.map(p => p.id === proposalId ? { ...p, status: newStatus } : p)
      }));
    } catch (err) {
      alert('Failed to update proposal status.');
    }
  };

  const handlePaymentSuccess = async (id, transactionId, provider, type = 'invoice') => {
    try {
      // Optimistic UI Update based on document type
      if (type === 'invoice') {
        setData(prev => ({
          ...prev,
          invoices: prev.invoices.map(inv => inv.id === id ? { ...inv, status: 'Paid' } : inv)
        }));
      } else {
        setData(prev => ({
          ...prev,
          proposals: prev.proposals.map(prop => prop.id === id ? { ...prop, status: 'Approved' } : prop)
        }));
      }

      // Background Verification Route
      const route = provider === 'stripe' ? 'verify-stripe' : 'verify-paystack';
      const endpoint = type === 'invoice' ? `/public/invoices/${id}/${route}` : `/public/proposals/${id}/${route}`;
      const payload = provider === 'stripe' ? { session_id: transactionId } : { reference: transactionId };

      await axios.post(`${import.meta.env.VITE_API_URL}${endpoint}`, payload);
    } catch (err) {
      console.error('Payment verification warning:', err);
    }
  };

  if (!data) return <div className="min-h-screen flex items-center justify-center text-gray-500 font-medium">Loading secure portal...</div>;
  if (data === 'error') return <div className="min-h-screen flex items-center justify-center text-red-500 font-medium">Invalid or expired secure link.</div>;

  const { client, projects = [], invoices = [], proposals = [], settings } = data;

  return (
    <div className="min-h-screen bg-gray-50/50 py-12 px-4">
      <div className="max-w-4xl mx-auto space-y-12 animate-in fade-in duration-500">
        
        {/* Header */}
        <div className="flex justify-between items-end border-b border-gray-200 pb-6">
          <div>
            <h1 className="text-3xl font-black tracking-tight" style={{ color: settings.brand_color || '#1E293B' }}>
              {client.company || client.name}
            </h1>
            <p className="text-gray-500 mt-1 font-bold uppercase tracking-widest text-xs">Client Collaboration Portal</p>
          </div>
          <div className="text-right">
            <div className="font-black text-xl tracking-tight" style={{ color: settings.brand_color || '#1E293B' }}>
              {settings.brand_name || 'Regulus.'}
            </div>
          </div>
        </div>

        {/* PROPOSALS SECTION */}
        {proposals.length > 0 && (
          <section>
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2" style={{ color: settings.brand_color || '#1E293B' }}>
              <FileSignature size={24} /> Pending Proposals
            </h2>
            <div className="space-y-6">
              {proposals.map(prop => (
                <div key={prop.id} className="bg-white p-8 rounded-3xl shadow-sm border border-gray-200">
                  <div className="flex justify-between items-start mb-6 border-b border-gray-100 pb-6">
                    <div>
                      <h3 className="text-2xl font-black text-gray-900 tracking-tight">{prop.title || 'Project Proposal'}</h3>
                      <p className="text-gray-500 mt-1 font-medium flex items-center gap-1.5">
                        Scope of Work & Pricing
                      </p>
                    </div>
                    <span className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                      prop.status === 'Approved' ? 'bg-green-100 text-green-700 border border-green-200' :
                      prop.status === 'Rejected' ? 'bg-red-100 text-red-700 border border-red-200' :
                      'bg-gray-100 text-gray-700 border border-gray-200'
                    }`}>
                      {prop.status || 'Awaiting Review'}
                    </span>
                  </div>
                  
                  <div className="prose prose-sm max-w-none text-gray-600 mb-8 whitespace-pre-wrap leading-relaxed font-medium">
                    {prop.description || 'No scope details provided.'}
                  </div>
                  
                  <div className="flex items-center justify-between bg-gray-50 p-6 rounded-2xl border border-gray-100">
                    <div>
                      <p className="text-xs text-gray-500 font-bold uppercase tracking-widest mb-1">Investment</p>
                      <p className="text-3xl font-black text-gray-900">${prop.price}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-500 font-bold uppercase tracking-widest mb-1">Timeline</p>
                      <p className="text-lg font-bold text-gray-700 flex items-center gap-1.5 justify-end">
                        <Clock size={16} className="text-gray-400" /> {prop.timeline}
                      </p>
                    </div>
                  </div>

                  {(prop.status === 'Draft' || prop.status === 'Sent' || !prop.status) && (
                    <ProposalPayButton 
                      proposal={prop}
                      client={client}
                      settings={settings}
                      onPaymentSuccess={handlePaymentSuccess}
                      onDecline={handleDeclineProposal}
                    />
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
              <p className="text-gray-500 font-medium bg-white p-6 rounded-2xl border border-gray-100">No active projects currently.</p>
            ) : projects.map(proj => (
              <div key={proj.id} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex justify-between items-center hover:shadow-md transition-all">
                <div>
                  <h3 className="font-bold text-lg text-gray-900">{proj.name}</h3>
                  <p className="text-sm text-gray-500 mt-1 line-clamp-1 font-medium">{proj.description}</p>
                </div>
                <span className="px-4 py-1.5 bg-blue-50 text-blue-700 border border-blue-100 rounded-full text-xs font-bold uppercase tracking-wider">{proj.status}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Invoices & Billing */}
        <section>
          <h2 className="text-xl font-bold mb-6 flex items-center gap-2" style={{ color: settings.brand_color || '#1E293B' }}>
            <FileText size={24} /> Invoices & Billing
          </h2>
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
            {invoices.length === 0 ? (
              <p className="text-gray-500 font-medium p-8">No pending invoices.</p>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="px-8 py-5 text-xs font-black text-gray-500 uppercase tracking-widest">Invoice No.</th>
                    <th className="px-8 py-5 text-xs font-black text-gray-500 uppercase tracking-widest">Amount</th>
                    <th className="px-8 py-5 text-right text-xs font-black text-gray-500 uppercase tracking-widest">Status / Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {invoices.map(inv => (
                    <tr key={inv.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-8 py-6 font-bold text-gray-900">{inv.invoice_number}</td>
                      <td className="px-8 py-6 text-gray-600 font-black">${inv.total}</td>
                      <td className="px-8 py-6 text-right flex justify-end">
                        <PayButton 
                          invoice={inv} 
                          client={client} 
                          settings={settings} 
                          onPaymentSuccess={handlePaymentSuccess} 
                        />
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