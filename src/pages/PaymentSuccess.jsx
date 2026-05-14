import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle2, ArrowRight, ShieldCheck } from 'lucide-react';

export default function PaymentSuccess() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const invoiceId = searchParams.get('invoice_id');

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-6 text-center">
      <div className="max-w-md w-full space-y-8 animate-in zoom-in-95 duration-500">
        <div className="flex flex-col items-center">
          <div className="w-24 h-24 bg-green-50 rounded-full flex items-center justify-center mb-6">
            <CheckCircle2 size={48} className="text-green-500" />
          </div>
          <h1 className="text-3xl font-black text-navy">Payment Confirmed</h1>
          <p className="text-gray-500 font-medium mt-3">
            Thank you. Your payment has been processed and the funds are being routed to the freelancer's vault.
          </p>
        </div>

        <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100 flex items-center justify-center gap-2">
          <ShieldCheck size={16} className="text-green-600" />
          <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Transaction Secured by Regulus</span>
        </div>

        <button 
          onClick={() => window.close()} 
          className="w-full py-4 bg-navy text-white font-black rounded-2xl shadow-lg hover:bg-navy/90 transition-all active:scale-95 flex items-center justify-center gap-2"
        >
          Close Tab <ArrowRight size={18} />
        </button>
        
        <p className="text-[10px] font-bold text-gray-400">A receipt has been sent to your email.</p>
      </div>
    </div>
  );
}