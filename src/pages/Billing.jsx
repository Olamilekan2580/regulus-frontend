import { useState, useEffect } from 'react';
import { usePaystackPayment } from 'react-paystack';
import { CheckCircle, Shield, Zap } from 'lucide-react';

export default function Billing() {
  const [freelancerId, setFreelancerId] = useState('');
  const [email, setEmail] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      // Decode the JWT to get the user's ID and Email without an extra API call
      const payload = JSON.parse(atob(token.split('.')[1]));
      setFreelancerId(payload.sub);
      setEmail(payload.email || 'billing@regulus.io');
    }
  }, []);

  const config = {
    reference: (new Date()).getTime().toString(),
    email: email,
    amount: 3900 * 100, // $39.00 in kobo/cents
    publicKey: import.meta.env.VITE_PAYSTACK_PUBLIC_KEY, // YOUR master public key
    metadata: {
      freelancer_id: freelancerId,
      type: 'platform_subscription'
    }
  };

  const initializePayment = usePaystackPayment(config);

  const handleSuccess = () => {
    alert('Payment successful! Your SaaS subscription is now active.');
    window.location.href = '/'; // Redirect to dashboard to remount context
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
        <div className="bg-navy p-8 text-center">
          <h1 className="text-3xl font-bold text-white mb-2">Regulus Pro</h1>
          <p className="text-gray-300">Unlock your freelance infrastructure.</p>
        </div>
        
        <div className="p-8">
          <div className="text-center mb-8">
            <span className="text-5xl font-bold text-navy">$39</span>
            <span className="text-gray-500 font-medium">/month</span>
          </div>

          <div className="space-y-4 mb-8">
            {['Custom White-Label Portal', 'Zero-Trust Client Invoicing', 'Bring Your Own API Keys', 'Automated Payment Webhooks'].map((feature, i) => (
              <div key={i} className="flex items-center gap-3 text-gray-700 font-medium">
                <CheckCircle className="text-accent shrink-0" size={20} />
                <span>{feature}</span>
              </div>
            ))}
          </div>

          <button 
            onClick={() => initializePayment(handleSuccess, () => console.log('Closed'))}
            className="w-full flex items-center justify-center gap-2 bg-accent text-white py-4 rounded-xl font-bold text-lg hover:bg-accent/90 transition-all shadow-md"
          >
            <Zap size={20} /> Activate Pro Subscription
          </button>
          
          <p className="text-center text-xs text-gray-400 mt-4 flex items-center justify-center gap-1">
            <Shield size={12} /> Secured by Paystack
          </p>
        </div>
      </div>
    </div>
  );
}
