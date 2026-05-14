import { useState, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import api from './lib/api';

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
// 🔒 THE FIX: Import the Invoice View
import InvoiceView from './pages/InvoiceView';

export default function App() {
  const [isRouting, setIsRouting] = useState(true);
  const [tenantError, setTenantError] = useState(false);

  useEffect(() => {
    const routeEdgeRequest = async () => {
      const hostname = window.location.hostname;
      
      // 1. Bypass interceptor for localhost or your base Vercel domain
      if (
        hostname === 'localhost' || 
        hostname === '127.0.0.1' || 
        hostname.includes('vercel.app')
      ) {
        setIsRouting(false);
        return;
      }

      // 2. We are on a custom domain. Execute the lookup.
      try {
        const res = await api.get(`/public/domain-lookup?domain=${hostname}`);
        const org = res.data;

        // 3. Inject the white-label environment
        if (org && org.brand_settings) {
          const brand = typeof org.brand_settings === 'string' ? JSON.parse(org.brand_settings) : org.brand_settings;
          const root = document.documentElement;
          
          if (brand.primary) root.style.setProperty('--theme-navy', brand.primary);
          if (brand.accent) root.style.setProperty('--theme-accent', brand.accent);
          
          // Save the tenant ID so the login screen knows which agency this user belongs to
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

  // Show a loading state during the split-second DNS lookup
  if (isRouting) {
    return (
      <div className="min-h-screen bg-[#0A0F1E] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00C896]"></div>
      </div>
    );
  }

  // If someone points a random domain to your server that isn't in your database
  if (tenantError) {
    return (
      <div className="min-h-screen bg-[#0A0F1E] flex items-center justify-center p-4">
        <div className="text-center text-white max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl">
          <h1 className="text-2xl font-black mb-2">Workspace Not Found</h1>
          <p className="text-slate-400 text-sm">This domain is not registered on our edge network. Please check your DNS settings or contact support.</p>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      {/* 🟢 PUBLIC ROUTES (No login required) */}
      <Route path="/login" element={<Login />} />
      <Route path="/p/:id" element={<ProposalView />} />
      {/* 🔒 THE FIX: Map the public invoice gateway so clients can pay without logging in */}
      <Route path="/invoices/:id" element={<InvoiceView />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/portal/:token" element={<ClientPortal />} />
      <Route path="/secret/:id" element={<SecretReveal />} />
      <Route path="/pay/:id" element={<PublicCheckout />} />
      <Route path="/pay/success" element={<PaymentSuccess />} />
      
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
      <Route path="/" element={
        <ProtectedRoute>
          <div className="flex flex-col h-screen w-full overflow-hidden">
            <TrialBanner /> 
            <div className="flex-1 overflow-hidden">
              <Layout />
            </div>
          </div>
        </ProtectedRoute>
      }>
        <Route index element={<Dashboard />} />
        <Route path="clients" element={<Clients />} />
        <Route path="projects" element={<Projects />} />
        <Route path="invoices" element={<Invoices />} />
        <Route path="proposals" element={<Proposals />} />
        <Route path="proposals/:id" element={<ProposalView />} />
        <Route path="infrastructure" element={<Infrastructure />} />
        <Route path="profile" element={<Profile />} />
        <Route path="settings" element={<Settings />} />
        <Route path="join" element={<JoinOrg />} />
        <Route path="sandbox" element={<ContractSandbox />} />
        <Route path="vault" element={<Vault />} />
        <Route path="blueprints" element={<AutomationHub />} />
      </Route>

      {/* Global 404 */}
      <Route path="*" element={<div className="flex items-center justify-center min-h-screen font-black text-navy text-4xl">404: OUT OF BOUNDS</div>} />
    </Routes>
  );
}