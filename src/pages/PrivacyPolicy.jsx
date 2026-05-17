import { Link } from 'react-router-dom';

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-white text-slate-800 font-sans">
      <div className="max-w-3xl mx-auto px-6 py-16">
        <Link to="/" className="text-emerald-600 font-bold hover:underline mb-8 inline-block">&larr; Back to Home</Link>
        <h1 className="text-4xl font-black text-slate-900 mb-8">Privacy Policy</h1>
        <p className="text-sm text-slate-500 mb-8">Last Updated: {new Date().toLocaleDateString()}</p>
        
        <div className="space-y-6 leading-relaxed">
          <p>At Regulus, we take your privacy and the security of your client data seriously. This Privacy Policy describes how we collect, use, and handle your information when you use our client management and invoicing platform.</p>
          
          <h2 className="text-2xl font-bold text-slate-900 mt-8 mb-4">1. Information We Collect</h2>
          <p>We collect information you provide directly to us when you create an account, create a client profile, or generate an invoice. This includes your name, email address, billing information, and encrypted project credentials.</p>

          <h2 className="text-2xl font-bold text-slate-900 mt-8 mb-4">2. How We Use Your Information</h2>
          <p>We use the information we collect to operate, maintain, and improve our services, to process your transactions, and to communicate with you regarding your account and system updates.</p>

          <h2 className="text-2xl font-bold text-slate-900 mt-8 mb-4">3. Google API Services Usage (Limited Use)</h2>
          <p className="p-4 bg-slate-50 border-l-4 border-emerald-500 font-medium">
            Regulus's use and transfer to any other app of information received from Google APIs will adhere to <a href="https://developers.google.com/terms/api-services-user-data-policy" target="_blank" rel="noreferrer" className="text-emerald-600 underline">Google API Services User Data Policy</a>, including the Limited Use requirements.
          </p>

          <h2 className="text-2xl font-bold text-slate-900 mt-8 mb-4">4. Data Security</h2>
          <p>We implement enterprise-grade security measures, including zero-trust architecture and encrypted credential vaults, to protect your personal information and your clients' intellectual property from unauthorized access.</p>

          <h2 className="text-2xl font-bold text-slate-900 mt-8 mb-4">5. Contact Us</h2>
          <p>If you have any questions about this Privacy Policy, please contact our security team at security@regulus.com.ng.</p>
        </div>
      </div>
    </div>
  );
}