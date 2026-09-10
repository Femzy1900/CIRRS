import { MapPin, Calendar, User, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function ItemCard({ item }) {
  const statusStyle =
    item.status === 'found'     ? 'bg-emerald-500/80 text-white' :
    item.status === 'claimed'   ? 'bg-amber-500/80 text-white' :
    item.status === 'resolved'  ? 'bg-purple-500/80 text-white' :
    'bg-rose-500/80 text-white';

  return (
    <div className="group bg-slate-900/40 backdrop-blur-xl rounded-[1.5rem] overflow-hidden border border-white/5 hover:border-brand-gold/30 hover:shadow-[0_0_30px_rgba(255,215,0,0.05)] transition-all duration-500 flex flex-col h-full animate-fade-in">
      {/* Image Section */}
      <div className="relative h-44 overflow-hidden">
        <img
          src={item.image}
          alt={item.title}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 to-transparent"></div>
        <div className="absolute top-3 left-3 flex items-center gap-1.5 flex-wrap">
          <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-[0.2em] shadow-xl backdrop-blur-md border border-white/10 ${statusStyle}`}>
            {item.status}
          </span>
          {item.hasApprovedClaim && item.status !== 'resolved' && (
            <span className="px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-[0.15em] shadow-xl backdrop-blur-md border border-amber-500/30 bg-amber-500/90 text-white">
              🔒 Pending Handover
            </span>
          )}
        </div>
        <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-all duration-500 translate-y-1 group-hover:translate-y-0">
          <span className="bg-brand-gold text-brand-blue-dark px-2.5 py-1 rounded-lg shadow-xl flex items-center gap-1.5 font-bold text-[10px]">
            <Calendar size={11} />
            {new Date(item.date).toLocaleDateString()}
          </span>
        </div>
      </div>

      {/* Content Section */}
      <div className="p-5 flex flex-col flex-grow">
        <div className="flex items-center gap-2 text-brand-gold text-[9px] font-black uppercase tracking-[0.25em] mb-2.5">
          <span className="w-5 h-px bg-brand-gold/30"></span>
          <span>{item.category}</span>
        </div>

        <h3 className="text-base font-bold text-white mb-2 group-hover:text-brand-gold transition-colors leading-snug">
          {item.title}
        </h3>

        <p className="text-slate-400 text-xs line-clamp-2 mb-4 flex-grow leading-relaxed font-medium">
          {item.description}
        </p>

        <div className="space-y-2 mb-4">
          <div className="flex items-center gap-2.5 text-slate-300">
            <div className="p-1.5 bg-white/5 rounded-lg border border-white/5 group-hover:border-brand-gold/20 transition-colors shrink-0">
              <MapPin size={13} className="text-brand-gold/70 group-hover:text-brand-gold" />
            </div>
            <span className="text-xs font-semibold truncate">{item.location}</span>
          </div>
          <div className="flex items-center gap-2.5 text-slate-300">
            <div className="p-1.5 bg-white/5 rounded-lg border border-white/5 group-hover:border-brand-gold/20 transition-colors shrink-0">
              <User size={13} className="text-brand-gold/70 group-hover:text-brand-gold" />
            </div>
            <span className="text-xs font-semibold truncate">{item.postedBy?.fullName || item.postedBy?.username || 'Unknown'}</span>
          </div>
        </div>

        <Link
          to={`/item/${item._id || item.id}`}
          className="flex items-center justify-center gap-2 w-full py-2.5 bg-white/5 text-white font-black text-xs uppercase tracking-widest rounded-xl border border-white/10 group-hover:bg-brand-gold group-hover:text-brand-blue-dark group-hover:border-transparent transition-all duration-500 active:scale-95"
        >
          View Details
          <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
        </Link>
      </div>
    </div>
  );
}
