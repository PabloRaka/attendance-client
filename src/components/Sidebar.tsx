import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  LogOut, User as UserIcon, LayoutDashboard, 
  History as HistoryAction, ShieldCheck, UserCircle, 
  Menu, X, ChevronRight, Bell, Settings, ChevronLeft
} from 'lucide-react';

interface MenuItem {
  name: string;
  path: string;
  icon: React.ElementType;
}

interface SidebarProps {
  isOpen: boolean;
  onToggle: (state: boolean) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onToggle }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const menuItems: MenuItem[] = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'History', path: '/history', icon: HistoryAction },
    { name: 'Profile', path: '/profile', icon: UserCircle },
  ];

  if (user?.role === 'admin') {
    menuItems.push({ name: 'Admin Panel', path: '/admin', icon: ShieldCheck });
  }

  const NavLink = ({ item }: { item: MenuItem }) => {
    const isActive = location.pathname === item.path;
    return (
      <Link 
        to={item.path}
        onClick={() => { if (window.innerWidth < 1024) onToggle(false); }}
        className={`flex items-center justify-between px-6 py-4 rounded-[22px] transition-colors duration-300 group ${
          isActive 
            ? 'bg-[#817BB9] text-white shadow-lg shadow-[#817BB9]/30' 
            : 'text-slate-500 hover:bg-[#817BB9]/5 hover:text-[#817BB9]'
        }`}
      >
        <div className="flex items-center gap-4">
          <item.icon className={`w-5 h-5 ${isActive ? 'animate-pulse' : 'group-hover:scale-110 transition-transform'}`} />
          <span className="font-black text-xs uppercase tracking-widest">{item.name}</span>
        </div>
        {isActive && <ChevronRight className="w-4 h-4 opacity-50" />}
      </Link>
    );
  };

  return (
    <>
      {/* Mobile Toggle */}
      <div className="lg:hidden fixed top-6 left-6 z-[150]">
        <button 
          onClick={() => onToggle(!isOpen)}
          className="p-4 bg-white rounded-[20px] shadow-xl shadow-slate-200 border border-slate-100 text-[#817BB9]"
        >
          {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Backdrop for mobile */}
      {isOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[140] animate-in fade-in duration-300"
          onClick={() => onToggle(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside className={`fixed top-0 left-0 h-screen z-[145] transition-transform duration-500 will-change-transform cubic-bezier-in-out transform
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        w-[280px] bg-white border-r border-slate-100 shadow-2xl shadow-slate-200/40 flex flex-col`}
        style={{ transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)' }}
      >
        {/* Logo Section */}
        <div className="p-10 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-4 group">
            <div className="w-12 h-12 bg-[#817BB9] rounded-[22px] flex items-center justify-center transition-transform group-hover:rotate-12 shadow-xl shadow-[#817BB9]/20">
              <span className="text-white font-black text-2xl">A</span>
            </div>
            <div>
              <h2 className="font-black text-xl text-slate-900 leading-none">Attendance</h2>
              <p className="text-[#817BB9] font-black text-[12px] uppercase tracking-[0.2em] mt-1">IBIK</p>
            </div>
          </Link>
          
          <button 
            onClick={() => onToggle(false)}
            className="p-2 hover:bg-slate-100 rounded-xl text-slate-400 transition-colors hidden lg:block"
            title="Hide Sidebar"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
        </div>

        {/* Search / Status */}
        <div className="px-10 mb-8">
           <div className="p-4 bg-slate-50 rounded-[22px] border border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                 <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                 <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">System Active</span>
              </div>
              <Bell className="w-4 h-4 text-slate-300 hover:text-[#817BB9] cursor-pointer transition-colors" />
           </div>
        </div>

        {/* Navigation Section */}
        <nav className="flex-grow px-6 space-y-2 overflow-y-auto custom-scrollbar">
          {menuItems.map((item) => (
            <NavLink key={item.path} item={item} />
          ))}
        </nav>

        {/* User Profile Section */}
        <div className="p-6">
          <div className="bg-slate-50 rounded-[32px] p-6 border border-slate-100">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-[18px] bg-white border border-slate-100 flex items-center justify-center shadow-sm">
                <UserIcon className="w-6 h-6 text-[#817BB9]" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-black text-slate-900 text-sm truncate uppercase tracking-tight">{user?.fullname.split(' ')[0]}</h4>
                <p className="text-slate-400 text-[9px] font-bold uppercase tracking-widest truncate">@{user?.username}</p>
              </div>
            </div>
            
            <div className="flex gap-2">
               <Link 
                 to="/profile" 
                 className="flex-1 bg-white hover:bg-slate-100 text-slate-500 py-3 rounded-[14px] flex items-center justify-center transition-all border border-slate-100"
                 title="Settings"
               >
                 <Settings className="w-4 h-4" />
               </Link>
               <button 
                 onClick={handleLogout}
                 className="flex-[2] bg-red-50 hover:bg-red-100 text-red-500 font-black text-[10px] uppercase tracking-widest rounded-[14px] py-3 transition-all flex items-center justify-center gap-2"
               >
                 <LogOut className="w-4 h-4" /> Exit
               </button>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="p-10 pt-0">
            <p className="text-[10px] font-bold text-slate-300 uppercase tracking-[0.1em]">© 2026 Attendance IBIK</p>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
