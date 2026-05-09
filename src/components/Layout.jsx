import { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users, FolderKanban, Receipt, FileText, Settings, LogOut, Menu, X } from 'lucide-react';

export default function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem('token'); 
    navigate('/login');
  };

  const navItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Clients', path: '/clients', icon: Users },
    { name: 'Projects', path: '/projects', icon: FolderKanban },
    { name: 'Invoices', path: '/invoices', icon: Receipt },
    { name: 'Proposals', path: '/proposals', icon: FileText },
  ];

  const NavLinks = ({ onClick = () => {} }) => (
    <>
      <nav className="flex-1 px-4 space-y-1.5 mt-2">
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
                  ? 'bg-teal-400/10 text-teal-400' 
                  : 'hover:bg-white/5 hover:text-white'
              }`}
            >
              <item.icon size={20} strokeWidth={isActive ? 2.5 : 2} className={isActive ? 'text-teal-400' : 'text-gray-500 group-hover:text-gray-300'} />
              {item.name}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-white/5 space-y-1.5 mb-4">
        <Link
          to="/profile"
          onClick={onClick}
          className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all duration-200 group ${
            location.pathname.startsWith('/profile') ? 'bg-teal-400/10 text-teal-400' : 'hover:bg-white/5 hover:text-white'
          }`}
        >
          <Settings size={20} strokeWidth={location.pathname.startsWith('/profile') ? 2.5 : 2} className={location.pathname.startsWith('/profile') ? 'text-teal-400' : 'text-gray-500 group-hover:text-gray-300'} />
          Settings
        </Link>
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
    <div className="flex h-screen bg-gray-50/50 overflow-hidden">
      
      {/* DESKTOP SIDEBAR (Hidden on Mobile) */}
      <div className="hidden md:flex w-64 bg-[#0B1121] text-gray-300 flex-col border-r border-gray-800 shadow-2xl z-20">
        <div className="p-8">
          <h1 className="text-2xl font-bold text-teal-400 tracking-tight">Regulus.</h1>
        </div>
        <NavLinks />
      </div>

      {/* MOBILE HEADER (Visible only on Mobile) */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-[#0B1121] border-b border-gray-800 flex items-center justify-between px-6 z-30">
        <h1 className="text-xl font-bold text-teal-400">Regulus.</h1>
        <button 
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="text-gray-400 hover:text-white transition-colors"
        >
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* MOBILE DRAWER OVERLAY */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* MOBILE DRAWER CONTENT */}
      <div className={`fixed inset-y-0 left-0 w-72 bg-[#0B1121] text-gray-300 transform transition-transform duration-300 ease-in-out z-50 md:hidden flex flex-col ${
        isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="p-8 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-teal-400">Regulus.</h1>
          <button onClick={() => setIsMobileMenuOpen(false)} className="text-gray-500"><X size={20} /></button>
        </div>
        <NavLinks onClick={() => setIsMobileMenuOpen(false)} />
      </div>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 overflow-auto bg-gray-50 pt-16 md:pt-0">
        <div className="p-4 md:p-10 max-w-7xl mx-auto">
          <Outlet />
        </div>
      </main>
      
    </div>
  );
}