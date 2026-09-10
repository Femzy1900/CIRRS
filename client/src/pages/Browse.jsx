import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import itemApi from '../api/itemApi';
import ItemCard from '../components/items/ItemCard';
import {
  Search, SlidersHorizontal, X, ChevronLeft, ChevronRight,
  Filter, LayoutGrid, List, Calendar, Tag, MapPin, ArrowUpDown,
  RefreshCw, Package
} from 'lucide-react';

const CATEGORIES = ['Electronics', 'Documents', 'Personal Effects', 'Keys', 'Bags', 'Money', 'Cards', 'Other'];
const STATUSES = ['lost', 'found'];
const SORT_OPTIONS = [
  { value: '-createdAt', label: 'Newest First' },
  { value: 'createdAt', label: 'Oldest First' },
  { value: '-date', label: 'Event Date (Newest)' },
  { value: 'date', label: 'Event Date (Oldest)' },
  { value: 'category', label: 'Category A–Z' },
  { value: 'title', label: 'Title A–Z' },
];
const PER_PAGE = 12;

function useDebounce(value, delay) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

export default function Browse() {
  const [searchParams, setSearchParams] = useSearchParams();

  // Filter state (mirrors URL params)
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [status, setStatus] = useState(searchParams.get('status') || '');
  const [category, setCategory] = useState(searchParams.get('category') || '');
  const [dateFrom, setDateFrom] = useState(searchParams.get('dateFrom') || '');
  const [dateTo, setDateTo] = useState(searchParams.get('dateTo') || '');
  const [sort, setSort] = useState(searchParams.get('sort') || '-createdAt');
  const [page, setPage] = useState(parseInt(searchParams.get('page')) || 1);
  const [viewMode, setViewMode] = useState('grid');
  const [filtersOpen, setFiltersOpen] = useState(false);

  // Data state
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const debouncedSearch = useDebounce(search, 350);
  const activeFilterCount = [status, category, dateFrom, dateTo].filter(Boolean).length;

  // Fetch items whenever filters change
  const fetchItems = useCallback(async (params) => {
    setLoading(true);
    setError(null);
    try {
      const res = await itemApi.getItems({
        search: params.search,
        // if no status filter chosen, exclude resolved items
        status: params.status || 'active',
        category: params.category,
        dateFrom: params.dateFrom,
        dateTo: params.dateTo,
        sort: params.sort,
        page: params.page,
        limit: PER_PAGE,
      });
      setItems(res.data);
      setTotal(res.total || 0);
      setTotalPages(res.totalPages || 1);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load items');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const params = { search: debouncedSearch, status, category, dateFrom, dateTo, sort, page };
    fetchItems(params);

    // Sync URL
    const sp = {};
    if (debouncedSearch) sp.search = debouncedSearch;
    if (status) sp.status = status;
    if (category) sp.category = category;
    if (dateFrom) sp.dateFrom = dateFrom;
    if (dateTo) sp.dateTo = dateTo;
    if (sort !== '-createdAt') sp.sort = sort;
    if (page > 1) sp.page = page;
    setSearchParams(sp, { replace: true });
  }, [debouncedSearch, status, category, dateFrom, dateTo, sort, page, fetchItems, setSearchParams]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, status, category, dateFrom, dateTo, sort]);

  const clearAllFilters = () => {
    setSearch('');
    setStatus('');
    setCategory('');
    setDateFrom('');
    setDateTo('');
    setSort('-createdAt');
    setPage(1);
  };

  const statusColors = {
    lost: 'bg-rose-500/20 text-rose-400 border-rose-500/30',
    found: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    resolved: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  };

  return (
    <div className="space-y-8 pb-20 pt-8 animate-fade-in">
      {/* ── Header ── */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-3">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tighter leading-tight">
            Browse <span className="text-brand-gold">All Reports</span>
          </h1>
          <p className="text-slate-400 font-medium">
            {loading ? 'Loading...' : `${total.toLocaleString()} report${total !== 1 ? 's' : ''} found`}
            {activeFilterCount > 0 && (
              <span className="ml-2 text-brand-gold font-black">({activeFilterCount} filter{activeFilterCount !== 1 ? 's' : ''} active)</span>
            )}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setViewMode(v => v === 'grid' ? 'list' : 'grid')}
            className="p-3 bg-white/5 border border-white/10 rounded-2xl text-slate-400 hover:text-white hover:bg-white/10 transition-all"
            title={viewMode === 'grid' ? 'Switch to list view' : 'Switch to grid view'}
          >
            {viewMode === 'grid' ? <List size={20} /> : <LayoutGrid size={20} />}
          </button>
          <button
            onClick={() => setFiltersOpen(o => !o)}
            className={`flex items-center gap-2 px-5 py-3 rounded-2xl border text-sm font-bold transition-all ${
              filtersOpen || activeFilterCount > 0
                ? 'bg-brand-gold text-brand-blue-dark border-brand-gold'
                : 'bg-white/5 border-white/10 text-slate-300 hover:text-white hover:bg-white/10'
            }`}
          >
            <SlidersHorizontal size={18} />
            Filters
            {activeFilterCount > 0 && (
              <span className="w-5 h-5 bg-brand-blue-dark text-brand-gold rounded-full text-[10px] font-black flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
          </button>
          {(activeFilterCount > 0 || search) && (
            <button
              onClick={clearAllFilters}
              className="flex items-center gap-2 px-4 py-3 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-rose-400 text-sm font-bold hover:bg-rose-500/20 transition-all"
            >
              <X size={16} />
              Clear
            </button>
          )}
        </div>
      </div>

      {/* ── Search Bar ── */}
      <div className="relative group">
        <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-brand-gold transition-colors" size={22} />
        <input
          type="text"
          placeholder="Search by title, description, or location..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-14 pr-5 py-4 bg-white/5 border border-white/5 focus:border-brand-gold/50 focus:bg-white/10 focus:ring-4 focus:ring-brand-gold/5 rounded-2xl transition-all outline-none text-base text-white placeholder:text-slate-500"
        />
        {search && (
          <button onClick={() => setSearch('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white">
            <X size={18} />
          </button>
        )}
      </div>

      {/* ── Filter Panel ── */}
      {filtersOpen && (
        <div className="glass-card p-5 sm:p-8 rounded-[1.5rem] sm:rounded-[2.5rem] border-white/5 animate-fade-in">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-6">

            {/* Status */}
            <div className="space-y-3 sm:col-span-1">
              <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-brand-gold">
                <Filter size={12} /> Status
              </label>
              <div className="flex flex-col gap-2">
                <button
                  onClick={() => setStatus('')}
                  className={`w-full py-2 px-4 rounded-xl text-xs font-bold border transition-all text-left ${
                    !status ? 'bg-brand-gold text-brand-blue-dark border-brand-gold' : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
                  }`}
                >
                  All Statuses
                </button>
                {STATUSES.map(s => (
                  <button
                    key={s}
                    onClick={() => setStatus(status === s ? '' : s)}
                    className={`w-full py-2 px-4 rounded-xl text-xs font-bold border capitalize transition-all text-left ${
                      status === s ? statusColors[s] : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Category */}
            <div className="space-y-3 sm:col-span-1 xl:col-span-2">
              <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-brand-gold">
                <Tag size={12} /> Category
              </label>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setCategory('')}
                  className={`py-2 px-4 rounded-xl text-xs font-bold border transition-all ${
                    !category ? 'bg-brand-gold text-brand-blue-dark border-brand-gold' : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
                  }`}
                >
                  All
                </button>
                {CATEGORIES.map(c => (
                  <button
                    key={c}
                    onClick={() => setCategory(category === c ? '' : c)}
                    className={`py-2 px-4 rounded-xl text-xs font-bold border transition-all ${
                      category === c ? 'bg-brand-gold text-brand-blue-dark border-brand-gold' : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>

            {/* Date Range */}
            <div className="space-y-3 sm:col-span-1 xl:col-span-2">
              <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-brand-gold">
                <Calendar size={12} /> Date Range
              </label>
              <div className="space-y-3">
                <div className="space-y-1">
                  <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold px-1">From</p>
                  <input
                    type="date"
                    value={dateFrom}
                    onChange={e => setDateFrom(e.target.value)}
                    className="input-field w-full text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold px-1">To</p>
                  <input
                    type="date"
                    value={dateTo}
                    onChange={e => setDateTo(e.target.value)}
                    className="input-field w-full text-sm"
                  />
                </div>
              </div>
            </div>

            {/* Sort */}
            <div className="space-y-3 sm:col-span-1">
              <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-brand-gold">
                <ArrowUpDown size={12} /> Sort By
              </label>
              <div className="flex flex-col gap-2">
                {SORT_OPTIONS.map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => setSort(opt.value)}
                    className={`w-full py-2 px-4 rounded-xl text-xs font-bold border transition-all text-left ${
                      sort === opt.value ? 'bg-brand-gold text-brand-blue-dark border-brand-gold' : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Active Filter Chips ── */}
      {(activeFilterCount > 0 || search) && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Active:</span>
          {search && <FilterChip label={`"${search}"`} onRemove={() => setSearch('')} />}
          {status && <FilterChip label={`Status: ${status}`} onRemove={() => setStatus('')} />}
          {category && <FilterChip label={`Category: ${category}`} onRemove={() => setCategory('')} />}
          {dateFrom && <FilterChip label={`From: ${dateFrom}`} onRemove={() => setDateFrom('')} />}
          {dateTo && <FilterChip label={`To: ${dateTo}`} onRemove={() => setDateTo('')} />}
        </div>
      )}

      {/* ── Error ── */}
      {error && (
        <div className="p-6 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex items-center justify-between">
          <p className="text-rose-400 font-bold text-sm">{error}</p>
          <button onClick={() => fetchItems({ search: debouncedSearch, status, category, dateFrom, dateTo, sort, page })} className="flex items-center gap-2 text-xs font-black text-rose-400 hover:text-white transition-colors">
            <RefreshCw size={14} /> Retry
          </button>
        </div>
      )}

      {/* ── Items Grid / List ── */}
      {loading ? (
        <div className={viewMode === 'grid'
          ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8'
          : 'space-y-4'
        }>
          {Array.from({ length: PER_PAGE }).map((_, i) => (
            viewMode === 'grid' ? (
              <div key={i} className="glass-card rounded-[2.5rem] border-white/5 overflow-hidden animate-pulse">
                <div className="h-56 bg-white/5" />
                <div className="p-6 space-y-3">
                  <div className="h-3 bg-white/5 rounded-full w-1/3" />
                  <div className="h-5 bg-white/5 rounded-full w-3/4" />
                  <div className="h-3 bg-white/5 rounded-full w-1/2" />
                </div>
              </div>
            ) : (
              <div key={i} className="glass-card rounded-2xl border-white/5 p-5 flex gap-5 animate-pulse">
                <div className="w-20 h-20 bg-white/5 rounded-xl shrink-0" />
                <div className="flex-1 space-y-3 py-1">
                  <div className="h-3 bg-white/5 rounded-full w-1/4" />
                  <div className="h-5 bg-white/5 rounded-full w-2/3" />
                  <div className="h-3 bg-white/5 rounded-full w-1/3" />
                </div>
              </div>
            )
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-32 glass-card rounded-[4rem] border-2 border-dashed border-white/10">
          <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-8 border border-white/10">
            <Package size={40} className="text-slate-700" />
          </div>
          <h3 className="text-2xl font-black text-white uppercase tracking-widest">No results found</h3>
          <p className="text-slate-400 mt-4 max-w-sm mx-auto leading-relaxed">
            Try adjusting your filters or search terms.
          </p>
          <button onClick={clearAllFilters} className="mt-8 flex items-center gap-2 mx-auto text-xs font-black text-brand-gold hover:text-white transition-colors uppercase tracking-widest">
            <RefreshCw size={14} /> Clear All Filters
          </button>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {items.map(item => (
            <ItemCard key={item._id || item.id} item={item} />
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {items.map(item => (
            <ListCard key={item._id || item.id} item={item} />
          ))}
        </div>
      )}

      {/* ── Pagination ── */}
      {!loading && totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 pt-8">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="p-3 bg-white/5 border border-white/10 rounded-2xl text-slate-400 hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          >
            <ChevronLeft size={20} />
          </button>

          <div className="flex items-center gap-2">
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 2)
              .reduce((acc, p, idx, arr) => {
                if (idx > 0 && p - arr[idx - 1] > 1) acc.push('...');
                acc.push(p);
                return acc;
              }, [])
              .map((p, i) =>
                p === '...' ? (
                  <span key={`ellipsis-${i}`} className="text-slate-600 font-black px-1">···</span>
                ) : (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={`w-10 h-10 rounded-xl text-sm font-black transition-all ${
                      page === p
                        ? 'bg-brand-gold text-brand-blue-dark shadow-lg scale-110'
                        : 'bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    {p}
                  </button>
                )
              )}
          </div>

          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="p-3 bg-white/5 border border-white/10 rounded-2xl text-slate-400 hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      )}

      {/* Page info */}
      {!loading && total > 0 && (
        <p className="text-center text-[10px] text-slate-600 font-bold uppercase tracking-widest">
          Showing {Math.min((page - 1) * PER_PAGE + 1, total)}–{Math.min(page * PER_PAGE, total)} of {total.toLocaleString()} results
        </p>
      )}
    </div>
  );
}

/* ── Filter chip ── */
function FilterChip({ label, onRemove }) {
  return (
    <span className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-gold/10 border border-brand-gold/20 text-brand-gold text-[10px] font-black rounded-xl">
      {label}
      <button onClick={onRemove} className="hover:text-white transition-colors ml-0.5">
        <X size={11} />
      </button>
    </span>
  );
}

/* ── List-view card ── */
function ListCard({ item }) {
  const statusStyle = {
    lost: 'bg-rose-500/80 text-white',
    found: 'bg-emerald-500/80 text-white',
    resolved: 'bg-purple-500/80 text-white',
  }[item.status] || 'bg-white/10 text-white';

  return (
    <Link
      to={`/item/${item._id || item.id}`}
      className="group flex items-center gap-5 glass-card p-5 rounded-2xl border-white/5 hover:border-brand-gold/30 transition-all"
    >
      <div className="w-20 h-20 rounded-xl overflow-hidden shrink-0 border border-white/10">
        <img src={item.image} alt={item.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
      </div>

      <div className="flex-1 min-w-0 space-y-1.5">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border border-white/10 ${statusStyle}`}>
            {item.status}
          </span>
          {item.hasApprovedClaim && item.status !== 'resolved' && (
            <span className="px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest bg-amber-500/90 border border-amber-500/30 text-white">
              🔒 Pending Handover
            </span>
          )}
          <span className="text-[10px] font-black uppercase tracking-widest text-brand-gold/60">{item.category}</span>
        </div>
        <h3 className="text-base font-black text-white group-hover:text-brand-gold transition-colors truncate">{item.title}</h3>
        <p className="text-xs text-slate-500 line-clamp-1">{item.description}</p>
      </div>

      <div className="hidden md:flex flex-col items-end gap-2 shrink-0 text-right">
        <div className="flex items-center gap-1.5 text-slate-500 text-xs">
          <MapPin size={12} className="text-brand-gold/50" />
          <span className="max-w-[150px] truncate">{item.location}</span>
        </div>
        <div className="flex items-center gap-1.5 text-slate-500 text-xs">
          <Calendar size={12} className="text-brand-gold/50" />
          <span>{new Date(item.date).toLocaleDateString()}</span>
        </div>
        <span className="text-[10px] font-black text-brand-gold/60 uppercase tracking-widest">
          {item.postedBy?.fullName || '—'}
        </span>
      </div>

      <ChevronRight size={18} className="text-slate-600 group-hover:text-brand-gold group-hover:translate-x-1 transition-all shrink-0" />
    </Link>
  );
}
