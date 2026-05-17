import { useState, useEffect } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import api from './lib/api';
import { supabase } from './lib/supabase';

import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import TrialBanner from './components/TrialBanner';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import Clients from './pages/Clients';
import Projects from './pages/Projects';
import Invoices from './pages/Invoices';
import Proposals from './pages/Proposals';
import ClientPortal from './pages/ClientPortal';
import Infrastructure from './pages/Infrastructure';
import Profile from './pages/Profile';
import Settings from './pages/Settings';
import JoinOrg from './pages/JoinOrg';
import ContractSandbox from './pages/ContractSandbox';
import CreateWorkspace from './pages/CreateWorkspace';
import Vault from './pages/Vault';
import SecretReveal from './pages/SecretReveal';
import PublicIntake from './pages/PublicIntake';
import PublicTimeline from './pages/PublicTimeline';
import AutomationHub from './pages/AutomationHub';
import ProposalView from './pages/ProposalView';
import InvoiceView from './pages/InvoiceView';
import PublicCheckout from './pages/PublicCheckout';
import PaymentSuccess from './pages/PaymentSuccess';

// ARCHITECT FIX: Only import the new compliance pages. Delete the old Terms/Policies if they are obsolete.
import PublicLanding from './pages/PublicLanding';
import PrivacyPolicy from './pages/PrivacyPolicy';
import TermsOfService from './pages/TermsOfService';

