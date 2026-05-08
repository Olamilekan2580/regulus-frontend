import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users, FolderKanban, Receipt, FileText, Settings, LogOut } from 'lucide-react';

export default function Layout() {
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    // Clear your auth tokens here
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

  return (
    <div className="flex h-screen bg-gray-50/50">
      
      {/* Premium Dark Sidebar */}
      <div className="w-64 bg-[#0B1121] text-gray-300 flex flex-col border-r border-gray-800 shadow-2xl z-10">
        <div className="p-8">
          <h1 className="text-2xl font-bold text-teal-400 tracking-tight">Regulus.</h1>
        </div>

        <nav className="flex-1 px-4 space-y-1.5 mt-2 overflow-y-auto">
          {navItems.map((item) => {
            // Strict match for dashboard, partial match for others so sub-pages stay highlighted
            const isActive = item.path === '/' 
              ? location.pathname === '/' 
              : location.pathname.startsWith(item.path);

            return (
              <Link
                key={item.name}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all duration-200 group ${
                  isActive 
                    ? 'bg-white/10 text-teal-400' 
                    : 'hover:bg-white/5 hover:text-white'
                }`}
              >
                <item.icon size={20} strokeWidth={isActive ? 2.5 : 2} className={`transition-colors ${isActive ? 'text-teal-400' : 'text-gray-500 group-hover:text-gray-300'}`} />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* Bottom Actions (Settings & Logout) */}
        <div className="p-4 border-t border-white/5 space-y-1.5 mb-4">
          <Link
            to="/profile"
            className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all duration-200 group ${
              location.pathname.startsWith('/profile')
                ? 'bg-white/10 text-teal-400'
                : 'hover:bg-white/5 hover:text-white'
            }`}
          >
            <Settings size={20} strokeWidth={location.pathname.startsWith('/profile') ? 2.5 : 2} className={`transition-colors ${location.pathname.startsWith('/profile') ? 'text-teal-400' : 'text-gray-500 group-hover:text-gray-300'}`} />
            Settings
          </Link>
          
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-gray-400 hover:bg-red-500/10 hover:text-red-400 transition-all duration-200 text-left group"
          >
            <LogOut size={20} className="text-gray-500 group-hover:text-red-400 transition-colors" />
            Logout
          </button>
        </div>
      </div>

      {/* Main Content Render Area */}
      <div className="flex-1 overflow-auto bg-gray-50">
        <div className="p-8 max-w-7xl mx-auto">
          <Outlet />
        </div>
      </div>
      
    </div>
  );
}