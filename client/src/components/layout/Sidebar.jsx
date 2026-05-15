import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  PlusCircle, 
  Search, 
  FileText, 
  Bell, 
  User, 
  ShieldCheck,
  LogOut,
  ChevronRight
} from 'lucide-react';
import useAuthStore from '../../store/useAuthStore';

const Sidebar = () => {
  const { user, clearAuth } = useAuthStore();

  const menuItems = [
    { icon: LayoutDashboard, label: 'Overview', path: '/dashboard' },
    { icon: PlusCircle, label: 'Report Lost', path: '/report-lost' },
    { icon: Search, label: 'Report Found', path: '/report-found' },
    { icon: FileText, label: 'My Reports', path: '/my-reports' },
    { icon: Bell, label: 'Notifications', path: '/notifications' },
    { icon: User, label: 'Profile', path: '/profile' },
  ];

  return (
    <aside className="w-80 h-[calc(100vh-120px)] sticky top-24 hidden lg:flex flex-col gap-8 pb-8">
      {/* User Profile Card */}
      <div className="glass-card p-6 rounded-[2.5rem] border-white/5 relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-24 h-24 bg-brand-gold/10 rounded-full blur-2xl -mr-10 -mt-10 group-hover:bg-brand-gold/20 transition-all duration-500"></div>
        <div className="flex items-center gap-4 relative z-10">
          <div className="w-16 h-16 bg-gradient-to-br from-brand-blue to-brand-blue-dark rounded-2xl flex items-center justify-center text-brand-gold text-2xl font-black border border-white/10 shadow-2xl">
            {user?.name?.charAt(0) || 'U'}
          </div>
          <div>
            <h4 className="text-white font-black tracking-tight">{user?.name || 'Student'}</h4>
            <p className="text-[10px] font-black uppercase tracking-widest text-brand-gold/60">Verified Member</p>
          </div>
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className="glass-card flex-grow p-4 rounded-[2.5rem] border-white/5 flex flex-col gap-2">
        <div className="px-4 py-3">
          <span className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-500">Main Menu</span>
        </div>
        {menuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => `
              flex items-center justify-between p-4 rounded-2xl transition-all duration-300 group
              ${isActive 
                ? 'bg-brand-gold text-brand-blue-dark shadow-xl shadow-brand-gold/10' 
                : 'text-slate-400 hover:bg-white/5 hover:text-white'}
            `}
          >
            <div className="flex items-center gap-4">
              <item.icon size={20} className={({ isActive }) => isActive ? 'text-brand-blue-dark' : 'text-inherit group-hover:text-brand-gold transition-colors'} />
              <span className="text-sm font-black uppercase tracking-widest">{item.label}</span>
            </div>
            <ChevronRight size={16} className="opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0" />
          </NavLink>
        ))}

        <div className="mt-auto pt-4 border-t border-white/5">
          <button 
            onClick={clearAuth}
            className="w-full flex items-center gap-4 p-4 rounded-2xl text-rose-500 hover:bg-rose-500/10 transition-all group"
          >
            <LogOut size={20} />
            <span className="text-sm font-black uppercase tracking-widest">Logout</span>
          </button>
        </div>
      </nav>

      {/* Security Badge */}
      <div className="bg-brand-blue/30 p-6 rounded-[2rem] border border-white/5 backdrop-blur-md flex items-center gap-4">
        <div className="w-10 h-10 bg-brand-gold/20 rounded-xl flex items-center justify-center text-brand-gold">
          <ShieldCheck size={24} />
        </div>
        <p className="text-[10px] font-black uppercase tracking-widest text-white leading-relaxed">
          Secured <br />Portal
        </p>
      </div>
    </aside>
  );
};

export default Sidebar;
