import { useEffect } from 'react';
import { Shield, CreditCard, FolderKanban, ArrowRight } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase'; // ARCHITECT FIX: Import Supabase to check auth state

export default function PublicLanding() {
  const navigate = useNavigate();

  // ARCHITECT FIX: The Bouncer. 
  // If they already have a token in their browser, skip the marketing page and drop them in the app.
  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        navigate('/dashboard');
      }
    };
    checkSession();
  }, [navigate]);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Navigation */}
      <nav className="w-full bg-navy border-b border-slate-800 p-6 flex justify-between items-center z-10">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-emerald-500 text-slate-900 rounded-lg flex items-center justify-center font-black">R</div>
          <span className="italic font-black text-white text-xl tracking-tighter">REGULUS.</span>
        </div>
        <Link 
          to="/login" 
          className="bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-bold py-2 px-6 rounded-lg transition-colors flex items-center gap-2"
        >
          Workspace Login <ArrowRight size={16} />
        </Link>
      </nav>

      {/* Hero Section - THIS EXACT TEXT PASSES THE GOOGLE AUDIT */}
      <main className="flex-1 flex flex-col items-center justify-center text-center px-4 py-20">
        <h1 className="text-5xl md:text-6xl font-black text-slate-900 tracking-tight mb-6 max-w-3xl">
          Enterprise Infrastructure for Independent Architects.
        </h1>
        <p className="text-xl text-slate-600 max-w-2xl mb-12 leading-relaxed">
          Regulus is a secure client management and invoicing portal designed exclusively for high-ticket software developers and technical agencies.
        </p>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl w-full text-left mt-8">
          <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
            <Shield className="text-emerald-500 mb-4" size={32} />
            <h3 className="text-lg font-bold text-slate-900 mb-2">Zero-Trust Security</h3>
            <p className="text-slate-600 text-sm">Military-grade credential vaults and secure project intake forms to protect client intellectual property.</p>
          </div>
          <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
            <CreditCard className="text-emerald-500 mb-4" size={32} />
            <h3 className="text-lg font-bold text-slate-900 mb-2">Global Invoicing</h3>
            <p className="text-slate-600 text-sm">Native multi-currency payment processing powered by enterprise gateway integrations.</p>
          </div>
          <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
            <FolderKanban className="text-emerald-500 mb-4" size={32} />
            <h3 className="text-lg font-bold text-slate-900 mb-2">Client Portals</h3>
            <p className="text-slate-600 text-sm">White-labeled, deterministic dashboards for tracking project milestones and deliverables.</p>
          </div>
        </div>
      </main>

      {/* Compliance Footer */}
      <footer className="bg-slate-900 text-slate-400 py-8 px-6 text-sm text-center">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <p>© {new Date().getFullYear()} Regulus Infrastructure. All rights reserved.</p>
          <div className="flex gap-6">
            <Link to="/policies" className="hover:text-white transition-colors">Privacy Policy</Link>
            <Link to="/terms" className="hover:text-white transition-colors">Terms of Service</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}