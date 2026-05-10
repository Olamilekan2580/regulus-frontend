import { useState, useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate, } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  FolderKanban, 
  Receipt, 
  FileText, 
  Settings, 
  LogOut, 
  Menu, 
  X, 
  Building2, 
  User,
  Shield,
  Scale,
  Terminal 
} from 'lucide-react';
import api from '../lib/api';
import BillingWall from './BillingWall'; // NEW: The Gatekeeper Component

export default function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [orgName, setOrgName] = useState('Regulus.');
  const [isLocked, setIsLocked] = useState(false); // NEW: Subscription Lock State

  // NEW: The Subscription Gatekeeper Listener
  useEffect(() => {
    // Listen for the custom event fired by the api.js interceptor
    const handleLock = () => setIsLocked(true);
    window.addEventListener('trigger-billing-wall', handleLock);

    // Check if they just returned from a successful Stripe checkout
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('billing') === 'success') {
      setIsLocked(false); // Unlock the workspace
      window.history.replaceState(null, '', window.location.pathname); // Clean up the URL
    }

    // Cleanup listener on unmount
    return () => window.removeEventListener('trigger-billing-wall', handleLock);
  }, []);

  // Initialize Organization Context & Dynamic Branding
  useEffect(() => {
    const initializeWorkspace = async () => {
      const storedOrgName = localStorage.getItem('current_org_name');
      const orgId = localStorage.getItem('current_org_id');

      if (storedOrgName) setOrgName(storedOrgName);

      if (orgId) {
        try {
          // Fetch the branding settings for this specific workspace
          const res = await api.get(`/orgs/${orgId}`);
          const branding = res.data?.brand_settings;

          if (branding) {
            // Inject CSS variables to override Tailwind's default navy/accent
            const root = document.documentElement;
            if (branding.primary) root.style.setProperty('--theme-navy', branding.primary);
            if (branding.accent) root.style.setProperty('--theme-accent', branding.accent);
          }
        } catch (err) {
          console.error('Failed to load workspace branding.');
        }
      }
    };

    initializeWorkspace();
  }, [location.pathname]); // Re-verify if they switch workspaces

  const handleLogout = () => {
    localStorage.removeItem('token'); 
    localStorage.removeItem('current_org_id');
    localStorage.removeItem('current_org_name');
    
    // Clear the injected CSS variables so the login screen resets to default
    document.documentElement.style.removeProperty('--theme-navy');
    document.documentElement.style.removeProperty('--theme-accent');
    
    navigate('/login');
  };

  const navItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Clients', path: '/clients', icon: Users },
    { name: 'Projects', path: '/projects', icon: FolderKanban },
    { name: 'Invoices', path: '/invoices', icon: Receipt },
    { name: 'Proposals', path: '/proposals', icon: FileText },
    { name: 'Credential Vault', path: '/vault', icon: Shield },
    { name: 'Contract Sandbox', path: '/sandbox', icon: Scale },
    { name: 'Infrastructure', path: '/infrastructure', icon: Terminal },
  ];

  const NavLinks = ({ onClick = () => {} }) => (
    <>
      <nav className="flex-1 px-4 space-y-1.5 mt-4">
        {navItems.map((item) => {
          const isActive = item.path === '/' 
            ? location.pathname === '/' 
            : location.pathname.startsWith(item.path);

          return (
            <Link
              key={item.name}
              to={item.path}
              onClick={onClick}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all duration-200 group ${
                isActive 
                  ? 'bg-accent/10 text-accent shadow-sm' 
                  : 'text-gray-400 hover:bg-white/5 hover:text-white'
              }`}
            >
              <item.icon size={20} strokeWidth={isActive ? 2.5 : 2} className={isActive ? 'text-accent' : 'text-gray-500 group-hover:text-gray-300'} />
              {item.name}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-white/5 space-y-1.5 mb-4 mt-auto">
        {/* PERSONAL PROFILE */}
        <Link
          to="/profile"
          onClick={onClick}
          className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all duration-200 group ${
            location.pathname.startsWith('/profile') ? 'bg-accent/10 text-accent shadow-sm' : 'text-gray-400 hover:bg-white/5 hover:text-white'
          }`}
        >
          <User size={20} strokeWidth={location.pathname.startsWith('/profile') ? 2.5 : 2} className={location.pathname.startsWith('/profile') ? 'text-accent' : 'text-gray-500 group-hover:text-gray-300'} />
          My Profile
        </Link>

        {/* WORKSPACE SETTINGS */}
        <Link
          to="/settings"
          onClick={onClick}
          className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all duration-200 group ${
            location.pathname.startsWith('/settings') ? 'bg-accent/10 text-accent shadow-sm' : 'text-gray-400 hover:bg-white/5 hover:text-white'
          }`}
        >
          <Settings size={20} strokeWidth={location.pathname.startsWith('/settings') ? 2.5 : 2} className={location.pathname.startsWith('/settings') ? 'text-accent' : 'text-gray-500 group-hover:text-gray-300'} />
          Workspace Settings
        </Link>

        {/* LOGOUT */}
        <button 
          onClick={() => { handleLogout(); onClick(); }}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-gray-400 hover:bg-red-500/10 hover:text-red-400 transition-all duration-200 text-left group"
        >
          <LogOut size={20} className="text-gray-500 group-hover:text-red-400" />
          Logout
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* NEW: Render the BillingWall over the entire screen if locked */}
      {isLocked && <BillingWall />}

      {/* NEW: Added conditional blurring and disabling of the UI if locked */}
      <div className={`flex h-screen bg-gray-50 overflow-hidden ${isLocked ? 'blur-md pointer-events-none select-none' : ''}`}>
        
        {/* DESKTOP SIDEBAR */}
        <div className="hidden md:flex w-64 bg-navy text-gray-300 flex-col border-r border-gray-800 shadow-xl z-20">
          <div className="p-6 pb-2">
            <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2 truncate">
              <div className="min-w-8 w-8 h-8 bg-accent text-navy rounded-lg flex items-center justify-center">
                <Building2 size={18} strokeWidth={2.5} />
              </div>
              <span className="truncate">{orgName}</span>
            </h1>
            <p className="text-[10px] uppercase tracking-widest text-gray-500 mt-2 ml-1 font-bold">Workspace</p>
          </div>
          <NavLinks />
        </div>

        {/* MOBILE HEADER */}
        <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-navy border-b border-gray-800 flex items-center justify-between px-6 z-30 shadow-md">
          <h1 className="text-xl font-black text-white flex items-center gap-2 truncate max-w-[70%]">
            <div className="min-w-6 w-6 h-6 bg-accent text-navy rounded-md flex items-center justify-center">
               <Building2 size={14} strokeWidth={2.5} />
            </div>
            <span className="truncate">{orgName}</span>
          </h1>
          <button 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="text-gray-400 hover:text-white transition-colors p-2"
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* MOBILE DRAWER OVERLAY */}
        {isMobileMenuOpen && (
          <div 
            className="fixed inset-0 bg-navy/80 backdrop-blur-sm z-40 md:hidden animate-in fade-in duration-200"
            onClick={() => setIsMobileMenuOpen(false)}
          />
        )}

        {/* MOBILE DRAWER CONTENT */}
        <div className={`fixed inset-y-0 left-0 w-72 bg-navy text-gray-300 transform transition-transform duration-300 ease-out z-50 md:hidden flex flex-col shadow-2xl ${
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}>
          <div className="p-6 flex justify-between items-center border-b border-white/5">
            <h1 className="text-xl font-black text-white flex items-center gap-2 truncate pr-4">
              <div className="min-w-6 w-6 h-6 bg-accent text-navy rounded-md flex items-center justify-center">
                 <Building2 size={14} strokeWidth={2.5} />
              </div>
              <span className="truncate">{orgName}</span>
            </h1>
            <button onClick={() => setIsMobileMenuOpen(false)} className="text-gray-500 hover:text-white transition-colors p-2"><X size={24} /></button>
          </div>
          <NavLinks onClick={() => setIsMobileMenuOpen(false)} />
        </div>

        {/* MAIN CONTENT AREA */}
        <main className="flex-1 overflow-auto bg-gray-50 pt-16 md:pt-0 relative">
          <div className="p-4 md:p-10 max-w-7xl mx-auto min-h-full">
            <Outlet />
          </div>
        </main>
        
      </div>
    </>
  );
}