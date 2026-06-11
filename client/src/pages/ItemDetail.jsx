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

  const isFinder = user && item && (
    (typeof item.postedBy === 'string' && item.postedBy === user._id) ||
    (item.postedBy?._id === user._id)
  );

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
                 isFound ? 'bg-emerald-500/80 text-white' : 'bg-rose-500/80 text-white'
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
             {!isFinder && (
               <Link to={`/submit-claim/${item._id || item.id}`} className="flex-grow">
                 <button className="w-full btn-accent flex items-center justify-center gap-3 py-5 text-sm uppercase tracking-[0.2em] font-black">
                   {isFound ? 'This is mine (Claim)' : 'I found this'}
                   <ShieldCheck size={22} />
                 </button>
               </Link>
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

           {isFinder && isFound && (
             <div className="mt-12 space-y-6">
               <h3 className="text-2xl font-black text-white">Pending Claims ({claims.length})</h3>
               {loadingClaims ? (
                 <p className="text-slate-400">Loading claims...</p>
               ) : claims.length === 0 ? (
                 <p className="text-slate-500">No claims submitted yet.</p>
               ) : (
                 <div className="space-y-4">
                   {claims.map(claim => (
                     <div key={claim._id} className="p-6 bg-slate-900/60 rounded-[2rem] border border-white/10 space-y-4">
                       <div className="flex justify-between items-center">
                         <div>
                           <p className="text-white font-bold">{claim.claimant?.fullName}</p>
                           <p className="text-xs text-slate-400">{claim.claimant?.email}</p>
                         </div>
                         <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                           claim.status === 'pending' ? 'bg-amber-500/20 text-amber-500' :
                           claim.status === 'approved' ? 'bg-emerald-500/20 text-emerald-500' :
                           'bg-rose-500/20 text-rose-500'
                         }`}>
                           {claim.status}
                         </span>
                       </div>
                       
                       <div className="space-y-3 pt-4 border-t border-white/5">
                         {claim.answers.map((ans, i) => (
                           <div key={i} className="bg-white/5 p-4 rounded-xl">
                             <p className="text-xs text-slate-400 mb-1">Q: {ans.question}</p>
                             <div className="flex items-center gap-2">
                               <span className="text-sm text-white font-bold">A: {ans.providedAnswer}</span>
                               {ans.isCorrect !== undefined && (
                                 ans.isCorrect ? <Check size={16} className="text-emerald-500" /> : <X size={16} className="text-rose-500" />
                               )}
                             </div>
                           </div>
                         ))}
                       </div>

                       {claim.status === 'pending' && (
                         <div className="flex gap-4 pt-4">
                           <button onClick={() => handleUpdateClaim(claim._id, 'approved')} className="flex-1 py-3 bg-emerald-500/20 text-emerald-500 font-bold rounded-xl hover:bg-emerald-500 hover:text-white transition-colors">
                             Approve & Share Contact
                           </button>
                           <button onClick={() => handleUpdateClaim(claim._id, 'rejected')} className="flex-1 py-3 bg-rose-500/20 text-rose-500 font-bold rounded-xl hover:bg-rose-500 hover:text-white transition-colors">
                             Reject Claim
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
