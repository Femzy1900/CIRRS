import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, Bell, PlusCircle, LogIn, Menu, X, LayoutDashboard, FileText, User, LogOut, ShieldAlert, Home, Info, Library } from 'lucide-react';
import useAuthStore from '../../store/useAuthStore';
import useNotificationStore from '../../store/useNotificationStore';
import useItemStore from '../../store/useItemStore';

export default function Navbar() {
  const { isAuthenticated, user, logout } = useAuthStore();
  const { unreadCount } = useNotificationStore();
  const { fetchItems, setSearch } = useItemStore();
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();

  const handleSearch = (e) => {
    const q = e.target.value;
    setSearch(q);
    if (window.location.pathname !== '/') navigate('/');
  };

  const handleLogout = async () => {
    await logout();
    setMenuOpen(false);
    navigate('/');
  };

  const closeMenu = () => setMenuOpen(false);

  return (
    <>
      <nav className="sticky top-0 z-50 bg-[#020617]/80 backdrop-blur-xl border-b border-white/5">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-20">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-3 group" onClick={closeMenu}>
              <div className="w-12 h-12 bg-brand-blue rounded-2xl flex items-center justify-center text-brand-gold shadow-[0_0_20px_rgba(0,33,71,0.5)] group-hover:rotate-12 transition-all duration-500 border border-white/10 group-hover:scale-110">
                <PlusCircle size={28} />
              </div>
              <div className="flex flex-col leading-tight">
                <span className="text-2xl font-black tracking-tighter text-white">CIRS</span>
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
                  onChange={handleSearch}
                  className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/5 focus:border-brand-gold/50 focus:bg-white/10 focus:ring-4 focus:ring-brand-gold/5 rounded-2xl transition-all outline-none text-sm text-white placeholder:text-slate-500"
                />
              </div>
            </div>

            {/* Desktop Nav */}
            <div className="hidden lg:flex items-center gap-6">
              <Link to="/" className="nav-link text-sm uppercase tracking-widest font-black">Home</Link>
              <Link to="/browse" className="nav-link text-sm uppercase tracking-widest font-black">Browse</Link>
              <Link to="/about" className="nav-link text-sm uppercase tracking-widest font-black">About</Link>

              {isAuthenticated ? (
                <div className="flex items-center gap-6">
                  <Link to="/notifications" className="p-3 text-slate-400 hover:text-brand-gold hover:bg-white/5 rounded-2xl transition-all relative border border-transparent hover:border-white/5">
                    <Bell size={22} />
                    {unreadCount > 0 && (
                      <span className="absolute top-3 right-3 w-2.5 h-2.5 bg-brand-gold rounded-full border-2 border-[#020617] animate-pulse"></span>
                    )}
                  </Link>
                  <Link to="/dashboard" className="nav-link text-sm uppercase tracking-widest font-black">Dashboard</Link>
                  {user?.role === 'admin' && (
                    <Link to="/admin" className="nav-link text-sm uppercase tracking-widest font-black text-brand-gold hover:text-white transition-colors">Admin</Link>
                  )}
                  <Link to="/profile" className="flex items-center gap-3 p-1.5 hover:bg-white/5 rounded-2xl transition-all border border-transparent hover:border-white/5 pr-4">
                    <div className="w-10 h-10 bg-gradient-to-br from-brand-blue to-brand-blue-dark rounded-xl flex items-center justify-center text-brand-gold font-black border border-white/10 shadow-xl">
                      {user?.fullName?.charAt(0) || user?.username?.charAt(0) || 'U'}
                    </div>
                    <span className="text-sm font-bold text-white">{user?.fullName || user?.username}</span>
                  </Link>
                  <button onClick={handleLogout} className="text-xs font-black uppercase tracking-widest text-slate-500 hover:text-rose-500 transition-colors">
                    Logout
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-4">
                  <Link to="/login" className="flex items-center gap-2 text-slate-400 hover:text-white font-black text-xs uppercase tracking-widest px-4 py-2 transition-all">
                    <LogIn size={18} />
                    Login
                  </Link>
                  <Link to="/register" className="btn-accent !py-3 !px-6 !rounded-2xl text-xs uppercase tracking-[0.15em]">
                    Join CIRS
                  </Link>
                </div>
              )}
            </div>

            {/* Mobile: bell + hamburger */}
            <div className="flex lg:hidden items-center gap-3">
              {isAuthenticated && (
                <Link to="/notifications" className="p-2 text-slate-400 hover:text-brand-gold relative">
                  <Bell size={22} />
                  {unreadCount > 0 && (
                    <span className="absolute top-2 right-2 w-2 h-2 bg-brand-gold rounded-full border border-[#020617] animate-pulse"></span>
                  )}
                </Link>
              )}
              <button
                onClick={() => setMenuOpen(o => !o)}
                className="p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-xl transition-all"
                aria-label="Toggle menu"
              >
                {menuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Drawer */}
      {menuOpen && (
        <div className="fixed inset-0 z-40 lg:hidden" onClick={closeMenu}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div
            className="absolute top-0 right-0 h-full w-80 max-w-[90vw] bg-[#020617] border-l border-white/5 flex flex-col shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            {/* Drawer header */}
            <div className="flex items-center justify-between p-6 border-b border-white/5">
              <span className="text-lg font-black text-white tracking-tight">Menu</span>
              <button onClick={closeMenu} className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-white/5 transition-all">
                <X size={20} />
              </button>
            </div>

            {/* Mobile search */}
            <div className="p-4 border-b border-white/5">
              <div className="relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-brand-gold transition-colors" size={18} />
                <input
                  type="text"
                  placeholder="Search items..."
                  onChange={handleSearch}
                  className="w-full pl-11 pr-4 py-3 bg-white/5 border border-white/5 focus:border-brand-gold/50 rounded-2xl transition-all outline-none text-sm text-white placeholder:text-slate-500"
                />
              </div>
            </div>

            {/* Nav links */}
            <nav className="flex-1 overflow-y-auto p-4 space-y-1">
              <MobileLink to="/" icon={Home} label="Home" onClick={closeMenu} />
              <MobileLink to="/browse" icon={Library} label="Browse All" onClick={closeMenu} />
              <MobileLink to="/about" icon={Info} label="About" onClick={closeMenu} />

              {isAuthenticated ? (
                <>
                  <div className="pt-4 pb-2 px-2">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-600">My Account</p>
                  </div>
                  <MobileLink to="/dashboard" icon={LayoutDashboard} label="Dashboard" onClick={closeMenu} />
                  <MobileLink to="/my-reports" icon={FileText} label="My Reports" onClick={closeMenu} />
                  <MobileLink to="/profile" icon={User} label="Profile" onClick={closeMenu} />
                  {user?.role === 'admin' && (
                    <MobileLink to="/admin" icon={ShieldAlert} label="Admin Panel" onClick={closeMenu} accent />
                  )}
                </>
              ) : null}
            </nav>

            {/* Drawer footer */}
            <div className="p-4 border-t border-white/5">
              {isAuthenticated ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-3 px-2 py-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-brand-blue to-brand-blue-dark rounded-xl flex items-center justify-center text-brand-gold font-black border border-white/10">
                      {user?.fullName?.charAt(0) || 'U'}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white">{user?.fullName}</p>
                      <p className="text-[10px] text-slate-500">{user?.email}</p>
                    </div>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-3 text-rose-500 hover:bg-rose-500/10 rounded-2xl transition-all text-sm font-bold"
                  >
                    <LogOut size={18} />
                    Logout
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <Link to="/login" onClick={closeMenu} className="w-full flex items-center justify-center gap-2 py-3 text-slate-300 hover:text-white border border-white/10 rounded-2xl text-sm font-bold transition-all hover:bg-white/5">
                    <LogIn size={18} />
                    Login
                  </Link>
                  <Link to="/register" onClick={closeMenu} className="btn-accent w-full flex items-center justify-center py-3 text-sm">
                    Join CIRS
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function MobileLink({ to, icon: Icon, label, onClick, accent }) {
  return (
    <Link
      to={to}
      onClick={onClick}
      className={`flex items-center gap-4 px-4 py-3 rounded-2xl text-sm font-bold transition-all ${
        accent
          ? 'text-brand-gold hover:bg-brand-gold/10'
          : 'text-slate-300 hover:text-white hover:bg-white/5'
      }`}
    >
      <Icon size={18} className={accent ? 'text-brand-gold' : 'text-slate-500'} />
      {label}
    </Link>
  );
}
