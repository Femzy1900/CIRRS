import React from 'react';
import useAuthStore from '../store/useAuthStore';
import useItemStore from '../store/useItemStore';
import { 
  Plus, 
  Package, 
  Clock, 
  CheckCircle, 
  Search, 
  ExternalLink,
  Bell,
  ArrowRight
} from 'lucide-react';
import { Link } from 'react-router-dom';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';

export default function Dashboard() {
  const { user } = useAuthStore();
  const { items } = useItemStore();

  const userReports = items.slice(0, 3);

  const stats = [
    { label: 'Active Reports', count: 2, icon: Package, color: 'text-sky-400', bg: 'bg-sky-400/10' },
    { label: 'Pending Claims', count: 1, icon: Clock, color: 'text-brand-gold', bg: 'bg-brand-gold/10' },
    { label: 'Recovered Items', count: 5, icon: CheckCircle, color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
  ];

  return (
    <div className="space-y-12 animate-fade-in pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
        <div className="space-y-2">
          <h1 className="text-4xl lg:text-5xl font-black text-white tracking-tighter leading-tight">
            Welcome back, <br /><span className="text-brand-gold">{user?.name || 'Student'}!</span>
          </h1>
          <p className="text-slate-400 font-medium max-w-xl">
            You have <span className="text-white font-bold">2 active reports</span> and 1 new notification since your last visit.
          </p>
        </div>
        <div className="flex items-center gap-4">
           <Link to="/report/lost">
             <Button variant="secondary" size="lg" icon={Plus}>Lost Item</Button>
           </Link>
           <Link to="/report/found">
             <Button variant="accent" size="lg" icon={Plus}>Found Item</Button>
           </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
        {stats.map((stat, i) => (
          <div key={i} className="glass-card p-8 rounded-[2.5rem] border-white/5 relative overflow-hidden group">
            <div className={`absolute top-0 right-0 w-24 h-24 ${stat.bg} rounded-full blur-3xl -mr-10 -mt-10 opacity-50 group-hover:opacity-100 transition-opacity`}></div>
            <div className="flex items-center gap-6 relative z-10">
              <div className={`w-16 h-16 ${stat.bg} ${stat.color} rounded-2xl flex items-center justify-center border border-white/5 shadow-2xl`}>
                <stat.icon size={28} />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-500 mb-1">{stat.label}</p>
                <p className="text-3xl font-black text-white">{stat.count}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* Recent Activity */}
        <div className="lg:col-span-2 space-y-8">
           <div className="flex items-center justify-between px-2">
              <h2 className="text-2xl font-black text-white uppercase tracking-widest flex items-center gap-3">
                <span className="w-8 h-px bg-brand-gold/30"></span>
                My Recent Reports
              </h2>
              <Link to="/my-reports" className="text-xs font-black text-brand-gold hover:text-white transition-colors uppercase tracking-widest">View All Reports</Link>
           </div>

           <div className="grid grid-cols-1 gap-6">
              {userReports.map((item) => (
                <div key={item.id} className="group glass-card p-6 rounded-[2rem] border-white/5 hover:border-brand-gold/30 transition-all flex flex-col sm:flex-row items-center gap-8">
                   <div className="w-full sm:w-32 h-32 rounded-2xl overflow-hidden shrink-0 border border-white/10">
                      <img src={item.image} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt={item.title} />
                   </div>
                   <div className="flex-grow space-y-3 text-center sm:text-left">
                      <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3">
                        <Badge variant={item.status === 'found' ? 'success' : 'danger'}>
                          {item.status}
                        </Badge>
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">{item.date}</span>
                      </div>
                      <h3 className="text-xl font-black text-white tracking-tight group-hover:text-brand-gold transition-colors">{item.title}</h3>
                      <p className="text-xs text-slate-400 font-medium">{item.location}</p>
                   </div>
                   <Link to={`/item/${item.id}`}>
                      <Button variant="ghost" size="sm" icon={ExternalLink}>Details</Button>
                   </Link>
                </div>
              ))}
           </div>
        </div>

        {/* Sidebar Cards */}
        <div className="space-y-10">
           {/* Notifications */}
           <div className="glass-card p-10 rounded-[3rem] space-y-8 border-white/5 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-brand-gold/5 rounded-full blur-3xl -mr-16 -mt-16"></div>
              <h2 className="text-xl font-black text-white uppercase tracking-widest flex items-center gap-3 relative z-10">
                <Bell size={20} className="text-brand-gold" />
                Alerts
              </h2>
              <div className="space-y-6 relative z-10">
                 <div className="flex gap-5 pb-6 border-b border-white/5 group cursor-pointer">
                    <div className="w-2 h-2 bg-brand-gold rounded-full mt-2 shrink-0 shadow-[0_0_10px_#FFD700]"></div>
                    <div>
                       <p className="text-sm text-slate-300 leading-relaxed font-medium">
                          <span className="font-black text-white block mb-1">Potential Match Found!</span>
                          An item matching your "Laptop Case" was reported at the library.
                       </p>
                       <span className="text-[10px] font-black uppercase tracking-widest text-brand-gold/60 mt-2 block">2 hours ago</span>
                    </div>
                 </div>
                 <div className="flex gap-5 pb-6 border-b border-white/5 opacity-50 group cursor-pointer">
                    <div className="w-2 h-2 bg-slate-600 rounded-full mt-2 shrink-0"></div>
                    <div>
                       <p className="text-sm text-slate-300 leading-relaxed font-medium">
                          <span className="font-black text-white block mb-1">Claim Verified</span>
                          Your claim for "Silver Watch" has been approved by the finder.
                       </p>
                       <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 mt-2 block">Yesterday</span>
                    </div>
                 </div>
              </div>
              <Link to="/notifications">
                <Button variant="ghost" size="sm" className="w-full mt-4">View All Notifications</Button>
              </Link>
           </div>

           {/* Global Search Promo */}
           <div className="bg-gradient-to-br from-slate-900 to-brand-blue/50 p-10 rounded-[3rem] border border-white/10 text-white space-y-6 relative overflow-hidden group shadow-2xl">
              <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10"></div>
              <div className="relative z-10 space-y-6">
                <div className="w-14 h-14 bg-brand-gold rounded-2xl flex items-center justify-center text-brand-blue-dark shadow-2xl group-hover:rotate-12 transition-transform">
                  <Search size={28} />
                </div>
                <div className="space-y-2">
                  <h3 className="text-2xl font-black tracking-tight">Need a deeper search?</h3>
                  <p className="text-sm text-slate-400 font-medium leading-relaxed">Our AI-powered engine scans the entire campus database 24/7 for matches.</p>
                </div>
                <button className="flex items-center gap-3 text-brand-gold font-black uppercase tracking-widest text-[10px] group-hover:gap-5 transition-all">
                  Open Global Search <ArrowRight size={16} />
                </button>
              </div>
              <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-brand-gold/10 rounded-full blur-[80px] group-hover:bg-brand-gold/20 transition-all"></div>
           </div>
        </div>
      </div>
    </div>
  );
}
