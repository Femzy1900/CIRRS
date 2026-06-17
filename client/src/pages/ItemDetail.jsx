import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import useItemStore from '../store/useItemStore';
import useAuthStore from '../store/useAuthStore';
import claimApi from '../api/claimApi';
import reviewApi from '../api/reviewApi';
import uploadApi from '../api/uploadApi';
import itemApi from '../api/itemApi';
import {
  MapPin, Calendar, User, ArrowLeft, ShieldCheck, Share2, Info,
  Check, X, Edit, Trash2, Save, Package, Tag, AlertTriangle, Star,
  Hourglass, TrendingUp, Flag, ArrowUpCircle, Upload, ImageIcon,
  HandHeart, Mail, Phone, Copy, CheckCheck
} from 'lucide-react';
import { toast } from 'sonner';
import Button from '../components/ui/Button';

const PLACEHOLDER_PATTERNS = ['placehold.co', 'placeholder', 'unsplash.com/photo-1586769852'];
const isPlaceholder = (url) => !url || PLACEHOLDER_PATTERNS.some(p => url.includes(p));

const CATEGORIES = ['Electronics', 'Documents', 'Personal Effects', 'Keys', 'Bags', 'Money', 'Cards', 'Other'];

export default function ItemDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { items, singleItem, fetchItemById, loading, updateItem, deleteItem } = useItemStore();
  const { user } = useAuthStore();

  const [claims, setClaims] = useState([]);
  const [loadingClaims, setLoadingClaims] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const imageInputRef = useRef(null);

  // Review state
  const [myReview, setMyReview] = useState(null);         // null = not yet loaded
  const [reviewLoaded, setReviewLoaded] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewMessage, setReviewMessage] = useState('');
  const [reviewHover, setReviewHover] = useState(0);
  const [submittingReview, setSubmittingReview] = useState(false);

  // Claimant review eligibility + contact reveal
  const [claimPassed, setClaimPassed] = useState(false);
  const [claimCheckDone, setClaimCheckDone] = useState(false);
  const [claimerContact, setClaimerContact] = useState(null); // finderContact for the approved claimant

  // "I Found This" contact reveal
  const [contactLoading, setContactLoading] = useState(false);
  const [contactInfo, setContactInfo] = useState(null);   // { fullName, email, phone }
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [copiedPhone, setCopiedPhone] = useState(false);

  // Resolve item
  useEffect(() => {
    const existing = items.find(i => (i._id || i.id) === id);
    if (!existing && !loading && singleItem?._id !== id) fetchItemById(id);
  }, [id, items, fetchItemById, singleItem, loading]);

  const item = items.find(i => (i._id || i.id) === id) || (singleItem?._id === id ? singleItem : null);

  const userId = user?._id?.toString() || user?.id?.toString();
  const isPoster = user && item && (item.postedBy?._id || item.postedBy)?.toString() === userId;

  // Fetch claims for poster — runs on found, claimed, or resolved
  useEffect(() => {
    if (!item || !isPoster) return;
    if (!['found', 'claimed', 'resolved'].includes(item.status)) return;

    setLoadingClaims(true);
    claimApi.getItemClaims(item._id || item.id)
      .then(res => { if (res.success) setClaims(res.data); })
      .catch(err => console.error('Failed to fetch claims', err))
      .finally(() => setLoadingClaims(false));
  }, [isPoster, item?._id, item?.status]); // eslint-disable-line react-hooks/exhaustive-deps

  // Open edit form pre-filled with current values
  const openEdit = () => {
    setEditForm({
      title: item.title,
      description: item.description,
      location: item.location,
      category: item.category,
      date: item.date ? new Date(item.date).toISOString().split('T')[0] : '',
      image: item.image || '',
    });
    setImagePreview(item.image || null);
    setImageFile(null);
    setIsEditing(true);
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error('Image must be under 5MB.'); return; }
    setImageFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(reader.result);
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      let finalForm = { ...editForm };

      if (imageFile) {
        setUploadingImage(true);
        const uploadRes = await uploadApi.uploadImage(imageFile);
        setUploadingImage(false);
        if (uploadRes.success) {
          finalForm.image = uploadRes.url;
        } else {
          toast.error('Image upload failed. Other changes will still be saved.');
        }
      }

      await updateItem(id, finalForm);
      toast.success('Post updated successfully.');
      setIsEditing(false);
      setImageFile(null);
    } catch (err) {
      toast.error(err.message || 'Failed to update post.');
    } finally {
      setSaving(false);
      setUploadingImage(false);
    }
  };

  const handleDelete = () => {
    toast.warning(`Delete "${item?.title}"?`, {
      description: 'This will permanently remove the post and all its claims.',
      action: {
        label: 'Delete',
        onClick: async () => {
          try {
            await deleteItem(id);
            toast.success('Post deleted.');
            navigate('/my-reports');
          } catch (err) {
            toast.error(err.message || 'Failed to delete post.');
          }
        },
      },
      cancel: { label: 'Cancel' },
    });
  };

  const handleUpdateClaim = async (claimId, status, reviewNote = '') => {
    try {
      const res = await claimApi.updateClaimStatus(claimId, status, reviewNote);
      if (res.success) {
        setClaims(prev => prev.map(c =>
          c._id === claimId ? { ...c, status, passed: status === 'approved' } : c
        ));
        if (status === 'approved') toast.success('Claim approved — claimant notified.');
        else if (status === 'rejected') toast.success('Claim rejected.');
        else if (status === 'escalated') toast.info('Claim escalated to admin review.');
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to update claim status.');
    }
  };

  const handleShare = () => {
    navigator.clipboard?.writeText(window.location.href)
      .then(() => toast.success('Link copied to clipboard!'))
      .catch(() => toast.info(`Share this link: ${window.location.href}`));
  };

  // Check if this (non-poster) user has a passed claim on this item
  // Also grab finderContact so we can show it in-page once approved
  useEffect(() => {
    if (!user || isPoster || !item || claimCheckDone) return;
    if (!['claimed', 'resolved'].includes(item.status)) return;

    claimApi.getMyClaimForItem(item._id || item.id)
      .then(res => {
        if (res.success && res.data?.claim) {
          const { claim, finderContact } = res.data;
          if (claim.passed || claim.status === 'approved') {
            setClaimPassed(true);
            if (finderContact) setClaimerContact(finderContact);
          }
        }
      })
      .catch(() => {})
      .finally(() => setClaimCheckDone(true));
  }, [user, isPoster, item?._id, item?.status, claimCheckDone]); // eslint-disable-line react-hooks/exhaustive-deps

  // Load existing review once user is eligible (poster on resolved, claimant on claimed/resolved)
  useEffect(() => {
    const posterEligible  = isPoster && item?.status === 'resolved';
    const claimantEligible = !isPoster && claimPassed && ['claimed', 'resolved'].includes(item?.status);
    if (!user || (!posterEligible && !claimantEligible) || reviewLoaded) return;

    reviewApi.getMyReview()
      .then(res => { setMyReview(res.data); setReviewLoaded(true); })
      .catch(() => setReviewLoaded(true));
  }, [user, isPoster, claimPassed, item?.status, reviewLoaded]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSubmitReview = async () => {
    if (!reviewMessage.trim() || reviewMessage.trim().length < 10) {
      toast.error('Please write at least 10 characters.');
      return;
    }
    setSubmittingReview(true);
    try {
      const res = await reviewApi.createReview({ rating: reviewRating, message: reviewMessage.trim() });
      setMyReview(res.data);
      toast.success('Thank you for your review! 🎉');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit review.');
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleFoundThis = async () => {
    if (!user) { toast.error('Please log in to contact the reporter.'); return; }
    if (contactInfo) return; // already revealed
    setContactLoading(true);
    try {
      const res = await itemApi.contactItem(item._id || item.id);
      setContactInfo(res.data);
      toast.success('Contact details revealed! The reporter has been notified.');
    } catch (err) {
      const status = err?.response?.status;
      // Surface the specific gate message from the server when available
      const msg = err?.response?.data?.error || err?.response?.data?.message || err.message;

      if (status === 403) {
        // Gate 1 (unverified email) or Gate 2 (account too new)
        toast.error(msg || 'You must have a verified account to use this feature.');
      } else if (status === 409) {
        // Gate 3 — already contacted this item
        toast.error('You already submitted a contact request for this item.');
      } else if (status === 429) {
        // Gate 4 (daily limit) or Gate 5 (HTTP rate limit)
        toast.error(msg || 'You have reached the contact limit. Please try again later.');
      } else {
        toast.error('Could not fetch contact details. Please try again.');
      }
    } finally {
      setContactLoading(false);
    }
  };

  const copyToClipboard = async (text, setter) => {
    try {
      await navigator.clipboard.writeText(text);
      setter(true);
      setTimeout(() => setter(false), 2000);
    } catch {
      toast.error('Could not copy to clipboard.');
    }
  };

  if (loading && !item) {
    return (
      <div className="max-w-6xl mx-auto pt-8 pb-20 animate-pulse space-y-8">
        <div className="h-8 bg-white/5 rounded-full w-32" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-16">
          <div className="aspect-square bg-white/5 rounded-[3rem]" />
          <div className="space-y-6">
            <div className="h-6 bg-white/5 rounded-full w-1/3" />
            <div className="h-16 bg-white/5 rounded-2xl w-full" />
            <div className="h-40 bg-white/5 rounded-3xl w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="text-center py-32">
        <h2 className="text-2xl font-black text-white uppercase tracking-widest">Item not found</h2>
        <button onClick={() => navigate('/')} className="mt-6 text-brand-gold hover:text-white transition-colors font-bold text-sm uppercase tracking-widest">
          Return Home
        </button>
      </div>
    );
  }

  const isFound = item.status === 'found';
  const isClaimed = item.status === 'claimed';
  const isResolved = item.status === 'resolved';
  const isLost = item.status === 'lost';

  const statusStyle = isFound
    ? 'bg-emerald-500/80 text-white'
    : isClaimed
    ? 'bg-amber-500/80 text-white'
    : isResolved
    ? 'bg-purple-500/80 text-white'
    : 'bg-rose-500/80 text-white';

  return (
    <div className="max-w-6xl mx-auto animate-fade-in pb-20 pt-8">
      {/* Back + Poster Actions */}
      <div className="flex items-center justify-between mb-6 sm:mb-10">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] text-slate-500 hover:text-brand-gold transition-all group"
        >
          <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
          Back
        </button>

        {isPoster && (
          <div className="flex items-center gap-3">
            {!isEditing && (
              <>
                <Button variant="ghost" size="sm" icon={Edit} onClick={openEdit}>
                  Edit Post
                </Button>
                <Button variant="danger" size="sm" icon={Trash2} onClick={handleDelete}>
                  Delete
                </Button>
              </>
            )}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-16">
        {/* ── Image ── */}
        <div className="space-y-6">
          <div className="rounded-[1.5rem] sm:rounded-[3rem] overflow-hidden shadow-[0_0_50px_rgba(0,33,71,0.3)] border border-white/10 bg-slate-900/50">
            <img src={item.image} alt={item.title} className="w-full aspect-square object-cover" />
          </div>
          <div className="grid grid-cols-3 gap-2 sm:gap-4">
            {[1, 2, 3].map(n => (
              <div key={n} className="aspect-square rounded-2xl bg-white/5 border border-white/5 hover:border-brand-gold/50 overflow-hidden transition-all group cursor-pointer">
                <img src={item.image} className="w-full h-full object-cover opacity-40 group-hover:opacity-100 transition-opacity" alt="thumb" />
              </div>
            ))}
          </div>
        </div>

        {/* ── Content ── */}
        <div className="space-y-10">

          {/* ── Edit Form ── */}
          {isEditing ? (
            <div className="glass-card p-5 sm:p-8 rounded-[1.5rem] sm:rounded-[2.5rem] border-brand-gold/20 space-y-6 animate-fade-in">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-black text-white uppercase tracking-widest">Editing Post</h3>
                <button onClick={() => setIsEditing(false)} className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-white/5 transition-all">
                  <X size={18} />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Title */}
                <div className="md:col-span-2 space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-brand-gold px-1">Title</label>
                  <div className="relative">
                    <Package className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                    <input
                      className="input-field pl-10 w-full"
                      value={editForm.title || ''}
                      onChange={e => setEditForm(f => ({ ...f, title: e.target.value }))}
                    />
                  </div>
                </div>

                {/* Category */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-brand-gold px-1">Category</label>
                  <div className="relative">
                    <Tag className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                    <select
                      className="input-field pl-10 w-full appearance-none"
                      value={editForm.category || ''}
                      onChange={e => setEditForm(f => ({ ...f, category: e.target.value }))}
                    >
                      {CATEGORIES.map(c => (
                        <option key={c} value={c} className="bg-slate-900">{c}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Date */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-brand-gold px-1">Date</label>
                  <div className="relative">
                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                    <input
                      type="date"
                      className="input-field pl-10 w-full"
                      value={editForm.date || ''}
                      onChange={e => setEditForm(f => ({ ...f, date: e.target.value }))}
                    />
                  </div>
                </div>

                {/* Location */}
                <div className="md:col-span-2 space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-brand-gold px-1">Location</label>
                  <div className="relative">
                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                    <input
                      className="input-field pl-10 w-full"
                      value={editForm.location || ''}
                      onChange={e => setEditForm(f => ({ ...f, location: e.target.value }))}
                    />
                  </div>
                </div>

                {/* Description */}
                <div className="md:col-span-2 space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-brand-gold px-1">Description</label>
                  <textarea
                    rows="4"
                    className="input-field p-4 w-full resize-none"
                    value={editForm.description || ''}
                    onChange={e => setEditForm(f => ({ ...f, description: e.target.value }))}
                  />
                </div>

                {/* Image upload */}
                <div className="md:col-span-2 space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-brand-gold px-1 flex items-center gap-2">
                    <ImageIcon size={12} /> Item Photo
                  </label>
                  <div className="flex items-start gap-4">
                    {/* Preview / click zone */}
                    <button
                      type="button"
                      onClick={() => imageInputRef.current?.click()}
                      className="relative w-28 h-28 rounded-2xl overflow-hidden border-2 border-dashed border-white/10 hover:border-brand-gold/50 shrink-0 bg-white/5 group/img transition-all"
                    >
                      {isPlaceholder(imagePreview) ? (
                        <div className="w-full h-full flex flex-col items-center justify-center gap-1 text-slate-600 group-hover/img:text-brand-gold transition-colors">
                          <Upload size={22} />
                          <span className="text-[9px] font-black uppercase tracking-widest">Add Photo</span>
                        </div>
                      ) : (
                        <>
                          <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover/img:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1 text-white">
                            <Upload size={18} />
                            <span className="text-[9px] font-black uppercase tracking-widest">Change</span>
                          </div>
                        </>
                      )}
                    </button>
                    {/* Label */}
                    <div className="flex-1 space-y-2 pt-1">
                      {imageFile ? (
                        <p className="text-[11px] text-emerald-400 font-bold truncate">✓ {imageFile.name}</p>
                      ) : isPlaceholder(imagePreview) ? (
                        <p className="text-[11px] text-amber-400/80 font-bold">No photo uploaded yet</p>
                      ) : (
                        <p className="text-[11px] text-slate-400 font-bold">Current photo</p>
                      )}
                      <p className="text-[10px] text-slate-600 leading-relaxed">
                        Click the box to {isPlaceholder(imagePreview) ? 'add' : 'change'} the photo.<br />
                        JPG or PNG, max 5 MB.
                      </p>
                      <input ref={imageInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <Button
                  variant="accent"
                  size="sm"
                  icon={uploadingImage ? Upload : Save}
                  loading={saving}
                  onClick={handleSave}
                >
                  {uploadingImage ? 'Uploading…' : 'Save Changes'}
                </Button>
                <Button variant="ghost" size="sm" onClick={() => { setIsEditing(false); setImageFile(null); }}>
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <>
              {/* ── Status + Title ── */}
              <div className="space-y-5">
                <div className="flex items-center gap-3 flex-wrap">
                  <span className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] border border-white/10 ${statusStyle}`}>
                    {item.status}
                  </span>
                  <span className="text-xs font-black text-brand-gold uppercase tracking-[0.25em]">{item.category}</span>
                  {item.riskLevel && (
                    <span className={`px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-widest border ${
                      item.riskLevel === 'HIGH'   ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' :
                      item.riskLevel === 'MEDIUM' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                                                    'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                    }`}>
                      <TrendingUp size={10} className="inline mr-1" />
                      {item.riskLevel} Risk
                    </span>
                  )}
                </div>

                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tighter leading-tight">
                  {item.title}
                </h1>

                <div className="flex flex-wrap gap-6 pt-1">
                  <div className="flex items-center gap-2 text-slate-400">
                    <div className="p-1.5 bg-brand-blue/30 rounded-lg">
                      <MapPin size={16} className="text-brand-gold" />
                    </div>
                    <span className="text-sm font-bold">{item.location}</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-400">
                    <div className="p-1.5 bg-brand-blue/30 rounded-lg">
                      <Calendar size={16} className="text-brand-gold" />
                    </div>
                    <span className="text-sm font-bold">{new Date(item.date).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>

              {/* ── Description card ── */}
              <div className="p-5 sm:p-8 bg-slate-900/40 border border-white/5 rounded-[1.5rem] sm:rounded-[2.5rem] space-y-6">
                <h3 className="text-base font-black text-white uppercase tracking-widest flex items-center gap-3">
                  <span className="w-6 h-px bg-brand-gold/30" />
                  Description
                </h3>
                <p className="text-slate-400 leading-relaxed font-medium">{item.description}</p>
                <div className="flex items-center gap-4 pt-6 border-t border-white/5">
                  <div className="w-12 h-12 bg-brand-blue/50 rounded-2xl flex items-center justify-center text-brand-gold border border-white/10">
                    <User size={22} />
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.25em] text-brand-gold/60">Reported By</p>
                    <p className="font-black text-white tracking-tight">{item.postedBy?.fullName || item.postedBy?.username || 'Unknown'}</p>
                  </div>
                </div>
              </div>

              {/* ── Claimed banner: poster prompted to confirm handover ── */}
              {isPoster && isClaimed && (
                <div className="p-6 bg-amber-500/10 border border-amber-500/30 rounded-[2rem] space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 bg-amber-500/20 rounded-xl flex items-center justify-center shrink-0 mt-0.5">
                      <AlertTriangle size={18} className="text-amber-400" />
                    </div>
                    <div>
                      <p className="text-amber-400 font-black text-sm uppercase tracking-widest">Awaiting Handover</p>
                      <p className="text-slate-400 text-xs mt-1 leading-relaxed">
                        A claim has been verified and contact details exchanged. Once you physically hand over the item, mark it as Resolved to close this report.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      toast.warning('Mark as Resolved?', {
                        description: 'This confirms the item has been physically returned. This action cannot be undone.',
                        action: {
                          label: 'Confirm',
                          onClick: async () => {
                            try {
                              await updateItem(id, { status: 'resolved' });
                              toast.success('Item marked as Resolved. 🎉');
                            } catch (err) {
                              toast.error(err.message || 'Failed to update status.');
                            }
                          },
                        },
                        cancel: { label: 'Not yet' },
                      });
                    }}
                    className="w-full py-3 bg-amber-500 text-white font-black text-xs uppercase tracking-[0.2em] rounded-2xl hover:bg-amber-400 transition-colors active:scale-95"
                  >
                    ✓ Confirm Handover — Mark as Resolved
                  </button>
                </div>
              )}

              {/* ── Action buttons ── */}
              <div className="flex flex-wrap gap-4">
                {!isPoster && isFound && (
                  <Link to={`/submit-claim/${item._id || item.id}`} className="flex-grow">
                    <button className="w-full btn-accent flex items-center justify-center gap-3 py-4 text-sm uppercase tracking-[0.2em] font-black">
                      This is mine — Claim It
                      <ShieldCheck size={20} />
                    </button>
                  </Link>
                )}

                {/* ── "I Found This" — for lost items only ── */}
                {/* Not logged in: prompt to sign in */}
                {!isPoster && isLost && !user && (
                  <Link to="/login" className="flex-grow">
                    <button className="w-full flex items-center justify-center gap-3 py-4 text-sm uppercase tracking-[0.2em] font-black rounded-[2rem] border bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20 hover:border-emerald-500/50 transition-all active:scale-95">
                      <HandHeart size={18} />
                      Log in to contact reporter
                    </button>
                  </Link>
                )}
                {!isPoster && isLost && user && (
                  <button
                    onClick={handleFoundThis}
                    disabled={contactLoading || !!contactInfo}
                    className="flex-grow flex items-center justify-center gap-3 py-4 text-sm uppercase tracking-[0.2em] font-black rounded-[2rem] border transition-all active:scale-95 disabled:cursor-default
                      bg-emerald-500/10 border-emerald-500/30 text-emerald-400
                      hover:bg-emerald-500/20 hover:border-emerald-500/50
                      disabled:opacity-60"
                  >
                    {contactLoading ? (
                      <>
                        <span className="w-4 h-4 border-2 border-emerald-400/30 border-t-emerald-400 rounded-full animate-spin" />
                        Fetching contact…
                      </>
                    ) : contactInfo ? (
                      <>
                        <CheckCheck size={18} />
                        Contact Revealed
                      </>
                    ) : (
                      <>
                        <HandHeart size={18} />
                        I Found This Item — Contact Reporter
                      </>
                    )}
                  </button>
                )}

                {isClaimed && !isPoster && !claimerContact && (
                  <div className="flex-grow py-4 px-6 bg-amber-500/10 border border-amber-500/20 rounded-[2rem] text-center">
                    <p className="text-amber-400 font-black text-xs uppercase tracking-widest">Claim Verified</p>
                    <p className="text-slate-400 text-xs mt-1">Ownership verified — awaiting physical handover.</p>
                  </div>
                )}
                {isResolved && !isPoster && (
                  <div className="flex-grow py-4 px-6 bg-purple-500/10 border border-purple-500/20 rounded-[2rem] text-center">
                    <p className="text-purple-400 font-black text-xs uppercase tracking-widest">Item Resolved</p>
                    <p className="text-slate-400 text-xs mt-1">Successfully returned to its owner.</p>
                  </div>
                )}
                <button
                  onClick={handleShare}
                  className="p-4 bg-white/5 text-slate-400 hover:text-brand-gold hover:bg-white/10 rounded-2xl transition-all border border-white/5"
                  title="Share link"
                >
                  <Share2 size={22} />
                </button>
              </div>

              {/* ── Contact Info Panel (revealed after "I Found This") ── */}
              {contactInfo && isLost && !isPoster && (
                <div className="p-6 bg-emerald-500/10 border border-emerald-500/30 rounded-[2rem] space-y-5 animate-fade-in">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-emerald-500/20 rounded-2xl flex items-center justify-center shrink-0">
                      <HandHeart size={20} className="text-emerald-400" />
                    </div>
                    <div>
                      <p className="text-emerald-400 font-black text-sm uppercase tracking-widest">Reporter's Contact</p>
                      <p className="text-slate-400 text-xs mt-0.5">They've been notified that you found their item.</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {/* Name */}
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-white/5 rounded-xl border border-white/5 shrink-0">
                        <User size={14} className="text-brand-gold" />
                      </div>
                      <span className="font-bold text-white text-sm">{contactInfo.fullName}</span>
                    </div>

                    {/* Email */}
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-white/5 rounded-xl border border-white/5 shrink-0">
                        <Mail size={14} className="text-brand-gold" />
                      </div>
                      <span className="font-bold text-white text-sm flex-1 break-all">{contactInfo.email}</span>
                      <button
                        onClick={() => copyToClipboard(contactInfo.email, setCopiedEmail)}
                        className="p-2 text-slate-500 hover:text-emerald-400 rounded-xl hover:bg-white/5 transition-all shrink-0"
                        title="Copy email"
                      >
                        {copiedEmail ? <CheckCheck size={14} className="text-emerald-400" /> : <Copy size={14} />}
                      </button>
                      <a
                        href={`mailto:${contactInfo.email}?subject=I found your lost item: ${encodeURIComponent(item.title)}&body=Hi ${encodeURIComponent(contactInfo.fullName)},%0A%0AI found your lost item "${encodeURIComponent(item.title)}" and would like to return it to you.%0A%0APlease reply so we can arrange a handover.`}
                        className="px-3 py-1.5 bg-emerald-500 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-emerald-400 transition-colors shrink-0"
                      >
                        Email
                      </a>
                    </div>

                    {/* Phone (optional) */}
                    {contactInfo.phone && (
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-white/5 rounded-xl border border-white/5 shrink-0">
                          <Phone size={14} className="text-brand-gold" />
                        </div>
                        <span className="font-bold text-white text-sm flex-1">{contactInfo.phone}</span>
                        <button
                          onClick={() => copyToClipboard(contactInfo.phone, setCopiedPhone)}
                          className="p-2 text-slate-500 hover:text-emerald-400 rounded-xl hover:bg-white/5 transition-all shrink-0"
                          title="Copy phone"
                        >
                          {copiedPhone ? <CheckCheck size={14} className="text-emerald-400" /> : <Copy size={14} />}
                        </button>
                        <a
                          href={`tel:${contactInfo.phone}`}
                          className="px-3 py-1.5 bg-emerald-500 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-emerald-400 transition-colors shrink-0"
                        >
                          Call
                        </a>
                      </div>
                    )}
                  </div>

                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    <span className="text-amber-400 font-bold">⚠ Safety tip:</span> Always meet in a public campus location or at the Security Office to hand over the item.
                  </p>
                </div>
              )}

              {/* ── Finder contact card (shown to the approved claimant) ── */}
              {isClaimed && !isPoster && claimerContact && (
                <div className="p-6 bg-emerald-500/10 border border-emerald-500/30 rounded-[2rem] space-y-5 animate-fade-in">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-emerald-500/20 rounded-2xl flex items-center justify-center shrink-0">
                      <ShieldCheck size={20} className="text-emerald-400" />
                    </div>
                    <div>
                      <p className="text-emerald-400 font-black text-sm uppercase tracking-widest">Claim Approved — Finder's Contact</p>
                      <p className="text-slate-400 text-xs mt-0.5">Arrange a safe campus handover to collect your item.</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {/* Name */}
                    <div className="flex items-center gap-3 p-3 bg-white/5 rounded-2xl border border-white/5">
                      <div className="p-2 bg-brand-blue/50 rounded-xl shrink-0">
                        <User size={14} className="text-brand-gold" />
                      </div>
                      <div>
                        <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">Name</p>
                        <p className="font-bold text-white text-sm">{claimerContact.fullName}</p>
                      </div>
                    </div>

                    {/* Email */}
                    <div className="flex items-center gap-3 p-3 bg-white/5 rounded-2xl border border-white/5">
                      <div className="p-2 bg-brand-blue/50 rounded-xl shrink-0">
                        <Mail size={14} className="text-brand-gold" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">Email</p>
                        <a href={`mailto:${claimerContact.email}`} className="font-bold text-brand-gold text-sm hover:underline break-all">
                          {claimerContact.email}
                        </a>
                      </div>
                      <button
                        onClick={() => copyToClipboard(claimerContact.email, setCopiedEmail)}
                        className="p-2 text-slate-500 hover:text-emerald-400 rounded-xl hover:bg-white/5 transition-all shrink-0"
                        title="Copy email"
                      >
                        {copiedEmail ? <CheckCheck size={14} className="text-emerald-400" /> : <Copy size={14} />}
                      </button>
                    </div>

                    {/* Phone (optional) */}
                    {claimerContact.phone && (
                      <div className="flex items-center gap-3 p-3 bg-white/5 rounded-2xl border border-white/5">
                        <div className="p-2 bg-brand-blue/50 rounded-xl shrink-0">
                          <Phone size={14} className="text-brand-gold" />
                        </div>
                        <div className="flex-1">
                          <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">Phone</p>
                          <a href={`tel:${claimerContact.phone}`} className="font-bold text-brand-gold text-sm hover:underline">
                            {claimerContact.phone}
                          </a>
                        </div>
                        <button
                          onClick={() => copyToClipboard(claimerContact.phone, setCopiedPhone)}
                          className="p-2 text-slate-500 hover:text-emerald-400 rounded-xl hover:bg-white/5 transition-all shrink-0"
                          title="Copy phone"
                        >
                          {copiedPhone ? <CheckCheck size={14} className="text-emerald-400" /> : <Copy size={14} />}
                        </button>
                      </div>
                    )}
                  </div>

                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    These details were also sent to your email when the claim was approved.
                  </p>
                </div>
              )}

              {/* ── Security notice ── */}
              <div className="bg-amber-950/20 p-6 rounded-[2rem] border border-amber-900/30 flex gap-4">
                <div className="w-9 h-9 bg-amber-900/30 rounded-xl flex items-center justify-center shrink-0">
                  <Info className="text-amber-500" size={18} />
                </div>
                <p className="text-xs text-amber-200/70 leading-relaxed font-medium">
                  <span className="font-black text-amber-500 uppercase tracking-widest block mb-1">Safety Notice</span>
                  Always meet in a public campus location or at the Security Office. Your contact details are only shared after the claimer passes verification.
                </p>
              </div>
            </>
          )}

          {/* ── Claims Panel (poster only) ── */}
          {isPoster && (isFound || isClaimed || isResolved) && (
            <div className="space-y-5 pt-4 border-t border-white/5">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-black text-white uppercase tracking-widest">
                  Claims
                  {claims.length > 0 && (
                    <span className="ml-3 w-7 h-7 inline-flex items-center justify-center bg-brand-gold text-brand-blue-dark rounded-lg text-xs font-black">
                      {claims.length}
                    </span>
                  )}
                </h3>
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Risk-routed</span>
              </div>

              {loadingClaims ? (
                <div className="space-y-3">
                  {[1, 2].map(i => <div key={i} className="h-28 bg-white/5 rounded-2xl animate-pulse" />)}
                </div>
              ) : claims.length === 0 ? (
                <div className="p-8 bg-white/5 rounded-2xl border border-white/5 text-center">
                  <p className="text-slate-500 font-medium text-sm">No claims submitted yet.</p>
                  <p className="text-slate-600 text-xs mt-1">People who believe this is their item will appear here.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {claims.map(claim => {
                    const isApproved    = claim.status === 'approved' || claim.passed;
                    const isUnderReview = claim.status === 'under_review';
                    const isEscalated   = claim.status === 'escalated';
                    const isRejected    = claim.status === 'rejected';
                    // Finder can act on FINDER_REVIEW under_review claims (or old pending)
                    const needsAction   = (isUnderReview && claim.riskRoute === 'FINDER_REVIEW') ||
                                          (!claim.passed && claim.status === 'pending');

                    return (
                      <div
                        key={claim._id}
                        className={`p-5 rounded-2xl border space-y-4 ${
                          isApproved    ? 'bg-emerald-500/5 border-emerald-500/20' :
                          isUnderReview || isEscalated ? 'bg-amber-500/5 border-amber-500/20' :
                          isRejected    ? 'bg-rose-500/5 border-rose-500/20' :
                                          'bg-slate-900/60 border-white/10'
                        }`}
                      >
                        {/* Claimant header */}
                        <div className="flex justify-between items-start gap-3">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 bg-brand-blue/50 rounded-xl flex items-center justify-center text-brand-gold font-black text-sm border border-white/10 shrink-0">
                              {claim.claimant?.fullName?.charAt(0) || '?'}
                            </div>
                            <div>
                              <p className="text-white font-bold text-sm">{claim.claimant?.fullName}</p>
                              <p className="text-xs text-slate-500">{claim.claimant?.email}</p>
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-1.5 shrink-0">
                            <span className={`px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-widest border ${
                              isApproved    ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/20' :
                              isUnderReview ? 'bg-amber-500/20 text-amber-400 border-amber-500/20' :
                              isEscalated   ? 'bg-orange-500/20 text-orange-400 border-orange-500/20' :
                              isRejected    ? 'bg-rose-500/20 text-rose-400 border-rose-500/20' :
                                              'bg-slate-500/20 text-slate-400 border-slate-500/20'
                            }`}>
                              {isApproved    ? '✓ Approved' :
                               isUnderReview ? '⏳ Review' :
                               isEscalated   ? '⬆ Escalated' :
                               isRejected    ? '✗ Rejected' : claim.status}
                            </span>
                            {claim.isFlagged && (
                              <span className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-red-500/20 text-red-400 border border-red-500/30 text-[9px] font-black uppercase tracking-wider">
                                <Flag size={8} />
                                Flagged
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Optional context: location hint */}
                        {claim.locationHint && (
                          <div className="flex items-center gap-2 text-[10px] text-slate-400">
                            <MapPin size={11} className="text-brand-gold shrink-0" />
                            <span>Location hint: <strong className="text-slate-300">{claim.locationHint}</strong></span>
                          </div>
                        )}

                        {/* Scores: raw answers + composite */}
                        {claim.totalQuestions > 0 && (
                          <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                              <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                                <span className="text-slate-500">Answers</span>
                                <span className={isApproved ? 'text-emerald-400' : isRejected ? 'text-rose-400' : 'text-amber-400'}>
                                  {claim.score}/{claim.totalQuestions}
                                </span>
                              </div>
                              <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full transition-all duration-700 ${isApproved ? 'bg-emerald-500' : isRejected ? 'bg-rose-500' : 'bg-amber-500'}`}
                                  style={{ width: `${claim.totalQuestions > 0 ? (claim.score / claim.totalQuestions) * 100 : 0}%` }}
                                />
                              </div>
                            </div>
                            {claim.compositeScore !== undefined && (
                              <div className="space-y-1">
                                <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                                  <span className="text-slate-500">Composite</span>
                                  <span className={claim.compositeScore >= 75 ? 'text-emerald-400' : claim.compositeScore >= 50 ? 'text-amber-400' : 'text-rose-400'}>
                                    {claim.compositeScore}/100
                                  </span>
                                </div>
                                <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                                  <div
                                    className={`h-full rounded-full transition-all duration-700 ${claim.compositeScore >= 75 ? 'bg-emerald-500' : claim.compositeScore >= 50 ? 'bg-amber-500' : 'bg-rose-500'}`}
                                    style={{ width: `${claim.compositeScore}%` }}
                                  />
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Fraud flags (if any) */}
                        {claim.fraudFlags?.length > 0 && (
                          <div className="p-3 bg-red-950/30 border border-red-500/20 rounded-xl space-y-1">
                            <p className="text-[9px] font-black text-red-400 uppercase tracking-widest">Fraud Flags</p>
                            {claim.fraudFlags.map((flag, i) => (
                              <p key={i} className="text-[10px] text-red-300/70">{flag.replace(/_/g, ' ')}</p>
                            ))}
                          </div>
                        )}

                        {/* Route reason */}
                        {claim.routeReason && !isApproved && !isRejected && (
                          <p className="text-[10px] text-slate-500 italic">{claim.routeReason}</p>
                        )}

                        {/* Q&A answers */}
                        <div className="space-y-1.5 pt-1 border-t border-white/5">
                          {claim.answers.map((ans, i) => (
                            <div key={i} className="flex items-start gap-2.5 bg-white/5 p-3 rounded-xl">
                              <span className="mt-0.5 shrink-0">
                                {ans.isCorrect
                                  ? <Check size={13} className="text-emerald-500" />
                                  : <X size={13} className="text-rose-500" />}
                              </span>
                              <div className="min-w-0">
                                <p className="text-[10px] text-slate-500 leading-snug">Q: {ans.question}</p>
                                <p className="text-xs text-white font-bold mt-0.5">A: {ans.providedAnswer}</p>
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Finder action buttons (approve / reject / escalate) */}
                        {needsAction && !isApproved && !isRejected && !isEscalated && (
                          <div className="flex gap-2 pt-1 flex-wrap">
                            <button
                              onClick={() => handleUpdateClaim(claim._id, 'approved')}
                              className="flex-1 min-w-[80px] py-2 bg-emerald-500/15 text-emerald-400 text-xs font-black rounded-xl hover:bg-emerald-500 hover:text-white transition-colors border border-emerald-500/20"
                            >
                              ✓ Approve
                            </button>
                            <button
                              onClick={() => handleUpdateClaim(claim._id, 'rejected')}
                              className="flex-1 min-w-[80px] py-2 bg-rose-500/15 text-rose-400 text-xs font-black rounded-xl hover:bg-rose-500 hover:text-white transition-colors border border-rose-500/20"
                            >
                              ✗ Reject
                            </button>
                            <button
                              onClick={() => handleUpdateClaim(claim._id, 'escalated', 'Escalated by finder — unsure about this claim')}
                              className="flex items-center gap-1.5 px-3 py-2 bg-orange-500/15 text-orange-400 text-xs font-black rounded-xl hover:bg-orange-500 hover:text-white transition-colors border border-orange-500/20"
                              title="Send to admin for review"
                            >
                              <ArrowUpCircle size={13} />
                              Escalate to Admin
                            </button>
                          </div>
                        )}

                        {/* Escalated state info */}
                        {isEscalated && (
                          <div className="p-3 bg-orange-950/20 border border-orange-500/20 rounded-xl">
                            <p className="text-[10px] text-orange-400 font-black uppercase tracking-widest">Escalated to Admin Review</p>
                            <p className="text-[10px] text-slate-500 mt-1">The admin team will make the final decision on this claim.</p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ── Review Prompt (poster after resolved, OR claimant after claim passed) ── */}
          {reviewLoaded && ((isPoster && isResolved) || (!isPoster && claimPassed && (isClaimed || isResolved))) && (
            <div className="pt-4 border-t border-white/5 space-y-5">
              <h3 className="text-xl font-black text-white uppercase tracking-widest flex items-center gap-3">
                <Star size={20} className="text-brand-gold" />
                {myReview ? 'Your Review' : 'Share Your Experience'}
              </h3>

              {myReview ? (
                /* ── Already submitted ── */
                <div className="p-6 bg-emerald-500/5 border border-emerald-500/20 rounded-2xl space-y-3">
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map(s => (
                      <Star
                        key={s}
                        size={18}
                        className={s <= myReview.rating ? 'text-brand-gold fill-brand-gold' : 'text-slate-700'}
                      />
                    ))}
                  </div>
                  <p className="text-slate-300 text-sm leading-relaxed font-medium italic">"{myReview.message}"</p>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                    Submitted {new Date(myReview.createdAt).toLocaleDateString()}
                  </p>
                </div>
              ) : (
                /* ── Review form ── */
                <div className="p-6 bg-slate-900/60 border border-white/10 rounded-2xl space-y-5">
                  <p className="text-slate-400 text-xs leading-relaxed">
                    {isPoster
                      ? 'The item has been successfully returned. How was your experience using CIRS?'
                      : 'Your ownership was verified and contact details were exchanged. How was your experience?'}
                    {' '}Your review will be displayed on the homepage to help other students.
                  </p>

                  {/* Star picker */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-brand-gold">Rating</label>
                    <div className="flex gap-2">
                      {[1, 2, 3, 4, 5].map(s => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => setReviewRating(s)}
                          onMouseEnter={() => setReviewHover(s)}
                          onMouseLeave={() => setReviewHover(0)}
                          className="p-1 transition-transform hover:scale-125 active:scale-110"
                        >
                          <Star
                            size={28}
                            className={
                              s <= (reviewHover || reviewRating)
                                ? 'text-brand-gold fill-brand-gold'
                                : 'text-slate-700'
                            }
                          />
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Message */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-brand-gold">Your experience</label>
                    <textarea
                      rows="3"
                      maxLength={400}
                      placeholder="e.g. CIRS made it so easy to return the item. The verification system gave me confidence..."
                      value={reviewMessage}
                      onChange={e => setReviewMessage(e.target.value)}
                      className="input-field p-4 w-full resize-none text-sm"
                    />
                    <p className="text-right text-[10px] text-slate-600">{reviewMessage.length}/400</p>
                  </div>

                  <Button
                    variant="accent"
                    size="sm"
                    icon={Star}
                    loading={submittingReview}
                    onClick={handleSubmitReview}
                    disabled={reviewMessage.trim().length < 10}
                  >
                    Submit Review
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
