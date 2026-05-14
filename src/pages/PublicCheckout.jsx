import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { CreditCard, CheckCircle2, ShieldCheck, Receipt, AlertCircle, Download, Calendar, User } from 'lucide-react';
import api from '../lib/api';

export default function PublicCheckout() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchInvoice = async () => {
      try {
        // 🔒 Uses the PUBLIC route (No login required)
        const res = await api.get(`/public/invoices/${id}`);
        setData(res.data);
      } catch (err) {
        setError('Invoice not found or already settled.');
      } finally {
        setLoading(false);
      }
    };
    fetchInvoice();
  }, [id]);

  const handlePayment = async () => {
    setIsProcessing(true);
    try {
      // 🚀 Fires the FLUTTERWAVE split-payment engine
      const res = await api.post(`/public/invoices/${id}/flutterwave-checkout`);
      if (res.data?.url) {
        window.location.href = res.data.url;
      }
    } catch (err) {
      alert(err.response?.data?.error || 'Payment gateway failed to initialize.');
    } finally {
      setIsProcessing(false);
    }
  };

  if (loading) return <div className="h-screen flex items-center justify-center"><div className="animate-spin w-8 h-8 border-2 border-navy border-t-transparent rounded-full" /></div>;
  if (error) return <div className="h-screen flex flex-col items-center justify-center gap-4 p-6 text-center"><AlertCircle size={48} className="text-red-500"/><h2 className="text-2xl font-bold text-navy">{error}</h2></div>;

  const { invoice, org } = data;
  const brand = org.brand_settings || {};

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-white rounded-[2.5rem] shadow-2xl overflow-hidden border border-gray-100">
        
        {/* Dynamic Header: Uses Freelancer's Brand Color */}
        <div className="p-10 text-white relative overflow-hidden" style={{ backgroundColor: brand.primary || '#0A0F1E' }}>
          <div className="relative z-10 flex justify-between items-start">
            <div>
              <span className="text-[10px] font-black uppercase tracking-[0.2em] bg-white/10 px-3 py-1 rounded-full mb-4 inline-block">
                {invoice.status}
              </span>
              <h1 className="text-3xl font-black tracking-tight">{org.name}</h1>
              <div className="flex items-center gap-4 text-white/60 text-sm font-medium mt-3">
                <span className="flex items-center gap-1.5"><Receipt size={16} /> #{invoice.invoice_number}</span>
                <span className="flex items-center gap-1.5"><Calendar size={16} /> Due {new Date(invoice.due_date).toLocaleDateString()}</span>
              </div>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 mb-1">Amount Due</p>
              <div className="text-4xl font-black text-white">
                {invoice.currency} {parseFloat(invoice.total).toLocaleString(undefined, {minimumFractionDigits: 2})}
              </div>
            </div>
          </div>
        </div>

        <div className="p-10 space-y-8">
          {/* Bill To */}
          <div>
             <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Billed To</h3>
             <p className="font-bold text-navy text-lg">{invoice.clients?.company || invoice.clients?.name}</p>
             <p className="text-gray-500 text-sm font-medium">{invoice.clients?.email}</p>
          </div>

          {/* Line Items */}
          <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100">
            <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Summary</h3>
            <div className="space-y-4">
              {invoice.line_items?.map((item, idx) => (
                <div key={idx} className="flex justify-between text-sm font-bold">
                  <span className="text-gray-500">{item.description}</span>
                  <span className="text-navy">{invoice.currency} {parseFloat(item.amount).toLocaleString()}</span>
                </div>
              ))}
              <div className="pt-4 border-t border-gray-200 flex justify-between items-center">
                <span className="text-navy font-black">Total</span>
                <span className="text-navy font-black text-xl">{invoice.currency} {parseFloat(invoice.total).toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Payment Button */}
          <div className="space-y-4">
            <button 
              onClick={handlePayment}
              disabled={isProcessing || invoice.status === 'Paid'}
              className="w-full py-4 rounded-2xl text-white font-black text-lg shadow-xl transition-all active:scale-95 flex items-center justify-center gap-3 disabled:opacity-50"
              style={{ backgroundColor: brand.accent || '#00C896' }}
            >
              {isProcessing ? (
                <div className="animate-spin rounded-full h-6 w-6 border-2 border-white/20 border-t-white"></div>
              ) : (
                invoice.status === 'Paid' ? <><CheckCircle2 size={22}/> Invoice Settled</> : <><CreditCard size={20} /> Secure Checkout</>
              )}
            </button>
            <p className="text-center text-[10px] font-bold text-gray-400 flex items-center justify-center gap-2">
              <ShieldCheck size={14} className="text-green-500" /> SECURED BY FLUTTERWAVE 256-BIT ENCRYPTION
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}