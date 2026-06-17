import { useState, useEffect } from 'react';
import useItemStore from '../store/useItemStore';
import ItemCard from '../components/items/ItemCard';
import reviewApi from '../api/reviewApi';
import { Search, Filter, Plus, ArrowRight, ShieldCheck, Zap, Heart, Library, Star, Quote } from 'lucide-react';
import { Link } from 'react-router-dom';

function StarRow({ rating, size = 14 }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(s => (
        <Star
          key={s}
          size={size}
          className={s <= rating ? 'text-brand-gold fill-brand-gold' : 'text-slate-700'}
        />
      ))}
    </div>
  );
}

export default function Home() {
  const { items, filteredItems, setSearch, filterByType, fetchItems, loading, error } = useItemStore();
  const [activeFilter, setActiveFilter] = useState('all');
  const [reviews, setReviews] = useState([]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  useEffect(() => {
    reviewApi.getReviews()
      .then(res => { if (res.success) setReviews(res.data); })
      .catch(() => {});
  }, []);

  const handleFilter = (type) => {
    setActiveFilter(type);
    filterByType(type);
  };

  return (
    <div className="space-y-16 sm:space-y-24 lg:space-y-32 pb-20 overflow-hidden">
      {/* ── Hero Section ── */}
      <section className="relative pt-16 lg:pt-24">
        {/* Background Glows */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[800px] bg-brand-blue/20 -z-10 rounded-full blur-[120px] opacity-60"></div>
        <div className="absolute -top-40 -right-40 w-[500px] h-[500px] bg-brand-gold/5 -z-10 rounded-full blur-[100px]"></div>

        <div className="flex flex-col lg:flex-row items-center gap-8 lg:gap-20">
          <div className="lg:w-3/5 space-y-6 sm:space-y-10 text-center lg:text-left relative z-10">
            <div className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-blue/40 border border-brand-blue-light/30 text-brand-gold rounded-full text-xs font-bold uppercase tracking-[0.2em] animate-fade-in backdrop-blur-md">
              <ShieldCheck size={16} className="text-brand-gold" />
              Verified Recovery System
            </div>

            <h1 className="text-4xl sm:text-6xl lg:text-8xl font-black text-white leading-[1.1] tracking-tighter">
              Lost it? <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-gold via-amber-400 to-yellow-600 drop-shadow-sm">
                Recover it.
              </span>
            </h1>

            <p className="text-base sm:text-xl text-slate-400 leading-relaxed max-w-2xl mx-auto lg:mx-0 font-medium">
              The official Campus Item Reporting and Recovery System. Bridging the gap between lost belongings and their rightful owners across the campus.
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-5 justify-center lg:justify-start pt-4">
              <Link to="/report-lost" className="btn-accent flex items-center gap-3 group w-full sm:w-auto justify-center py-3 sm:py-4 px-6 sm:px-8 text-base sm:text-lg">
                Report Lost Item
                <Plus size={22} className="group-hover:rotate-90 transition-transform" />
              </Link>
              <Link to="/report-found" className="btn-secondary flex items-center gap-3 group w-full sm:w-auto justify-center py-3 sm:py-4 px-6 sm:px-8 text-base sm:text-lg border-white/10 bg-white/5 backdrop-blur-md">
                I Found Something
                <ArrowRight size={22} className="group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>

            <div className="flex items-center gap-6 sm:gap-12 pt-4 sm:pt-8 justify-center lg:justify-start">
              <div className="flex flex-col">
                <span className="text-2xl sm:text-3xl font-black text-white">{items.filter(i => i.status === 'found' || i.status === 'resolved').length}+</span>
                <span className="text-[10px] uppercase tracking-[0.25em] font-bold text-brand-gold/80">Items Reported Found</span>
              </div>
              <div className="w-px h-12 bg-white/10"></div>
              <div className="flex flex-col">
                <span className="text-2xl sm:text-3xl font-black text-white">
                  {items.length > 0 ? Math.round((items.filter(i => i.status === 'resolved').length / items.length) * 100) : 0}%
                </span>
                <span className="text-[10px] uppercase tracking-[0.25em] font-bold text-brand-gold/80">Recovery Rate</span>
              </div>
              <div className="w-px h-12 bg-white/10"></div>
              <div className="flex flex-col">
                <span className="text-2xl sm:text-3xl font-black text-white">{items.length}</span>
                <span className="text-[10px] uppercase tracking-[0.25em] font-bold text-brand-gold/80">Total Reports</span>
              </div>
            </div>
          </div>

          {/* Hero image */}
          <div className="lg:w-2/5 relative">
            <div className="relative z-10 rounded-[1.5rem] sm:rounded-[3rem] overflow-hidden shadow-[0_0_50px_rgba(0,33,71,0.5)] border border-white/10 group">
              <img
                src="https://images.unsplash.com/photo-1498243691581-b145c3f54a5a?auto=format&fit=crop&w=1200&q=80"
                alt="Students on campus"
                className="w-full h-[280px] sm:h-[420px] lg:h-[600px] object-cover group-hover:scale-110 transition-transform duration-1000"
                onError={e => {
                  e.currentTarget.src = 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&w=1200&q=80';
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-brand-blue via-brand-blue/20 to-transparent"></div>

              {/* Dynamic quote from latest review, or fallback */}
              {reviews.length > 0 ? (
                <div className="absolute bottom-4 sm:bottom-10 left-4 sm:left-10 right-4 sm:right-10 text-white backdrop-blur-sm bg-black/20 p-4 sm:p-6 rounded-2xl border border-white/10">
                  <StarRow rating={reviews[0].rating} size={13} />
                  <p className="text-base font-medium italic opacity-95 mt-2 mb-3 leading-relaxed line-clamp-2">
                    "{reviews[0].message}"
                  </p>
                  <p className="font-bold text-brand-gold text-sm">{reviews[0].user?.fullName || 'CIRS User'}</p>
                </div>
              ) : (
                <div className="absolute bottom-4 sm:bottom-10 left-4 sm:left-10 right-4 sm:right-10 text-white backdrop-blur-sm bg-black/20 p-4 sm:p-6 rounded-2xl border border-white/10">
                  <StarRow rating={5} size={13} />
                  <p className="text-base font-medium italic opacity-95 mt-2 mb-3 leading-relaxed">
                    "CIRS made it so easy to get back my ID card within 24 hours."
                  </p>
                  <p className="font-bold text-brand-gold text-sm">Alex J., Student</p>
                </div>
              )}
            </div>
            {/* Floating Glows */}
            <div className="absolute -top-10 -right-10 w-48 h-48 bg-brand-gold/10 rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute -bottom-10 -left-10 w-56 h-56 bg-brand-blue/30 rounded-full blur-3xl animate-pulse delay-700"></div>
          </div>
        </div>
      </section>

      {/* ── Features Section ── */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-10">
        {[
          { icon: <Zap className="text-brand-gold" />, title: 'Real-time Alerts', desc: 'Get notified immediately when an item matching your description is found in the system.' },
          { icon: <ShieldCheck className="text-emerald-400" />, title: 'Verified Claims', desc: 'Our secure vetting process ensures items are returned to their rightful owners with proper verification.' },
          { icon: <Heart className="text-rose-400" />, title: 'Community Driven', desc: 'Fostering a spirit of helpfulness by assisting fellow students recover lost valuables.' }
        ].map((f, i) => (
          <div key={i} className="glass-card p-6 sm:p-10 rounded-[2rem] sm:rounded-[2.5rem] hover:-translate-y-3 transition-all duration-500 group border-white/5 hover:border-brand-gold/30 hover:shadow-brand-gold/5">
            <div className="w-16 h-16 bg-brand-blue/50 rounded-2xl flex items-center justify-center mb-8 shadow-inner border border-white/5 group-hover:scale-110 transition-transform">
              {f.icon}
            </div>
            <h3 className="text-2xl font-bold text-white mb-4 group-hover:text-brand-gold transition-colors">{f.title}</h3>
            <p className="text-slate-400 leading-relaxed font-medium">{f.desc}</p>
          </div>
        ))}
      </section>

      {/* ── Items Section ── */}
      <section className="space-y-10 sm:space-y-16">
        <div className="flex flex-col md:flex-row items-end justify-between gap-5 sm:gap-10">
          <div className="space-y-4">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white">Recent Reports</h2>
            <p className="text-slate-400 text-lg font-medium max-w-xl">Real-time feed of lost and found items across all campus locations and halls.</p>
          </div>
          <Link to="/browse" className="hidden md:flex items-center gap-2 text-xs font-black uppercase tracking-widest text-brand-gold hover:text-white transition-colors">
            <Library size={16} />
            Browse All with Filters
            <ArrowRight size={14} />
          </Link>

          <div className="flex items-center gap-2 p-1.5 bg-white/5 backdrop-blur-md rounded-2xl border border-white/10">
            {['all', 'lost', 'found', 'resolved'].map((type) => (
              <button
                key={type}
                onClick={() => handleFilter(type)}
                className={`px-4 sm:px-8 py-2 sm:py-3 rounded-xl text-xs sm:text-sm font-bold capitalize transition-all ${
                  activeFilter === type
                    ? 'bg-brand-gold text-brand-blue-dark shadow-xl scale-105'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        <div className="relative">
          <div className="absolute top-1/2 left-0 w-full h-px bg-white/5 -z-10"></div>
          <div className="flex items-center gap-4 bg-[#020617] pr-8 w-fit mb-12">
            <div className="p-3 bg-brand-gold rounded-xl text-brand-blue-dark shadow-lg shadow-brand-gold/20">
              <Filter size={20} />
            </div>
            <span className="text-sm font-bold uppercase tracking-[0.3em] text-brand-gold/60">Live Database</span>
          </div>
        </div>

        {error && (
          <div className="text-center py-12 bg-rose-500/10 rounded-[2rem] sm:rounded-[3rem] border border-rose-500/20">
            <p className="text-rose-400 font-bold">{error}</p>
            <button onClick={() => fetchItems()} className="mt-4 text-xs font-black uppercase tracking-widest text-rose-400 hover:text-white transition-colors">
              Retry
            </button>
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 sm:gap-10">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="glass-card rounded-[2.5rem] border-white/5 overflow-hidden animate-pulse">
                <div className="aspect-[4/3] bg-white/5" />
                <div className="p-6 space-y-3">
                  <div className="h-3 bg-white/5 rounded-full w-1/3" />
                  <div className="h-5 bg-white/5 rounded-full w-3/4" />
                  <div className="h-3 bg-white/5 rounded-full w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 sm:gap-10">
              {filteredItems.map((item) => (
                <ItemCard key={item._id || item.id} item={item} />
              ))}
            </div>

            {filteredItems.length === 0 && !error && (
              <div className="text-center py-32 bg-white/5 rounded-[4rem] border-2 border-dashed border-white/10 backdrop-blur-sm">
                <div className="w-24 h-24 bg-brand-blue/50 rounded-full flex items-center justify-center mx-auto mb-8 shadow-2xl border border-white/10">
                  <Search size={40} className="text-brand-gold/50" />
                </div>
                <h3 className="text-2xl font-bold text-white">No items found</h3>
                <p className="text-slate-400 mt-3 text-lg font-medium">Try adjusting your search or filters to see more results.</p>
              </div>
            )}
          </>
        )}
      </section>

      {/* ── Reviews Section ── */}
      {reviews.length > 0 && (
        <section className="space-y-10 sm:space-y-16">
          {/* Heading */}
          <div className="flex flex-col md:flex-row items-end justify-between gap-6">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-brand-gold/10 border border-brand-gold/20 rounded-full text-xs font-black uppercase tracking-[0.2em] text-brand-gold">
                <Star size={14} className="fill-brand-gold text-brand-gold" />
                Community Reviews
              </div>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white">What students say</h2>
              <p className="text-slate-400 text-lg font-medium max-w-xl">
                Real experiences from students who successfully recovered their belongings.
              </p>
            </div>

            {/* Aggregate rating */}
            {reviews.length >= 3 && (
              <div className="text-center shrink-0 px-8 py-6 glass-card rounded-[2rem] border-white/5">
                <p className="text-4xl sm:text-6xl font-black text-white tracking-tighter">
                  {(reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)}
                </p>
                <StarRow rating={Math.round(reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length)} size={18} />
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mt-2">{reviews.length} {reviews.length === 1 ? 'review' : 'reviews'}</p>
              </div>
            )}
          </div>

          {/* Cards grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-8">
            {reviews.slice(0, 6).map((review) => (
              <ReviewCard key={review._id} review={review} />
            ))}
          </div>

          {reviews.length > 6 && (
            <p className="text-center text-[10px] font-black uppercase tracking-widest text-slate-600">
              Showing 6 of {reviews.length} reviews
            </p>
          )}
        </section>
      )}
    </div>
  );
}

function ReviewCard({ review }) {
  return (
    <div className="glass-card p-5 sm:p-8 rounded-[1.5rem] sm:rounded-[2rem] border border-white/5 hover:border-brand-gold/20 transition-all duration-300 hover:-translate-y-1 space-y-5 flex flex-col">
      {/* Quote icon + stars */}
      <div className="flex items-start justify-between">
        <div className="w-10 h-10 bg-brand-gold/10 rounded-xl flex items-center justify-center border border-brand-gold/20 shrink-0">
          <Quote size={18} className="text-brand-gold" />
        </div>
        <StarRow rating={review.rating} size={15} />
      </div>

      {/* Message */}
      <p className="text-slate-300 text-sm leading-relaxed font-medium flex-grow line-clamp-4 italic">
        "{review.message}"
      </p>

      {/* Author */}
      <div className="flex items-center gap-3 pt-4 border-t border-white/5">
        <div className="w-10 h-10 bg-gradient-to-br from-brand-blue to-brand-blue-dark rounded-xl flex items-center justify-center text-brand-gold font-black text-base border border-white/10 shrink-0">
          {review.user?.fullName?.charAt(0) || 'U'}
        </div>
        <div>
          <p className="text-white font-black text-sm tracking-tight">{review.user?.fullName || 'CIRS User'}</p>
          <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">
            {new Date(review.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
          </p>
        </div>
      </div>
    </div>
  );
}
