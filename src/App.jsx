import { Routes, Route } from 'react-router-dom';
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

export default function App() {
  return (
    <Routes>
      {/* 🟢 PUBLIC ROUTES (No login required) */}
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/portal/:token" element={<ClientPortal />} />
      <Route path="/secret/:id" element={<SecretReveal />} />
      
      {/* 🔒 THE FIX: Moved these out of the Protected Route block */}
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