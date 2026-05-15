import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Terms() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto bg-white rounded-3xl shadow-sm border border-gray-100 p-8 md:p-12">
        <Link to="/login" className="inline-flex items-center gap-2 text-sm font-bold text-gray-400 hover:text-navy mb-8 transition-colors">
          <ArrowLeft size={16} /> Back
        </Link>
        
        <h1 className="text-3xl font-black text-navy mb-2">Terms of Service</h1>
        <p className="text-gray-500 mb-8 font-medium">Last updated: {new Date().toLocaleDateString()}</p>

        <div className="space-y-6 text-gray-600 text-sm leading-relaxed">
          <section>
            <h2 className="text-lg font-bold text-navy mb-3">1. Acceptance of Terms</h2>
            <p>By accessing or using the Regulus platform, you agree to be bound by these Terms of Service. If you do not agree, do not use the system.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-navy mb-3">2. Description of Service</h2>
            <p>Regulus is a Software-as-a-Service (SaaS) client management and billing portal designed for tech freelancers. The platform is currently in active development (Beta).</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-navy mb-3">3. User Responsibilities</h2>
            <p>You are responsible for maintaining the confidentiality of your account credentials. You agree not to misuse the platform, attempt to bypass security measures, or use the service for illegal activities.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-navy mb-3">4. Limitation of Liability</h2>
            <p>Regulus is provided "as is" without warranties of any kind. We are not liable for any lost profits, lost data, or business interruptions resulting from your use of the platform.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-navy mb-3">5. Modifications</h2>
            <p>We reserve the right to modify these terms or the service at any time. Continued use of the platform constitutes acceptance of those changes.</p>
          </section>
        </div>
      </div>
    </div>
  );
}