import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Policies() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto bg-white rounded-3xl shadow-sm border border-gray-100 p-8 md:p-12">
        <Link to="/login" className="inline-flex items-center gap-2 text-sm font-bold text-gray-400 hover:text-navy mb-8 transition-colors">
          <ArrowLeft size={16} /> Back
        </Link>
        
        <h1 className="text-3xl font-black text-navy mb-2">Privacy Policy</h1>
        <p className="text-gray-500 mb-8 font-medium">Last updated: {new Date().toLocaleDateString()}</p>

        <div className="space-y-6 text-gray-600 text-sm leading-relaxed">
          <section>
            <h2 className="text-lg font-bold text-navy mb-3">1. Information We Collect</h2>
            <p>When you register for Regulus, we collect information that identifies you, including your name, email address, and authentication data provided by third-party services (such as Google or GitHub) if you choose to use them for single sign-on.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-navy mb-3">2. How We Use Your Information</h2>
            <p>We use your data solely to provide, maintain, and secure the Regulus platform. This includes authenticating your access, processing invoices, generating proposals, and communicating essential service updates.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-navy mb-3">3. Data Sharing and Third Parties</h2>
            <p>We do not sell your personal data. We may share necessary information with trusted third-party service providers (such as payment gateways like Flutterwave or database providers) strictly for the purpose of operating our infrastructure.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-navy mb-3">4. Security</h2>
            <p>We implement Row-Level Security (RLS) and encrypted credential vaults to protect your data. However, no internet transmission is entirely secure. We continuously update our security practices to protect your workspace.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-navy mb-3">5. Contact</h2>
            <p>If you have questions about your data or wish to delete your workspace, please contact the system administrator.</p>
          </section>
        </div>
      </div>
    </div>
  );
}