import { useState, useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
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
    { name: 'Dashboard',        path: '/',               icon: LayoutDashboard },
    { name: 'Clients',          path: '/clients',        icon: Users },
    { name: 'Projects',         path: '/projects',       icon: FolderKanban },
    { name: 'Invoices',         path: '/invoices',       icon: Receipt },
    { name: 'Proposals',        path: '/proposals',      icon: FileText },
    { name: 'Credential Vault', path: '/vault',          icon: Shield },
    { name: 'Automation Hub',   path: '/blueprints',     icon: Workflow }, 
    { name: 'Contract Sandbox', path: '/sandbox',        icon: Scale },
    { name: 'Infrastructure',   path: '/infrastructure', icon: Terminal },
  ];

  // NavLinks owns its height budget via flex-col + overflow-hidden.
  // The nav scrolls internally; the footer is shrink-0 so it never moves.
  const NavLinks = ({ onClick = () => {} }) => (
    <div className="flex flex-col flex-1 overflow-hidden">

      {/* Scrollable nav list */}
      <nav className="flex-1 overflow-y-auto px-3 py-2 space-y-0.5 scrollbar-hide">
        {navItems.map((item) => {
          const isActive = item.path === '/' 
            ? location.pathname === '/' 
            : location.pathname.startsWith(item.path);
          return (
            <Link
              key={item.name}
              to={item.path}
              onClick={onClick}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150 group ${
                isActive 
                  ? 'bg-accent/10 text-accent' 
                  : 'text-gray-400 hover:bg-white/5 hover:text-white'
              }`}
            >
              <item.icon 
                size={16} 
                strokeWidth={isActive ? 2.5 : 2} 
                className={`shrink-0 ${isActive ? 'text-accent' : 'text-gray-500 group-hover:text-gray-300'}`}
              />
              <span className="flex-1 truncate">{item.name}</span>
              {item.path === '/blueprints' && (
                <span className="text-[9px] bg-accent/10 text-accent px-1.5 py-0.5 rounded font-black tracking-tighter border border-accent/20 animate-pulse shrink-0">
                  NEW
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Pinned footer — shrink-0 means it never scrolls away or collapses */}
      <div className="shrink-0 border-t border-white/5">

        {/* Profile + Settings */}
        <div className="px-3 pt-2 pb-1 space-y-0.5">
          {[
            { label: 'My Profile', path: '/profile', icon: User },
            { label: 'Settings',   path: '/settings', icon: Settings },
          ].map(({ label, path, icon: Icon }) => {
            const active = location.pathname.startsWith(path);
            return (
              <Link
                key={path}
                to={path}
                onClick={onClick}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150 group ${
                  active ? 'bg-accent/10 text-accent' : 'text-gray-400 hover:bg-white/5 hover:text-white'
                }`}
              >
                <Icon size={16} strokeWidth={active ? 2.5 : 2} className={`shrink-0 ${active ? 'text-accent' : 'text-gray-500 group-hover:text-gray-300'}`} />
                <span>{label}</span>
              </Link>
            );
          })}
        </div>

        {/* Identity + logout bar */}
        <div className="px-3 pb-3">
          <div className="flex items-center justify-between gap-2 bg-black/20 rounded-xl border border-white/5 px-3 py-2">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-7 h-7 rounded-full bg-navy flex items-center justify-center border border-white/10 shrink-0">
                {isLoading 
                  ? <Loader2 className="animate-spin text-accent" size={13} /> 
                  : <User className="text-gray-400" size={13} />
                }
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-bold text-white truncate leading-tight">
                  {orgData?.name || orgName || 'Personal'}
                </span>
                {orgData?.plan_tier !== 'agency' && (
                  <button 
                    onClick={(e) => { e.preventDefault(); navigate('/settings'); onClick(); }} 
                    className="text-[9px] text-left font-black uppercase tracking-wider text-accent hover:text-white transition-colors leading-tight"
                  >
                    Upgrade
                  </button>
                )}
              </div>
            </div>
            <button
              onClick={() => { handleLogout(); onClick(); }}
              className="p-1.5 text-gray-500 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all shrink-0"
              title="Sign Out"
            >
              <LogOut size={15} />
            </button>
          </div>
        </div>

      </div>
    </div>
  );

  return (
    <>
      {isLocked && <BillingWall />}

      <div className={`flex h-screen bg-gray-50 overflow-hidden ${isLocked ? 'blur-md pointer-events-none select-none' : ''}`}>
        
        {/* DESKTOP SIDEBAR
            overflow-hidden clips everything so the footer can never escape downward.
            Without it, flex children can overflow h-screen even with overflow-hidden on the root. */}
        <div className="hidden md:flex w-56 bg-navy text-gray-300 flex-col border-r border-gray-800 shadow-xl z-20 overflow-hidden">
          <div className="px-4 pt-4 pb-2 shrink-0">
            <h1 className="text-base font-black text-white tracking-tight flex items-center gap-2">
              <div className="w-7 h-7 bg-accent text-navy rounded-md flex items-center justify-center shrink-0">
                <Building2 size={15} strokeWidth={2.5} />
              </div>
              <span className="truncate">{orgName}</span>
            </h1>
            <p className="text-[9px] uppercase tracking-widest text-gray-500 mt-0.5 ml-0.5 font-bold">Workspace</p>
          </div>
          <NavLinks />
        </div>

        {/* MOBILE HEADER */}
        <div className="md:hidden fixed top-0 left-0 right-0 h-14 bg-navy border-b border-gray-800 flex items-center justify-between px-4 z-30 shadow-md">
          <h1 className="text-base font-black text-white flex items-center gap-2 truncate max-w-[70%]">
            <div className="w-6 h-6 bg-accent text-navy rounded-md flex items-center justify-center shrink-0">
               <Building2 size={13} strokeWidth={2.5} />
            </div>
            <span className="truncate">{orgName}</span>
          </h1>
          <button 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="text-gray-400 hover:text-white transition-colors p-2"
          >
            {isMobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>

        {/* MOBILE DRAWER OVERLAY */}
        {isMobileMenuOpen && (
          <div 
            className="fixed inset-0 bg-navy/80 backdrop-blur-sm z-40 md:hidden animate-in fade-in duration-200"
            onClick={() => setIsMobileMenuOpen(false)}
          />
        )}

        {/* MOBILE DRAWER — overflow-hidden here too */}
        <div className={`fixed inset-y-0 left-0 w-64 bg-navy text-gray-300 transform transition-transform duration-300 ease-out z-50 md:hidden flex flex-col shadow-2xl overflow-hidden ${
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}>
          <div className="px-4 py-3 flex justify-between items-center border-b border-white/5 shrink-0">
            <h1 className="text-base font-black text-white flex items-center gap-2 truncate pr-4">
              <div className="w-6 h-6 bg-accent text-navy rounded-md flex items-center justify-center shrink-0">
                 <Building2 size={13} strokeWidth={2.5} />
              </div>
              <span className="truncate">{orgName}</span>
            </h1>
            <button onClick={() => setIsMobileMenuOpen(false)} className="text-gray-500 hover:text-white transition-colors p-1.5">
              <X size={20} />
            </button>
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