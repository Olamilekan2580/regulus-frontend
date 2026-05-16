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
import Policies from './pages/Policies';
import Terms from './pages/Terms';

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
        const existingOrgId = localStorage.getItem('current_org_id');
        
        // If OAuth bypasses the manual login function, catch them here
        if (!existingOrgId) {
          try {
            // Fetch the user's profile which contains their org_id
            const { data: profile } = await supabase
              .from('profiles')
              .select('org_id')
              .eq('id', session.user.id)
              .single();

            if (profile?.org_id) {
              localStorage.setItem('current_org_id', profile.org_id);
              // Force reload to mount the application with the new Tenant Context
              window.location.reload(); 
            } else {
              // We must provision their workspace immediately.
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
                  window.location.reload(); // Hard reset to load the new workspace
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
        hostname.includes('vercel.app')
      ) {
        setIsRouting(false);
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
      {/* 🟢 PUBLIC ROUTES (No login required) */}
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/portal/:token" element={<ClientPortal />} />
      <Route path="/secret/:id" element={<SecretReveal />} />
      <Route path="/p/:id" element={<ProposalView />} />
      <Route path="/invoices/:id" element={<InvoiceView />} />
      <Route path="/terms" element={<Terms />} />
      <Route path="/policies" element={<Policies />} />

      {/* NOTE: /pay/success must come before /pay/:id so the static
          segment is matched first and not swallowed by the dynamic one */}
      <Route path="/pay/success" element={<PaymentSuccess />} />
      <Route path="/pay/:id" element={<PublicCheckout />} />

      <Route path="/public/intake/:token" element={<PublicIntake />} />
      <Route path="/public/updates/:token" element={<PublicTimeline />} />

      {/* 🟡 SEMI-PROTECTED (No Sidebar/Layout) */}
      <Route
        path="/setup-workspace"
        element={
          <ProtectedRoute>
            <CreateWorkspace />
          </ProtectedRoute>
        }
      />

      {/* 🔴 FULLY PROTECTED (The Main App) */}
      <Route
        path="/"
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
        <Route index element={<Dashboard />} />
        <Route path="clients" element={<Clients />} />
        <Route path="projects" element={<Projects />} />
        <Route path="invoices" element={<Invoices />} />
        <Route path="proposals" element={<Proposals />} />
        {/* PATCH: Removed the protected proposals/:id route here so it defaults to the public /p/:id route */}
        <Route path="infrastructure" element={<Infrastructure />} />
        <Route path="profile" element={<Profile />} />
        <Route path="settings" element={<Settings />} />
        <Route path="join" element={<JoinOrg />} />
        <Route path="sandbox" element={<ContractSandbox />} />
        <Route path="vault" element={<Vault />} />
        <Route path="blueprints" element={<AutomationHub />} />
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