export default function App() {
  const [isRouting, setIsRouting] = useState(true);
  const [tenantError, setTenantError] = useState(false);
  const navigate = useNavigate();

  // ==========================================
  // 1. GLOBAL OAUTH LISTENER
  // ==========================================
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      
      if (event === 'SIGNED_IN' && session) {
        
        // --- CHECK FOR PENDING INVITES FIRST ---
        const pendingToken = localStorage.getItem('pending_invite_token');
        
        if (pendingToken) {
          try {
            console.log('[System] Processing pending invite...');
            const res = await api.post(
              '/orgs/accept-invite', 
              { token: pendingToken },
              { headers: { Authorization: `Bearer ${session.access_token}` } }
            );
            
            localStorage.removeItem('pending_invite_token'); 
            localStorage.setItem('current_org_id', res.data.org_id);
            window.location.href = '/dashboard'; // ARCHITECT FIX: Redirect to the new dashboard route
            return; 
          } catch (err) {
            console.error('[Fatal Invite Error]:', err.response?.data || err);
            localStorage.removeItem('pending_invite_token');
            alert('Your invite failed to process. Please ask your admin for a new link.');
          }
        }

        const existingOrgId = localStorage.getItem('current_org_id');
        
        if (!existingOrgId) {
          try {
            const { data: profile } = await supabase
              .from('profiles')
              .select('org_id')
              .eq('id', session.user.id)
              .single();

            if (profile?.org_id) {
              localStorage.setItem('current_org_id', profile.org_id);
              window.location.href = '/dashboard'; // ARCHITECT FIX: Send them to the dashboard
            } else {
              console.warn('[OAuth] New user detected. Provisioning workspace...');
              
              try {
                const initRes = await api.post('/auth/init-workspace', {
                  email: session.user.email,
                  name: session.user.user_metadata?.full_name || session.user.email.split('@')[0],
                  auth_id: session.user.id
                });
                
                const newOrgId = initRes.data?.org_id || initRes.data?.id;
                if (newOrgId) {
                  localStorage.setItem('current_org_id', newOrgId);
                  window.location.href = '/dashboard'; 
                }
              } catch (initErr) {
                console.error('[FATAL]: Failed to provision OAuth workspace', initErr);
                alert('Failed to initialize your workspace. Please contact support.');
              }
            }
          } catch (error) {
            console.error('[OAuth Context Error]: Could not retrieve org_id', error);
          }
        }
      }
      
      if (event === 'SIGNED_OUT') {
        localStorage.removeItem('current_org_id');
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  // ==========================================
  // 2. EDGE ROUTING & WHITE-LABEL (EXISTING)
  // ==========================================
  useEffect(() => {
    const routeEdgeRequest = async () => {
      const hostname = window.location.hostname;

      if (
        hostname === 'localhost' ||
        hostname === '127.0.0.1' ||
        hostname.includes('vercel.app') ||
        hostname === 'regulus.com.ng' ||          // ARCHITECT FIX: Whitelist Root
        hostname === 'www.regulus.com.ng'       // ARCHITECT FIX: Whitelist WWW
      ) {
        setIsRouting(false); // Instantly drop the spinner and render the page
        return;
      }

      try {
        const res = await api.get(`/public/domain-lookup?domain=${hostname}`);
        const org = res.data;

        if (org && org.brand_settings) {
          const brand =
            typeof org.brand_settings === 'string'
              ? JSON.parse(org.brand_settings)
              : org.brand_settings;
          const root = document.documentElement;

          if (brand.primary) root.style.setProperty('--theme-navy', brand.primary);
          if (brand.accent) root.style.setProperty('--theme-accent', brand.accent);

          localStorage.setItem('tenant_org_id', org.id);
          localStorage.setItem('tenant_org_name', org.name);
        }

        setIsRouting(false);
      } catch (err) {
        console.error('Unregistered Domain Request:', hostname);
        setTenantError(true);
        setIsRouting(false);
      }
    };

    routeEdgeRequest();
  }, []);

  if (isRouting) {
    return (
      <div className="min-h-screen bg-[#0A0F1E] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00C896]"></div>
      </div>
    );
  }

  if (tenantError) {
    return (
      <div className="min-h-screen bg-[#0A0F1E] flex items-center justify-center p-4">
        <div className="text-center text-white max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl">
          <h1 className="text-2xl font-black mb-2">Workspace Not Found</h1>
          <p className="text-slate-400 text-sm">
            This domain is not registered on our edge network. Please check your DNS
            settings or contact support.
          </p>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      {/* 🟢 PUBLIC COMPLIANCE ROUTES (Root level, no auth) */}
      <Route path="/" element={<PublicLanding />} />
      <Route path="/policies" element={<PrivacyPolicy />} />
      <Route path="/terms" element={<TermsOfService />} />

      {/* 🟢 OTHER PUBLIC ROUTES */}
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/join" element={<JoinOrg />} />
      <Route path="/portal/:token" element={<ClientPortal />} />
      <Route path="/secret/:id" element={<SecretReveal />} />
      <Route path="/p/:id" element={<ProposalView />} />
      <Route path="/invoices/:id" element={<InvoiceView />} />
      <Route path="/pay/success" element={<PaymentSuccess />} />
      <Route path="/pay/:id" element={<PublicCheckout />} />
      <Route path="/public/intake/:token" element={<PublicIntake />} />
      <Route path="/public/updates/:token" element={<PublicTimeline />} />

      {/* 🟡 SEMI-PROTECTED */}
      <Route
        path="/setup-workspace"
        element={
          <ProtectedRoute>
            <CreateWorkspace />
          </ProtectedRoute>
        }
      />

      {/* 🔴 FULLY PROTECTED (The Main App) */}
      {/* ARCHITECT FIX: This is now a "Pathless Route". It wraps the components but doesn't claim a URL */}
      <Route
        element={
          <ProtectedRoute>
            <div className="flex flex-col h-screen w-full overflow-hidden">
              <TrialBanner />
              <div className="flex-1 overflow-hidden">
                <Layout />
              </div>
            </div>
          </ProtectedRoute>
        }
      >
        {/* ARCHITECT FIX: Dashboard now lives specifically at /dashboard */}
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/clients" element={<Clients />} />
        <Route path="/projects" element={<Projects />} />
        <Route path="/invoices" element={<Invoices />} />
        <Route path="/proposals" element={<Proposals />} />
        <Route path="/infrastructure" element={<Infrastructure />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/sandbox" element={<ContractSandbox />} />
        <Route path="/vault" element={<Vault />} />
        <Route path="/blueprints" element={<AutomationHub />} />
      </Route>

      {/* Global 404 */}
      <Route
        path="*"
        element={
          <div className="flex items-center justify-center min-h-screen font-black text-navy text-4xl">
            404: OUT OF BOUNDS
          </div>
        }
      />
    </Routes>
  );
}