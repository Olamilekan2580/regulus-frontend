import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Download, CreditCard, Calendar, User, Link as LinkIcon, Check, ShieldCheck, AlertCircle } from 'lucide-react';
import api from '../lib/api';

export default function InvoiceView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchInvoice = async () => {
      try {
        // 🔒 THE FIX: Route through the public gateway
        const res = await api.get(`/public/invoices/${id}`); 
        
        // The public gateway returns { invoice, org }, so we extract the invoice here
        setInvoice(res.data?.invoice || res.data); 
      } catch (err) {
        console.error(err);
        setError('Failed to load invoice details.');
      } finally {
        setLoading(false);
      }
    };
    fetchInvoice();
  }, [id]);

  const handleCopyShareLink = () => {
    // This generates the link to the PUBLIC checkout route
    const publicUrl = `${window.location.origin}/pay/${id}`;
    navigator.clipboard.writeText(publicUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePreviewCheckout = () => {
    // Redirects you to see exactly what the client sees
    navigate(`/pay/${id}`);
  };

  if (loading) return <div className="flex h-full items-center justify-center text-navy"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-navy"></div></div>;

  if (error || !invoice) {
    return (
      <div className="flex flex-col items-center justify-center h-full space-y-4">
        <AlertCircle size={48} className="text-red-500" />
        <h2 className="text-xl font-bold text-navy">Invoice Not Found</h2>
        <button onClick={() => navigate('/invoices')} className="text-navy underline">Return to Invoices</button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-300">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <button 
          onClick={() => navigate('/invoices')}
          className="flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-navy transition-colors"
        >
          <ArrowLeft size={16} /> Back to List
        </button>

        <div className="flex items-center gap-3">
          <button 
            onClick={handleCopyShareLink}
            className="flex items-center gap-2 px-5 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-bold text-navy hover:border-navy transition-all active:scale-95 shadow-sm"
          >
            {copied ? <Check size={16} className="text-green-500" /> : <LinkIcon size={16} />}
            {copied ? 'Link Copied' : 'Copy Client Link'}
          </button>
          
          <button 
            onClick={handlePreviewCheckout}
            className="flex items-center gap-2 px-5 py-2.5 bg-navy text-white rounded-xl text-sm font-bold hover:bg-navy/90 transition-all active:scale-95 shadow-lg shadow-navy/10"
          >
            <ShieldCheck size={16} /> Preview Checkout
          </button>
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden">
        {/* Header Section */}
        <div className="bg-navy p-10 text-white flex flex-col md:flex-row justify-between items-start gap-6">
          <div>
            <span className={`text-[10px] uppercase tracking-widest px-3 py-1 rounded-full font-black mb-4 inline-block ${invoice.status === 'Paid' ? 'bg-accent text-navy' : 'bg-white/10 text-white'}`}>
              {invoice.status}
            </span>
            <h1 className="text-3xl font-black tracking-tight mb-2">Invoice {invoice.invoice_number}</h1>
            <div className="flex flex-wrap items-center gap-4 text-gray-300 text-sm font-medium mt-2">
              <span className="flex items-center gap-1.5"><User size={16} /> {invoice.clients?.company || invoice.clients?.name}</span>
              <span className="flex items-center gap-1.5"><Calendar size={16} /> Due {new Date(invoice.due_date).toLocaleDateString()}</span>
            </div>
          </div>
          <div className="text-left md:text-right">
            <p className="text-[10px] uppercase tracking-widest text-gray-400 font-bold mb-1">Total Balance</p>
            <div className="text-5xl font-black text-accent">
              {invoice.currency} {parseFloat(invoice.total).toLocaleString(undefined, {minimumFractionDigits: 2})}
            </div>
          </div>
        </div>

        {/* Info Bar */}
        <div className="px-10 py-6 bg-gray-50 flex flex-col sm:flex-row gap-6 items-center justify-between border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white rounded-lg border border-gray-200">
               <ShieldCheck size={20} className="text-green-500" />
            </div>
            <p className="text-xs font-bold text-gray-500">
              Payments are automatically routed to your connected {invoice.currency} vault.
            </p>
          </div>
          <div className="flex gap-3 w-full sm:w-auto">
            <button 
              onClick={() => window.print()}
              className="flex items-center justify-center gap-2 px-6 py-3 bg-white border border-gray-200 text-navy font-bold rounded-xl hover:border-navy transition-colors flex-1 sm:flex-none text-sm"
            >
              <Download size={18} /> Download PDF
            </button>
          </div>
        </div>

        {/* Line Items Preview */}
        <div className="p-10">
          <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-6">Service Breakdown</h3>
          <div className="space-y-4">
            {invoice.line_items?.map((item, idx) => (
              <div key={idx} className="flex justify-between items-center py-4 border-b border-gray-50 last:border-0">
                <div>
                  <p className="font-bold text-navy">{item.description}</p>
                  <p className="text-xs text-gray-400 font-medium">Quantity: {item.quantity} × {invoice.currency} {parseFloat(item.rate).toLocaleString()}</p>
                </div>
                <p className="font-black text-navy">{invoice.currency} {(item.quantity * item.rate).toLocaleString()}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {/* Alert for freelancers */}
      <div className="bg-blue-50 border border-blue-100 rounded-2xl p-6 flex items-start gap-4">
        <LinkIcon className="text-blue-500 shrink-0 mt-1" size={20} />
        <div>
          <h4 className="text-sm font-bold text-blue-900">Client Access Link</h4>
          <p className="text-sm text-blue-700 mt-1">
            Send the copied link to your client. They will see a whitelabeled payment portal with your brand colors where they can pay via card or bank transfer.
          </p>
        </div>
      </div>
    </div>
  );
}