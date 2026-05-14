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
  Loader2
} from 'lucide-react';
import api from '../lib/api';
import BillingWall from './BillingWall'; 

export default function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [orgName, setOrgName] = useState('Regulus.');
  const [isLocked, setIsLocked] = useState(false); 
  const [orgData, setOrgData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

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

  useEffect(() => {
    const initializeWorkspace = async () => {
      setIsLoading(true);
      const storedOrgName = localStorage.getItem('current_org_name');
      const orgId = localStorage.getItem('current_org_id');

      if (storedOrgName) setOrgName(storedOrgName);

      if (orgId) {
        try {
          const res = await api.get(`/orgs/${orgId}`);
          setOrgData(res.data);
          
          const branding = res.data?.brand_settings;
          if (branding) {
            const root = document.documentElement;
            if (branding.primary) root.style.setProperty('--theme-navy', branding.primary);
            if (branding.accent) root.style.setProperty('--theme-accent', branding.accent);
          }
        } catch (err) {
          console.error('Failed to load workspace branding.');
        } finally {
          setIsLoading(false);
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
    <div className="flex flex-col flex-1 min-h-0">
      {/* 🟢 SCROLLABLE NAVIGATION */}
      <nav className="flex-1 overflow-y-auto px-3 space-y-0.5 mt-4 scrollbar-hide pb-4">
        {navItems.map((item) => {
          const isActive = item.path === '/' 
            ? location.pathname === '/' 
            : location.pathname.startsWith(item.path);

          return (
            <Link
              key={item.name}
              to={item.path}
              onClick={onClick}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-semibold transition-all duration-200 group ${
                isActive 
                  ? 'bg-accent/10 text-accent shadow-sm' 
                  : 'text-gray-400 hover:bg-white/5 hover:text-white'
              }`}
            >
              <item.icon size={16} strokeWidth={isActive ? 3 : 2} className={isActive ? 'text-accent' : 'text-gray-500 group-hover:text-gray-300'} />
              <span className="flex-1 truncate">{item.name}</span>
              {item.path === '/blueprints' && (
                <span className="text-[9px] bg-accent/20 text-accent px-1.5 py-0.5 rounded font-black tracking-tighter animate-pulse">
                  NEW
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* 🟢 PINNED FOOTER WITH LOGOUT BUTTON */}
      <div className="flex flex-col shrink-0 bg-black/20 border-t border-white/5">
        <div className="px-3 py-2 space-y-0.5">
          <Link
            to="/profile"
            onClick={onClick}
            className={`flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-[13px] font-semibold transition-all duration-200 group ${
              location.pathname.startsWith('/profile') ? 'bg-accent/10 text-accent shadow-sm' : 'text-gray-400 hover:bg-white/5 hover:text-white'
            }`}
          >
            <User size={16} className={location.pathname.startsWith('/profile') ? 'text-accent' : 'text-gray-500'} />
            <span>My Profile</span>
          </Link>
          
          <Link
            to="/settings"
            onClick={onClick}
            className={`flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-[13px] font-semibold transition-all duration-200 group ${
              location.pathname.startsWith('/settings') ? 'bg-accent/10 text-accent shadow-sm' : 'text-gray-400 hover:bg-white/5 hover:text-white'
            }`}
          >
            <Settings size={16} className={location.pathname.startsWith('/settings') ? 'text-accent' : 'text-gray-500'} />
            <span>Settings</span>
          </Link>

          {/* 🔴 THE LOGOUT BUTTON */}
          <button
            onClick={() => { handleLogout(); onClick(); }}
            className="w-full flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-[13px] font-semibold text-gray-500 hover:bg-red-500/10 hover:text-red-400 transition-all text-left group"
          >
            <LogOut size={16} className="text-gray-600 group-hover:text-red-400" />
            <span>Logout System</span>
          </button>
        </div>

        {/* WORKSPACE BAR */}
        <div className="p-3 border-t border-white/5 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 overflow-hidden">
            <div className="w-8 h-8 rounded-lg bg-navy flex items-center justify-center border border-white/10 shrink-0">
              {isLoading ? (
                <Loader2 className="animate-spin text-accent" size={12} />
              ) : (
                <Building2 className="text-gray-400" size={14} />
              )}
            </div>
            <div className="flex flex-col truncate">
              <span className="text-[11px] font-black text-white truncate leading-none uppercase tracking-tighter">
                {orgData?.name || orgName || 'Personal'}
              </span>
              <span className="text-[9px] text-accent font-bold uppercase mt-1 tracking-widest">
                {orgData?.plan_tier || 'Solo'} Tier
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {isLocked && <BillingWall />}

      <div className={`flex h-screen bg-gray-50 overflow-hidden ${isLocked ? 'blur-md pointer-events-none select-none' : ''}`}>
        
        {/* DESKTOP SIDEBAR */}
        <div className="hidden md:flex w-56 bg-navy text-gray-300 flex-col border-r border-gray-800 shadow-xl z-20 shrink-0">
          <div className="p-5 pb-2 shrink-0">
            <h1 className="text-xl font-black text-white tracking-tight flex items-center gap-2 truncate">
              <div className="w-8 h-8 bg-accent text-navy rounded-lg flex items-center justify-center shrink-0">
                <Building2 size={18} strokeWidth={3} />
              </div>
              <span className="truncate tracking-tighter italic font-black">REGULUS.</span>
            </h1>
          </div>
          <NavLinks />
        </div>

        {/* MOBILE HEADER */}
        <div className="md:hidden sticky top-0 left-0 right-0 h-14 bg-navy border-b border-gray-800 flex items-center justify-between px-4 z-30 shadow-md">
          <h1 className="text-lg font-black text-white flex items-center gap-2">
            <div className="w-7 h-7 bg-accent text-navy rounded-lg flex items-center justify-center font-black">R</div>
            <span className="italic font-black">REGULUS.</span>
          </h1>
          <button 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="text-gray-400 p-2"
          >
            {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {/* MOBILE DRAWER */}
        {isMobileMenuOpen && (
          <div 
            className="fixed inset-0 bg-navy/80 backdrop-blur-sm z-40 md:hidden animate-in fade-in duration-200"
            onClick={() => setIsMobileMenuOpen(false)}
          />
        )}

        <div className={`fixed inset-y-0 left-0 w-64 bg-navy text-gray-300 transform transition-transform duration-300 ease-out z-50 md:hidden flex flex-col shadow-2xl ${
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}>
          <div className="p-5 flex justify-between items-center border-b border-white/5 shrink-0">
            <h1 className="text-lg font-black text-white italic font-black">REGULUS.</h1>
            <button onClick={() => setIsMobileMenuOpen(false)} className="text-gray-500 p-2"><X size={24} /></button>
          </div>
          <NavLinks onClick={() => setIsMobileMenuOpen(false)} />
        </div>

        {/* MAIN CONTENT AREA */}
        <main className="flex-1 overflow-auto bg-gray-50 pt-14 md:pt-0 relative">
          <div className="p-4 md:p-8 max-w-7xl mx-auto min-h-full">
            <Outlet />
          </div>
        </main>
        
      </div>
    </>
  );
}