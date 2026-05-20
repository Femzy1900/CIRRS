import { Link } from 'react-router-dom';
import { Search, Bell, User, PlusCircle, LogIn } from 'lucide-react';
import useAuthStore from '../../store/useAuthStore';

export default function Navbar() {
  const { isAuthenticated, user, logout } = useAuthStore();

  return (
    <nav className="sticky top-0 z-50 bg-[#020617]/80 backdrop-blur-xl border-b border-white/5">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-12 h-12 bg-brand-blue rounded-2xl flex items-center justify-center text-brand-gold shadow-[0_0_20px_rgba(0,33,71,0.5)] group-hover:rotate-12 transition-all duration-500 border border-white/10 group-hover:scale-110">
              <PlusCircle size={28} />
            </div>
            <div className="flex flex-col leading-tight">
              <span className="text-2xl font-black tracking-tighter text-white">
                CIRS
              </span>
              <span className="text-[10px] font-bold text-brand-gold uppercase tracking-[0.3em]">Campus Recovery</span>
            </div>
          </Link>

          {/* Search Bar (Desktop) */}
          <div className="hidden md:flex flex-grow max-w-md mx-12">
            <div className="relative w-full group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-brand-gold transition-colors" size={20} />
              <input
                type="text"
                placeholder="Search lost or found items..."
                className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/5 focus:border-brand-gold/50 focus:bg-white/10 focus:ring-4 focus:ring-brand-gold/5 rounded-2xl transition-all outline-none text-sm text-white placeholder:text-slate-500"
              />
            </div>
          </div>

          {/* Navigation Links */}
          <div className="flex items-center gap-8">
            <Link to="/" className="nav-link hidden lg:block text-sm uppercase tracking-widest font-black">Home</Link>
            <Link to="/about" className="nav-link hidden lg:block text-sm uppercase tracking-widest font-black">About</Link>
            
            {isAuthenticated ? (
              <div className="flex items-center gap-6">
                <Link to="/notifications" className="p-3 text-slate-400 hover:text-brand-gold hover:bg-white/5 rounded-2xl transition-all relative border border-transparent hover:border-white/5">
                  <Bell size={22} />
                  <span className="absolute top-3 right-3 w-2.5 h-2.5 bg-brand-gold rounded-full border-2 border-[#020617] animate-pulse"></span>
                </Link>
                <Link to="/dashboard" className="hidden lg:block nav-link text-sm uppercase tracking-widest font-black">Dashboard</Link>
                {user?.role === 'admin' && (
                  <Link to="/admin" className="hidden lg:block nav-link text-sm uppercase tracking-widest font-black text-brand-gold hover:text-white transition-colors">Admin Panel</Link>
                )}
                <Link to="/profile" className="flex items-center gap-3 p-1.5 hover:bg-white/5 rounded-2xl transition-all border border-transparent hover:border-white/5 pr-4">
                  <div className="w-10 h-10 bg-gradient-to-br from-brand-blue to-brand-blue-dark rounded-xl flex items-center justify-center text-brand-gold font-black border border-white/10 shadow-xl">
                    {user?.fullName?.charAt(0) || user?.username?.charAt(0) || 'U'}
                  </div>
                  <span className="text-sm font-bold text-white hidden sm:block">{user?.fullName || user?.username}</span>
                </Link>
                <button 
                  onClick={logout}
                  className="hidden md:block text-xs font-black uppercase tracking-widest text-slate-500 hover:text-rose-500 transition-colors"
                >
                  Logout
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-4">
                <Link to="/login" className="flex items-center gap-2 text-slate-400 hover:text-white font-black text-xs uppercase tracking-widest px-4 py-2 transition-all">
                  <LogIn size={18} />
                  <span className="hidden sm:inline">Login</span>
                </Link>
                <Link to="/register" className="btn-accent !py-3 !px-6 !rounded-2xl text-xs uppercase tracking-[0.15em]">
                  <span className="hidden sm:inline">Join CIRS</span>
                  <span className="sm:hidden">Join</span>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
