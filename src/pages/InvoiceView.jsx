import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Download, CreditCard, Calendar, User, FileText } from 'lucide-react';
import api from '../lib/api';

export default function InvoiceView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchInvoice = async () => {
      try {
        const res = await api.get(`/invoices/${id}`);
        setInvoice(res.data?.data || res.data);
      } catch (err) {
        console.error(err);
        setError('Failed to load invoice. It may have been deleted.');
      } finally {
        setLoading(false);
      }
    };
    fetchInvoice();
  }, [id]);

  const handleCheckout = async () => {
    setCheckoutLoading(true);
    try {
      // Fires the Stripe Session creation on your backend
      const res = await api.post(`/invoices/${id}/checkout`);
      if (res.data?.url) {
        window.location.href = res.data.url; // Redirect to Stripe
      } else {
        throw new Error('No checkout URL returned.');
      }
    } catch (err) {
      console.error('Checkout error:', err);
      alert('Payment gateway failed to initialize.');
      setCheckoutLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center text-navy">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-navy"></div>
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className="flex flex-col items-center justify-center h-full space-y-4">
        <h2 className="text-xl font-bold text-red-500">404: Invoice Not Found</h2>
        <button onClick={() => navigate('/invoices')} className="text-navy underline">Return to Invoices</button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in duration-300">
      <button 
        onClick={() => navigate('/invoices')}
        className="flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-navy transition-colors"
      >
        <ArrowLeft size={16} /> Back to Invoices
      </button>

      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Header Section */}
        <div className="bg-navy p-8 text-white flex justify-between items-start">
          <div>
            <span className="text-[10px] uppercase tracking-widest bg-white/10 px-3 py-1 rounded-full font-bold mb-4 inline-block">
              {invoice.status}
            </span>
            <h1 className="text-3xl font-black tracking-tight mb-2">Invoice {invoice.invoice_number || id.substring(0,8).toUpperCase()}</h1>
            <div className="flex items-center gap-4 text-gray-300 text-sm font-medium mt-2">
              <span className="flex items-center gap-1.5"><User size={16} /> {invoice.clients?.company || invoice.clients?.name || 'Unknown Client'}</span>
              <span className="flex items-center gap-1.5"><Calendar size={16} /> Due {new Date(invoice.due_date).toLocaleDateString()}</span>
            </div>
          </div>
          <div className="text-right">
            <p className="text-[10px] uppercase tracking-widest text-gray-400 font-bold mb-1">Total Due</p>
            <div className="text-4xl font-black text-accent">
              ${invoice.total ? parseFloat(invoice.total).toLocaleString(undefined, {minimumFractionDigits: 2}) : '0.00'}
            </div>
          </div>
        </div>

        {/* Action Section */}
        <div className="p-8 bg-gray-50 flex flex-col sm:flex-row gap-4 items-center justify-between border-b border-gray-100">
          <p className="text-sm font-medium text-gray-500">
            Secure payment processed via Stripe.
          </p>
          <div className="flex gap-3 w-full sm:w-auto">
            {invoice.pdf_url && (
              <a 
                href={invoice.pdf_url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 px-6 py-3 bg-white border border-gray-200 text-navy font-bold rounded-xl hover:border-navy transition-colors flex-1 sm:flex-none"
              >
                <Download size={18} /> Download PDF
              </a>
            )}
            
            {invoice.status !== 'Paid' && (
              <button 
                onClick={handleCheckout}
                disabled={checkoutLoading}
                className="flex items-center justify-center gap-2 px-8 py-3 bg-accent text-navy font-black rounded-xl hover:bg-[#00b386] transition-colors shadow-sm active:scale-95 disabled:opacity-70 flex-1 sm:flex-none"
              >
                {checkoutLoading ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-navy/20 border-t-navy"></div>
                ) : (
                  <><CreditCard size={18} /> Pay Now</>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}