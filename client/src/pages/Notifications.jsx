import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Bell, 
  CheckCircle, 
  AlertCircle, 
  MessageSquare, 
  ArrowLeft,
  Trash2,
  Clock
} from 'lucide-react';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import useNotificationStore from '../store/useNotificationStore';

export default function Notifications() {
  const { notifications, fetchNotifications, markAsRead, clearAll, loading } = useNotificationStore();

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const getIconAndBg = (type) => {
    switch(type) {
      case 'claim_submitted':
        return { icon: <AlertCircle className="text-brand-gold" size={24} />, bg: 'bg-brand-gold/10' };
      case 'claim_approved':
      case 'match_found':
        return { icon: <CheckCircle className="text-emerald-400" size={24} />, bg: 'bg-emerald-400/10' };
      case 'claim_rejected':
        return { icon: <AlertCircle className="text-rose-400" size={24} />, bg: 'bg-rose-400/10' };
      default:
        return { icon: <MessageSquare className="text-sky-400" size={24} />, bg: 'bg-sky-400/10' };
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-12 animate-fade-in pb-20 pt-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
        <div className="space-y-4">
          <Link to="/dashboard" className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 hover:text-brand-gold mb-2 transition-all group">
            <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
            Back to Dashboard
          </Link>
          <h1 className="text-4xl lg:text-5xl font-black text-white tracking-tighter leading-tight">
            Activity <span className="text-brand-gold">Alerts</span>
          </h1>
          <p className="text-slate-400 font-medium max-w-xl">
            Stay updated on your reports, claims, and messages from the campus community.
          </p>
        </div>
        <Button variant="ghost" size="sm" icon={Trash2} className="h-fit" onClick={clearAll}>Clear All</Button>
      </div>

      {/* Notifications List */}
      <div className="space-y-6">
        {loading ? (
           <p className="text-slate-400 text-center py-10">Loading notifications...</p>
        ) : notifications.length > 0 ? (
          notifications.map((notif) => {
            const { icon, bg } = getIconAndBg(notif.type);
            return (
              <div 
                key={notif._id} 
                className={`group glass-card p-8 rounded-[2.5rem] border-white/5 transition-all hover:border-brand-gold/30 relative overflow-hidden ${!notif.read ? 'bg-white/[0.03]' : 'opacity-60'}`}
              >
                {!notif.read && (
                  <div className="absolute top-0 left-0 w-1 h-full bg-brand-gold shadow-[0_0_15px_#FFD700]"></div>
                )}
                
                <div className="flex flex-col sm:flex-row items-start gap-8 relative z-10">
                  <div className={`w-16 h-16 ${bg} rounded-2xl flex items-center justify-center shrink-0 border border-white/5 shadow-2xl`}>
                    {icon}
                  </div>
                  
                  <div className="flex-grow space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xl font-black text-white tracking-tight group-hover:text-brand-gold transition-colors">{notif.title}</h3>
                      <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-500">
                        <Clock size={12} />
                        {new Date(notif.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                    <p className="text-sm text-slate-400 leading-relaxed font-medium max-w-2xl">{notif.message}</p>
                    
                    <div className="pt-4 flex items-center gap-4">
                      {notif.link && (
                        <Link to={notif.link}>
                          <Button variant="accent" size="sm" onClick={() => markAsRead(notif._id)}>View Details</Button>
                        </Link>
                      )}
                      {!notif.read && (
                        <Button variant="ghost" size="sm" onClick={() => markAsRead(notif._id)}>Mark as Read</Button>
                      )}
                      {!notif.read && <Badge variant="warning">New</Badge>}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-center py-32 glass-card rounded-[4rem] border-2 border-dashed border-white/10">
             <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-8 border border-white/10">
                <Bell size={40} className="text-slate-700" />
             </div>
             <h3 className="text-2xl font-black text-white uppercase tracking-widest">Inbox Clean</h3>
             <p className="text-slate-400 mt-4 font-medium">You're all caught up! No new notifications.</p>
          </div>
        )}
      </div>
    </div>
  );
}
