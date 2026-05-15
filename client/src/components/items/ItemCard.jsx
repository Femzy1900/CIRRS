import { MapPin, Calendar, User, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function ItemCard({ item }) {
  const isFound = item.status === 'found';

  return (
    <div className="group bg-slate-900/40 backdrop-blur-xl rounded-[2rem] overflow-hidden border border-white/5 hover:border-brand-gold/30 hover:shadow-[0_0_40px_rgba(255,215,0,0.05)] transition-all duration-500 flex flex-col h-full animate-fade-in">
      {/* Image Section */}
      <div className="relative h-64 overflow-hidden">
        <img
          src={item.image}
          alt={item.title}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 to-transparent"></div>
        <div className="absolute top-5 left-5">
          <span className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] shadow-2xl backdrop-blur-md border border-white/10 ${
            isFound ? 'bg-emerald-500/80 text-white' : 'bg-rose-500/80 text-white'
          }`}>
            {item.status}
          </span>
        </div>
        <div className="absolute bottom-5 right-5 opacity-0 group-hover:opacity-100 transition-all duration-500 translate-y-2 group-hover:translate-y-0">
           <span className="bg-brand-gold text-brand-blue-dark p-2.5 rounded-xl shadow-2xl flex items-center gap-2 font-bold text-xs">
             <Calendar size={14} />
             {new Date().toLocaleDateString()}
           </span>
        </div>
      </div>

      {/* Content Section */}
      <div className="p-8 flex flex-col flex-grow">
        <div className="flex items-center gap-2 text-brand-gold text-[10px] font-black uppercase tracking-[0.25em] mb-4">
          <span className="w-8 h-px bg-brand-gold/30"></span>
          <span>{item.category}</span>
        </div>
        
        <h3 className="text-2xl font-bold text-white mb-3 group-hover:text-brand-gold transition-colors leading-tight">
          {item.title}
        </h3>
        
        <p className="text-slate-400 text-sm line-clamp-2 mb-8 flex-grow leading-relaxed font-medium">
          {item.description}
        </p>

        <div className="space-y-4 mb-8">
          <div className="flex items-center gap-4 text-slate-300">
            <div className="p-2.5 bg-white/5 rounded-xl border border-white/5 group-hover:border-brand-gold/20 transition-colors">
              <MapPin size={18} className="text-brand-gold/70 group-hover:text-brand-gold" />
            </div>
            <span className="text-sm font-semibold tracking-wide">{item.location}</span>
          </div>
          <div className="flex items-center gap-4 text-slate-300">
            <div className="p-2.5 bg-white/5 rounded-xl border border-white/5 group-hover:border-brand-gold/20 transition-colors">
              <User size={18} className="text-brand-gold/70 group-hover:text-brand-gold" />
            </div>
            <span className="text-sm font-semibold tracking-wide">{item.postedBy}</span>
          </div>
        </div>

        <Link
          to={`/item/${item.id}`}
          className="flex items-center justify-center gap-3 w-full py-4 bg-white/5 text-white font-black text-sm uppercase tracking-widest rounded-2xl border border-white/10 group-hover:bg-brand-gold group-hover:text-brand-blue-dark group-hover:border-transparent transition-all duration-500 active:scale-95"
        >
          View Details
          <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>
    </div>
  );
}
