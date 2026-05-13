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
  Terminal,
  Workflow,
  Loader2 // NEW: Imported for the spinner
} from 'lucide-react';
import api from '../lib/api';
import BillingWall from './BillingWall'; 

export default function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [orgName, setOrgName] = useState('Regulus.');
  const [isLocked, setIsLocked] = useState(false); 
  
  // NEW: State for the hardened footer UI
  const [orgData, setOrgData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // The Subscription Gatekeeper Listener
  useEffect(() => {
    const handleLock = () => setIsLocked(true);
    window.addEventListener('trigger-billing-wall', handleLock);

    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('billing') === 'success') {
      setIsLocked(false); 
      window.history.replaceState(null, '', window.location.pathname); 
    }

    return () => window.removeEventListener('trigger-billing-wall', handleLock);
  }, []);

  // Initialize Organization Context & Dynamic Branding
  useEffect(() => {
    const initializeWorkspace = async () => {
      setIsLoading(true); // Start loading
      const storedOrgName = localStorage.getItem('current_org_name');
      const orgId = localStorage.getItem('current_org_id');

      if (storedOrgName) setOrgName(storedOrgName);

      if (orgId) {
        try {
          const res = await api.get(`/orgs/${orgId}`);
          setOrgData(res.data); // Save the data for the footer
          
          const branding = res.data?.brand_settings;
          if (branding) {
            const root = document.documentElement;
            if (branding.primary) root.style.setProperty('--theme-navy', branding.primary);
            if (branding.accent) root.style.setProperty('--theme-accent', branding.accent);
          }
        } catch (err) {
          console.error('Failed to load workspace branding.');
        } finally {
          setIsLoading(false); // THE FIX: Guarantees the spinner stops
        }
      } else {
        setIsLoading(false);
      }
    };

    initializeWorkspace();
  }, [location.pathname]); 

  const handleLogout = () => {
    localStorage.removeItem('token'); 
    localStorage.removeItem('current_org_id');
    localStorage.removeItem('current_org_name');
    
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
    { name: 'Automation Hub', path: '/blueprints', icon: Workflow }, 
    { name: 'Contract Sandbox', path: '/sandbox', icon: Scale },
    { name: 'Infrastructure', path: '/infrastructure', icon: Terminal },
  ];

  const NavLinks = ({ onClick = () => {} }) => (
    <>
      <nav className="flex-1 overflow-y-auto px-4 space-y-1.5 mt-4 scrollbar-hide pb-4">
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
              
              <span className="flex-1">{item.name}</span>

              {item.path === '/blueprints' && (
                <span className="text-[10px] bg-accent/10 text-accent px-1.5 py-0.5 rounded-md border border-accent/20 font-black tracking-tighter animate-pulse">
                  NEW
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* NEW HARDENED FOOTER AREA */}
      <div className="mt-auto flex flex-col shrink-0">
        
        {/* Secondary Links */}
        <div className="px-4 py-3 space-y-1.5 border-t border-white/5">
          <Link
            to="/profile"
            onClick={onClick}
            className={`flex items-center gap-3 px-4 py-2.5 rounded-xl font-medium transition-all duration-200 group ${
              location.pathname.startsWith('/profile') ? 'bg-accent/10 text-accent shadow-sm' : 'text-gray-400 hover:bg-white/5 hover:text-white'
            }`}
          >
            <User size={18} strokeWidth={location.pathname.startsWith('/profile') ? 2.5 : 2} className={location.pathname.startsWith('/profile') ? 'text-accent' : 'text-gray-500 group-hover:text-gray-300'} />
            <span className="text-sm">My Profile</span>
          </Link>
          
          <Link
            to="/settings"
            onClick={onClick}
            className={`flex items-center gap-3 px-4 py-2.5 rounded-xl font-medium transition-all duration-200 group ${
              location.pathname.startsWith('/settings') ? 'bg-accent/10 text-accent shadow-sm' : 'text-gray-400 hover:bg-white/5 hover:text-white'
            }`}
          >
            <Settings size={18} strokeWidth={location.pathname.startsWith('/settings') ? 2.5 : 2} className={location.pathname.startsWith('/settings') ? 'text-accent' : 'text-gray-500 group-hover:text-gray-300'} />
            <span className="text-sm">Workspace Settings</span>
          </Link>
        </div>

        {/* Immutable User/Logout Bar */}
        <div className="p-4 bg-black/20 border-t border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-10 h-10 rounded-full bg-navy flex items-center justify-center border border-white/10 shrink-0">
              {isLoading ? (
                <Loader2 className="animate-spin text-accent" size={18} />
              ) : (
                <User className="text-gray-400" size={18} />
              )}
            </div>
            <div className="flex flex-col truncate">
              <span className="text-sm font-bold text-white truncate">
                {orgData?.name || orgName || 'Personal'}
              </span>
              {orgData?.plan_tier !== 'agency' && (
                <button 
                  onClick={(e) => { e.preventDefault(); navigate('/settings'); onClick(); }} 
                  className="text-[10px] text-left font-black uppercase tracking-wider text-accent hover:text-white transition-colors mt-0.5"
                >
                  Upgrade Plan
                </button>
              )}
            </div>
          </div>

          <button
            onClick={() => { handleLogout(); onClick(); }}
            className="p-2.5 text-gray-500 hover:text-red-400 hover:bg-red-400/10 rounded-xl transition-all shrink-0 ml-2"
            title="Sign Out"
          >
            <LogOut size={18} />
          </button>
        </div>
      </div>
    </>
  );

  return (
    <>
      {isLocked && <BillingWall />}

      <div className={`flex h-screen bg-gray-50 overflow-hidden ${isLocked ? 'blur-md pointer-events-none select-none' : ''}`}>
        
        {/* DESKTOP SIDEBAR */}
        <div className="hidden md:flex w-64 bg-navy text-gray-300 flex-col border-r border-gray-800 shadow-xl z-20">
          <div className="p-6 pb-2 shrink-0">
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
          <div className="p-6 flex justify-between items-center border-b border-white/5 shrink-0">
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