import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import useItemStore from '../store/useItemStore';
import useAuthStore from '../store/useAuthStore';
import claimApi from '../api/claimApi';
import { MapPin, Calendar, User, Tag, ArrowLeft, ShieldCheck, MessageCircle, Share2, Info, Check, X } from 'lucide-react';
import { toast } from 'sonner';

export default function ItemDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { items, singleItem, fetchItemById, loading } = useItemStore();
  const { user } = useAuthStore();
  
  const [claims, setClaims] = useState([]);
  const [loadingClaims, setLoadingClaims] = useState(false);
  
  useEffect(() => {
    const existing = items.find(i => (i._id || i.id) === id);
    if (!existing && !loading && singleItem?._id !== id) {
      fetchItemById(id);
    }
  }, [id, items, fetchItemById, singleItem, loading]);

  const item = items.find(i => (i._id || i.id) === id) || (singleItem?._id === id ? singleItem : null);

  const userId = user?._id?.toString() || user?.id?.toString();
  const isFinder = user && item && (item.postedBy?._id || item.postedBy)?.toString() === userId;

  useEffect(() => {
    if (isFinder && item.status === 'found') {
      setLoadingClaims(true);
      claimApi.getItemClaims(item._id || item.id)
        .then(res => {
          if (res.success) setClaims(res.data);
          setLoadingClaims(false);
        })
        .catch(err => {
          console.error('Failed to fetch claims', err);
          setLoadingClaims(false);
        });
    }
  }, [isFinder, item]);

  const handleUpdateClaim = async (claimId, status) => {
    try {
      const res = await claimApi.updateClaimStatus(claimId, status);
      if (res.success) {
        setClaims(claims.map(c => c._id === claimId ? { ...c, status } : c));
        toast.success(status === 'approved' ? 'Claim approved — claimant notified.' : 'Claim rejected.');
      }
    } catch (err) {
      toast.error('Failed to update claim status. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="text-center py-32 animate-pulse">
        <h2 className="text-2xl font-bold text-white uppercase tracking-widest">Loading details...</h2>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="text-center py-20">
        <h2 className="text-2xl font-bold">Item not found</h2>
        <button onClick={() => navigate('/')} className="mt-4 text-sky-600 hover:underline">Return to Home</button>
      </div>
    );
  }

  const isFound = item.status === 'found';
  const isResolved = item.status === 'resolved';

  return (
    <div className="max-w-6xl mx-auto animate-fade-in pb-20 pt-8">
      <button onClick={() => navigate(-1)} className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] text-slate-500 hover:text-brand-gold mb-10 transition-all group">
        <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
        Back to Browse
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
        {/* Image Section */}
        <div className="space-y-8">
          <div className="rounded-[3rem] overflow-hidden shadow-[0_0_50px_rgba(0,33,71,0.3)] border border-white/10 bg-slate-900/50 backdrop-blur-xl">
             <img 
               src={item.image} 
               alt={item.title} 
               className="w-full aspect-square object-cover"
             />
          </div>
          <div className="grid grid-cols-3 gap-6">
             {[1, 2, 3].map(i => (
                <div key={i} className="aspect-square rounded-2xl bg-white/5 border border-white/5 hover:border-brand-gold/50 cursor-pointer overflow-hidden transition-all group">
                   <img src={item.image} className="w-full h-full object-cover opacity-40 group-hover:opacity-100 transition-opacity" alt="thumbnail" />
                </div>
             ))}
          </div>
        </div>

        {/* Content Section */}
        <div className="space-y-12">
          <div className="space-y-6">
            <div className="flex items-center gap-4">
               <span className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] shadow-2xl backdrop-blur-md border border-white/10 ${
                 isFound ? 'bg-emerald-500/80 text-white' :
                 isResolved ? 'bg-purple-500/80 text-white' :
                 'bg-rose-500/80 text-white'
               }`}>
                 {item.status}
               </span>
               <span className="text-xs font-black text-brand-gold uppercase tracking-[0.25em]">{item.category}</span>
            </div>
            
            <h1 className="text-5xl lg:text-6xl font-black text-white tracking-tighter leading-tight">
              {item.title}
            </h1>
            
            <div className="flex flex-wrap items-center gap-8 pt-2">
               <div className="flex items-center gap-3 text-slate-400">
                  <div className="p-2 bg-brand-blue/30 rounded-lg">
                    <MapPin size={18} className="text-brand-gold" />
                  </div>
                  <span className="text-sm font-bold tracking-wide">{item.location}</span>
               </div>
               <div className="flex items-center gap-3 text-slate-400">
                  <div className="p-2 bg-brand-blue/30 rounded-lg">
                    <Calendar size={18} className="text-brand-gold" />
                  </div>
                  <span className="text-sm font-bold tracking-wide">Reported {new Date(item.date).toLocaleDateString()}</span>
               </div>
            </div>
          </div>

          <div className="p-10 bg-slate-900/40 border border-white/5 rounded-[3rem] space-y-8 backdrop-blur-xl">
             <h3 className="text-xl font-black text-white uppercase tracking-widest flex items-center gap-3">
               <span className="w-8 h-px bg-brand-gold/30"></span>
               Description
             </h3>
             <p className="text-slate-400 leading-relaxed font-medium text-lg">
               {item.description}
             </p>
             <div className="flex items-center gap-5 pt-8 border-t border-white/5">
                <div className="w-14 h-14 bg-brand-blue/50 rounded-2xl flex items-center justify-center text-brand-gold border border-white/10 shadow-xl">
                   <User size={28} />
                </div>
                <div>
                   <p className="text-[10px] font-black uppercase tracking-[0.25em] text-brand-gold/60">Reported By</p>
                   <p className="font-black text-white text-lg tracking-tight">{item.postedBy?.fullName || item.postedBy}</p>
                </div>
             </div>
          </div>

           <div className="flex flex-col sm:flex-row gap-5 pt-4">
             {!isFinder && isFound && (
               <Link to={`/submit-claim/${item._id || item.id}`} className="flex-grow">
                 <button className="w-full btn-accent flex items-center justify-center gap-3 py-5 text-sm uppercase tracking-[0.2em] font-black">
                   This is mine — Claim It
                   <ShieldCheck size={22} />
                 </button>
               </Link>
             )}
             {isResolved && !isFinder && (
               <div className="flex-grow py-5 px-6 bg-purple-500/10 border border-purple-500/20 rounded-[2rem] text-center">
                 <p className="text-purple-400 font-black text-xs uppercase tracking-widest">Item Resolved</p>
                 <p className="text-slate-400 text-xs mt-1">This item has already been claimed and returned to its owner.</p>
               </div>
             )}
             <button className="btn-secondary flex items-center justify-center gap-3 py-5 px-8 text-sm uppercase tracking-[0.2em] font-black border-white/10 bg-white/5">
               Contact {isFound ? 'Finder' : 'Owner'}
               <MessageCircle size={22} />
             </button>
             <button className="p-5 bg-white/5 text-slate-400 hover:text-brand-gold hover:bg-white/10 rounded-[1.5rem] transition-all border border-white/5">
                <Share2 size={24} />
             </button>
          </div>

           <div className="bg-amber-950/20 p-8 rounded-[2rem] border border-amber-900/30 flex gap-5 backdrop-blur-sm">
              <div className="w-10 h-10 bg-amber-900/30 rounded-xl flex items-center justify-center shrink-0">
                <Info className="text-amber-500" size={20} />
              </div>
              <p className="text-xs text-amber-200/70 leading-relaxed font-medium">
                 <span className="font-black text-amber-500 uppercase tracking-widest block mb-1">Security Notice</span> 
                 For your safety, always meet in public campus locations or at the security office when retrieving items. Never share sensitive personal information until ownership is verified.
              </p>
           </div>

           {isFinder && (isFound || item.status === 'resolved') && (
             <div className="mt-12 space-y-6">
               <div className="flex items-center justify-between">
                 <h3 className="text-2xl font-black text-white">Claims ({claims.length})</h3>
                 <span className="text-xs text-slate-500 font-bold">Auto-graded by verification engine</span>
               </div>
               {loadingClaims ? (
                 <div className="space-y-3">
                   {[1,2].map(i => <div key={i} className="h-32 bg-white/5 rounded-[2rem] animate-pulse" />)}
                 </div>
               ) : claims.length === 0 ? (
                 <div className="p-8 bg-white/5 rounded-[2rem] border border-white/5 text-center">
                   <p className="text-slate-500 font-medium">No claims submitted yet.</p>
                 </div>
               ) : (
                 <div className="space-y-4">
                   {claims.map(claim => (
                     <div key={claim._id} className="p-6 bg-slate-900/60 rounded-[2rem] border border-white/10 space-y-5">
                       {/* Header */}
                       <div className="flex justify-between items-start gap-4">
                         <div className="flex items-center gap-3">
                           <div className="w-10 h-10 bg-brand-blue/50 rounded-xl flex items-center justify-center text-brand-gold font-black border border-white/10">
                             {claim.claimant?.fullName?.charAt(0) || '?'}
                           </div>
                           <div>
                             <p className="text-white font-bold">{claim.claimant?.fullName}</p>
                             <p className="text-xs text-slate-400">{claim.claimant?.email}</p>
                           </div>
                         </div>
                         <span className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest shrink-0 ${
                           claim.passed ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/20' :
                           claim.status === 'pending' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/20' :
                           'bg-rose-500/20 text-rose-400 border border-rose-500/20'
                         }`}>
                           {claim.passed ? '✓ Passed' : claim.status}
                         </span>
                       </div>

                       {/* Score bar */}
                       {claim.totalQuestions > 0 && (
                         <div className="space-y-1.5">
                           <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                             <span className="text-slate-500">Score</span>
                             <span className={claim.passed ? 'text-emerald-400' : 'text-rose-400'}>
                               {claim.score}/{claim.totalQuestions} correct
                             </span>
                           </div>
                           <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                             <div
                               className={`h-full rounded-full transition-all ${claim.passed ? 'bg-emerald-500' : 'bg-rose-500'}`}
                               style={{ width: `${(claim.score / claim.totalQuestions) * 100}%` }}
                             />
                           </div>
                         </div>
                       )}

                       {/* Answers */}
                       <div className="space-y-2 pt-2 border-t border-white/5">
                         {claim.answers.map((ans, i) => (
                           <div key={i} className="flex items-start gap-3 bg-white/5 p-3 rounded-xl">
                             <span className="mt-0.5 shrink-0">
                               {ans.isCorrect
                                 ? <Check size={14} className="text-emerald-500" />
                                 : <X size={14} className="text-rose-500" />}
                             </span>
                             <div className="min-w-0">
                               <p className="text-[10px] text-slate-500 mb-0.5">Q: {ans.question}</p>
                               <p className="text-sm text-white font-bold truncate">A: {ans.providedAnswer}</p>
                             </div>
                           </div>
                         ))}
                       </div>

                       {/* Manual override (only if not auto-graded/passed) */}
                       {!claim.passed && claim.status === 'pending' && (
                         <div className="flex gap-3 pt-2">
                           <button onClick={() => handleUpdateClaim(claim._id, 'approved')} className="flex-1 py-2.5 bg-emerald-500/20 text-emerald-400 text-xs font-black rounded-xl hover:bg-emerald-500 hover:text-white transition-colors border border-emerald-500/20">
                             Override: Approve
                           </button>
                           <button onClick={() => handleUpdateClaim(claim._id, 'rejected')} className="flex-1 py-2.5 bg-rose-500/20 text-rose-400 text-xs font-black rounded-xl hover:bg-rose-500 hover:text-white transition-colors border border-rose-500/20">
                             Confirm Reject
                           </button>
                         </div>
                       )}
                     </div>
                   ))}
                 </div>
               )}
             </div>
           )}
        </div>
      </div>
    </div>
  );
}
