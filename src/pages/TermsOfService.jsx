import { Link } from 'react-router-dom';

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-white text-slate-800 font-sans">
      <div className="max-w-3xl mx-auto px-6 py-16">
        <Link to="/" className="text-emerald-600 font-bold hover:underline mb-8 inline-block">&larr; Back to Home</Link>
        <h1 className="text-4xl font-black text-slate-900 mb-8">Terms of Service</h1>
        <p className="text-sm text-slate-500 mb-8">Last Updated: {new Date().toLocaleDateString()}</p>
        
        <div className="space-y-6 leading-relaxed">
          <h2 className="text-2xl font-bold text-slate-900 mt-8 mb-4">1. Acceptance of Terms</h2>
          <p>By accessing or using the Regulus platform at regulus.com.ng, you agree to be bound by these Terms of Service and all applicable laws and regulations.</p>

          <h2 className="text-2xl font-bold text-slate-900 mt-8 mb-4">2. Description of Service</h2>
          <p>Regulus provides a multi-tenant client management, project tracking, and invoicing SaaS platform specifically designed for independent technology contractors and agencies.</p>

          <h2 className="text-2xl font-bold text-slate-900 mt-8 mb-4">3. User Responsibilities</h2>
          <p>You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You agree to use the service only for lawful purposes and in accordance with these Terms.</p>

          <h2 className="text-2xl font-bold text-slate-900 mt-8 mb-4">4. Payments and Invoicing</h2>
          <p>Regulus facilitates payments through third-party payment gateways (e.g., Flutterwave). We are not responsible for errors made by the payment processor. You agree to provide accurate billing information and adhere to the terms of the respective payment gateway.</p>

          <h2 className="text-2xl font-bold text-slate-900 mt-8 mb-4">5. Limitation of Liability</h2>
          <p>In no event shall Regulus be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your use of or inability to use the service.</p>
        </div>
      </div>
    </div>
  );
}