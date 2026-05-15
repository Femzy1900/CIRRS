import React, { useState } from 'react';
import useItemStore from '../store/useItemStore';
import { 
  FileText, 
  Search, 
  Filter, 
  MoreVertical, 
  ExternalLink,
  Edit,
  Trash2,
  ArrowLeft
} from 'lucide-react';
import { Link } from 'react-router-dom';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';

export default function MyReports() {
  const { items } = useItemStore();
  const [filter, setFilter] = useState('all');

  const myItems = items.filter(item => {
    if (filter === 'all') return true;
    return item.status === filter;
  });

  return (
    <div className="max-w-6xl mx-auto space-y-12 animate-fade-in pb-20 pt-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
        <div className="space-y-4">
          <Link to="/dashboard" className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 hover:text-brand-gold mb-2 transition-all group">
            <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
            Back to Dashboard
          </Link>
          <h1 className="text-4xl lg:text-5xl font-black text-white tracking-tighter leading-tight">
            My <span className="text-brand-gold">Reports</span>
          </h1>
          <p className="text-slate-400 font-medium max-w-xl">
            Track and manage all the items you have reported as lost or found on campus.
          </p>
        </div>
        
        <div className="flex items-center gap-2 p-1.5 bg-white/5 backdrop-blur-md rounded-2xl border border-white/10">
          {['all', 'lost', 'found'].map((type) => (
            <button
              key={type}
              onClick={() => setFilter(type)}
              className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                filter === type 
                  ? 'bg-brand-gold text-brand-blue-dark shadow-lg scale-105' 
                  : 'text-slate-500 hover:text-white'
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {/* Reports Grid */}
      <div className="grid grid-cols-1 gap-6">
        {myItems.length > 0 ? (
          myItems.map((item) => (
            <div key={item.id} className="group glass-card p-6 rounded-[2.5rem] border-white/5 hover:border-brand-gold/30 transition-all flex flex-col md:flex-row items-center gap-8 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-brand-gold/5 rounded-full blur-3xl -mr-16 -mt-16 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              
              <div className="w-full md:w-48 h-48 rounded-[2rem] overflow-hidden shrink-0 border border-white/10 shadow-2xl">
                 <img src={item.image} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" alt={item.title} />
              </div>

              <div className="flex-grow space-y-4 text-center md:text-left relative z-10">
                 <div className="flex flex-wrap items-center justify-center md:justify-start gap-4">
                    <Badge variant={item.status === 'found' ? 'success' : 'danger'}>
                       {item.status}
                    </Badge>
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-gold/60">REF: {item.id.slice(0, 8)}</span>
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">{item.date}</span>
                 </div>
                 
                 <div>
                    <h3 className="text-3xl font-black text-white tracking-tighter group-hover:text-brand-gold transition-colors">{item.title}</h3>
                    <p className="text-sm text-slate-400 font-medium mt-2 max-w-2xl">{item.description}</p>
                 </div>

                 <div className="flex items-center justify-center md:justify-start gap-6 text-slate-500">
                    <div className="flex items-center gap-2">
                       <Filter size={14} className="text-brand-gold" />
                       <span className="text-[10px] font-black uppercase tracking-widest">{item.category}</span>
                    </div>
                    <div className="flex items-center gap-2">
                       <Search size={14} className="text-brand-gold" />
                       <span className="text-[10px] font-black uppercase tracking-widest">{item.location}</span>
                    </div>
                 </div>
              </div>

              <div className="flex flex-row md:flex-col gap-3 shrink-0 relative z-10">
                 <Link to={`/item/${item.id}`}>
                    <Button variant="secondary" size="sm" icon={ExternalLink} className="w-full">Details</Button>
                 </Link>
                 <Button variant="ghost" size="sm" icon={Edit}>Edit</Button>
                 <Button variant="danger" size="sm" icon={Trash2}>Remove</Button>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-32 glass-card rounded-[4rem] border-2 border-dashed border-white/10">
             <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-8 border border-white/10">
                <FileText size={40} className="text-slate-700" />
             </div>
             <h3 className="text-2xl font-black text-white uppercase tracking-widest">No reports found</h3>
             <p className="text-slate-400 mt-4 font-medium max-w-sm mx-auto leading-relaxed">
                You haven't submitted any reports in this category yet.
             </p>
             <div className="mt-10 flex items-center justify-center gap-4">
                <Link to="/report-lost">
                  <Button variant="accent" size="lg">Report Lost</Button>
                </Link>
                <Link to="/report-found">
                  <Button variant="secondary" size="lg">Report Found</Button>
                </Link>
             </div>
          </div>
        )}
      </div>
    </div>
  );
}
