import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import useItemStore from '../store/useItemStore';
import useAuthStore from '../store/useAuthStore';
import {
  ShieldCheck, ArrowLeft, Info, Send, Lock,
  CheckCircle, XCircle, Phone, Mail, User,
  AlertTriangle, Unlock, HelpCircle, Clock, MapPin, Hourglass
} from 'lucide-react';
import { toast } from 'sonner';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import claimApi from '../api/claimApi';

const STRICT_CATEGORIES = ['Money', 'Cards'];
const RISK_COLORS = {
  LOW:    'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
  MEDIUM: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
  HIGH:   'text-rose-400 bg-rose-500/10 border-rose-500/20'
};

export default function SubmitClaim() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { items, fetchItems } = useItemStore();
  const { isAuthenticated } = useAuthStore();

  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(false);
  const [answers, setAnswers] = useState({});
  const [locationHint, setLocationHint] = useState('');
  const [reportedTime, setReportedTime] = useState('');
  const [result, setResult] = useState(null);
  const [existingClaim, setExistingClaim] = useState(null);
  const [checkingClaim, setCheckingClaim] = useState(true);

  // Resolve item from store or fetch
  useEffect(() => {
    const found = items.find(i => (i._id || i.id) === id);
    if (found) {
      setItem(found);
    } else {
      fetchItems();
    }
  }, [id, items, fetchItems]);

  useEffect(() => {
    if (items.length > 0) {
      const found = items.find(i => (i._id || i.id) === id);
      if (found) setItem(found);
    }
  }, [items, id]);

  // Check if user already has a claim for this item
  useEffect(() => {
    if (!isAuthenticated || !id) return;
    setCheckingClaim(true);
    claimApi.getMyClaimForItem(id)
      .then(res => {
        if (res.data?.claim) {
          const { claim, finderContact } = res.data;
          setExistingClaim(res.data);

          if (claim.status === 'approved' || claim.passed) {
            setResult({ status: 'approved', passed: true, score: claim.score, totalQuestions: claim.totalQuestions, compositeScore: claim.compositeScore, finderContact });
          } else if (claim.status === 'under_review' || claim.status === 'escalated') {
            setResult({ status: 'under_review', passed: false, score: claim.score, totalQuestions: claim.totalQuestions, compositeScore: claim.compositeScore, route: claim.riskRoute, reason: claim.routeReason });
          } else if (claim.status === 'rejected') {
            setResult({ status: 'rejected', passed: false, score: claim.score, totalQuestions: claim.totalQuestions, compositeScore: claim.compositeScore });
          }
        }
      })
      .catch(() => {})
      .finally(() => setCheckingClaim(false));
  }, [id, isAuthenticated]);

  const questions     = item?.verificationQuestions || [];
  const isStrict      = STRICT_CATEGORIES.includes(item?.category);
  const threshold     = isStrict ? questions.length : Math.max(2, Math.ceil((2 / 3) * questions.length));
  const riskLevel     = item?.riskLevel || 'LOW';
  const requiresManual = isStrict || riskLevel === 'MEDIUM' || riskLevel === 'HIGH';

  const allAnswered = questions.every((_, i) => (answers[i] || '').trim().length > 0);

  const handleAnswerChange = (index, value) => {
    setAnswers(prev => ({ ...prev, [index]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!allAnswered) {
      toast.error('Please answer all questions before submitting.');
      return;
    }

    setLoading(true);
    try {
      const formattedAnswers = questions.map((q, i) => ({
        question:       q.question,
        providedAnswer: answers[i] || ''
      }));

      const res = await claimApi.submitClaim(
        item._id || item.id,
        formattedAnswers,
        locationHint,
        reportedTime || null
      );

      const { score, totalQuestions, compositeScore, passed, status, route, reason, finderContact } = res.data;
      setResult({ score, totalQuestions, compositeScore, passed, status, route, reason, finderContact });

      if (status === 'approved') {
        toast.success(`Verified! ${score}/${totalQuestions} correct — contact details unlocked.`);
      } else if (status === 'under_review') {
        toast.info('Your claim is under review. You\'ll be notified of the decision.');
      } else {
        toast.error(`Verification failed. ${score}/${totalQuestions} correct. Needed ${threshold}/${totalQuestions}.`);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (checkingClaim || !item) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 border-4 border-brand-gold/30 border-t-brand-gold rounded-full animate-spin mx-auto"></div>
          <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Loading...</p>
        </div>
      </div>
    );
  }

  const badgeVariant = result?.status === 'approved'
    ? 'success'
    : result?.status === 'under_review'
    ? 'warning'
    : existingClaim
    ? 'danger'
    : 'warning';

  const badgeLabel = result?.status === 'approved'
    ? '✓ Verified'
    : result?.status === 'under_review'
    ? '⏳ Under Review'
    : existingClaim
    ? 'Already Attempted'
    : 'Pending Verification';

  return (
    <div className="max-w-4xl mx-auto space-y-12 animate-fade-in pb-20 pt-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
        <div className="space-y-4">
          <Link to={`/item/${id}`} className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 hover:text-brand-gold mb-2 transition-all group">
            <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
            Back to Item
          </Link>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tighter leading-tight">
            Verify <span className="text-brand-gold">Ownership</span>
          </h1>
          <p className="text-slate-400 font-medium max-w-xl">
            Claiming: <span className="text-white font-bold">"{item.title}"</span>
          </p>
        </div>
        <Badge variant={badgeVariant}>{badgeLabel}</Badge>
      </div>

      {/* Item Preview Strip */}
      <div className="glass-card p-6 rounded-[2rem] border-white/5 flex items-center gap-6">
        <div className="w-20 h-20 rounded-2xl overflow-hidden border border-white/10 shrink-0">
          <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-white font-black text-lg truncate">{item.title}</p>
          <p className="text-slate-500 text-xs font-medium mt-1">{item.category} · {item.location}</p>
        </div>
        <div className="shrink-0 flex flex-col items-end gap-2">
          {/* Risk level badge */}
          <span className={`px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-widest border ${RISK_COLORS[riskLevel] || RISK_COLORS.LOW}`}>
            {riskLevel} RISK
          </span>
          <div className="text-right">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Pass threshold</p>
            <p className="text-brand-gold font-black text-lg">{threshold}/{questions.length}</p>
          </div>
        </div>
      </div>

      {/* Strict / manual review warning */}
      {isStrict && !result && (
        <div className="p-5 bg-rose-950/30 border border-rose-500/30 rounded-[2rem] flex gap-4">
          <AlertTriangle size={20} className="text-rose-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-black text-rose-400 uppercase tracking-widest mb-1">High-Security Item — Manual Review Required</p>
            <p className="text-xs text-rose-300/80 leading-relaxed">
              This is a <strong>{item.category}</strong> item. You must answer <strong>ALL {questions.length} questions correctly</strong>.
              Even then, the finder must <strong>manually approve</strong> your claim before contact details are released.
            </p>
          </div>
        </div>
      )}

      {!isStrict && requiresManual && !result && (
        <div className="p-5 bg-amber-950/30 border border-amber-500/30 rounded-[2rem] flex gap-4">
          <Hourglass size={20} className="text-amber-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-black text-amber-400 uppercase tracking-widest mb-1">{riskLevel} Risk — Finder Review Required</p>
            <p className="text-xs text-amber-300/80 leading-relaxed">
              This item's risk level requires the finder to manually review your claim before contact details are released.
              Providing optional context (location &amp; time) can strengthen your claim.
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-12">
        <div className="lg:col-span-2">

          {/* ── RESULT PANEL ── */}
          {result ? (
            result.status === 'approved' || result.passed ? (
              /* ✅ Approved */
              <div className="space-y-6 animate-fade-in">
                <div className="glass-card p-5 sm:p-8 rounded-[2rem] sm:rounded-[3rem] border-emerald-500/30 bg-emerald-500/5 space-y-6 sm:space-y-8">
                  <div className="flex items-center gap-6">
                    <div className="w-16 h-16 bg-emerald-500 rounded-2xl flex items-center justify-center shadow-[0_0_30px_rgba(16,185,129,0.4)] shrink-0">
                      <Unlock size={32} className="text-white" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-black text-white">Ownership Verified!</h2>
                      <p className="text-emerald-400 text-xs font-black uppercase tracking-widest mt-1">
                        {result.score}/{result.totalQuestions} correct · Contact unlocked
                      </p>
                    </div>
                  </div>

                  {/* Score bar */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                      <span className="text-slate-500">Score</span>
                      <span className="text-emerald-400">{result.score}/{result.totalQuestions}</span>
                    </div>
                    <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 rounded-full transition-all duration-1000"
                        style={{ width: `${result.totalQuestions > 0 ? (result.score / result.totalQuestions) * 100 : 0}%` }}
                      />
                    </div>
                  </div>

                  {/* Finder Contact Card */}
                  {result.finderContact && (
                    <div className="p-5 sm:p-8 bg-white/5 rounded-[1.5rem] sm:rounded-[2rem] border border-emerald-500/20 space-y-6">
                      <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-3">
                        <ShieldCheck size={18} className="text-emerald-400" />
                        Finder's Contact Details
                      </h3>
                      <div className="space-y-4">
                        <div className="flex items-center gap-4 p-4 bg-white/5 rounded-2xl">
                          <div className="w-10 h-10 bg-brand-blue/50 rounded-xl flex items-center justify-center border border-white/10">
                            <User size={18} className="text-brand-gold" />
                          </div>
                          <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Full Name</p>
                            <p className="text-white font-bold">{result.finderContact.fullName}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4 p-4 bg-white/5 rounded-2xl">
                          <div className="w-10 h-10 bg-brand-blue/50 rounded-xl flex items-center justify-center border border-white/10">
                            <Mail size={18} className="text-brand-gold" />
                          </div>
                          <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Email</p>
                            <a href={`mailto:${result.finderContact.email}`} className="text-brand-gold font-bold hover:underline">
                              {result.finderContact.email}
                            </a>
                          </div>
                        </div>
                        {result.finderContact.phone && (
                          <div className="flex items-center gap-4 p-4 bg-white/5 rounded-2xl">
                            <div className="w-10 h-10 bg-brand-blue/50 rounded-xl flex items-center justify-center border border-white/10">
                              <Phone size={18} className="text-brand-gold" />
                            </div>
                            <div>
                              <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Phone</p>
                              <a href={`tel:${result.finderContact.phone}`} className="text-brand-gold font-bold hover:underline">
                                {result.finderContact.phone}
                              </a>
                            </div>
                          </div>
                        )}
                      </div>
                      <p className="text-[10px] text-slate-500 italic">
                        These details have also been sent to your email. Arrange a safe handover in a public campus location.
                      </p>
                    </div>
                  )}

                  <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard')} className="w-full">
                    Return to Dashboard
                  </Button>
                </div>
              </div>
            ) : result.status === 'under_review' ? (
              /* ⏳ Under Review */
              <div className="glass-card p-5 sm:p-8 rounded-[2rem] sm:rounded-[3rem] border-amber-500/20 bg-amber-500/5 space-y-6 sm:space-y-8 animate-fade-in">
                <div className="flex items-center gap-6">
                  <div className="w-16 h-16 bg-amber-500/20 border border-amber-500/30 rounded-2xl flex items-center justify-center shrink-0">
                    <Hourglass size={32} className="text-amber-400" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black text-white">Claim Under Review</h2>
                    <p className="text-amber-400 text-xs font-black uppercase tracking-widest mt-1">
                      {result.route === 'ADMIN_REVIEW' ? 'Admin reviewing' : 'Finder reviewing'} · {result.score}/{result.totalQuestions} correct
                    </p>
                  </div>
                </div>

                {/* Composite score bar */}
                {result.compositeScore !== undefined && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                      <span className="text-slate-500">Composite Score</span>
                      <span className="text-amber-400">{result.compositeScore}/100</span>
                    </div>
                    <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-amber-500 rounded-full transition-all duration-1000"
                        style={{ width: `${result.compositeScore}%` }}
                      />
                    </div>
                  </div>
                )}

                <div className="p-6 bg-white/5 rounded-2xl text-sm text-slate-400 leading-relaxed space-y-3">
                  <p>
                    Your claim has been submitted and is awaiting manual review by the <strong className="text-white">{result.route === 'ADMIN_REVIEW' ? 'admin team' : 'finder'}</strong>.
                  </p>
                  {result.reason && (
                    <p className="text-[11px] text-amber-400/70 italic">{result.reason}</p>
                  )}
                  <p className="text-xs">You will receive a notification and email when a decision is made. You may not resubmit.</p>
                </div>

                <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard')} className="w-full">
                  Return to Dashboard
                </Button>
              </div>
            ) : (
              /* ❌ Rejected */
              <div className="glass-card p-5 sm:p-8 rounded-[2rem] sm:rounded-[3rem] border-rose-500/20 bg-rose-500/5 space-y-6 sm:space-y-8 animate-fade-in">
                <div className="flex items-center gap-6">
                  <div className="w-16 h-16 bg-rose-500/20 border border-rose-500/30 rounded-2xl flex items-center justify-center shrink-0">
                    <XCircle size={32} className="text-rose-500" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black text-white">Verification Failed</h2>
                    <p className="text-rose-400 text-xs font-black uppercase tracking-widest mt-1">
                      {result.score}/{result.totalQuestions} correct · Needed {threshold}/{result.totalQuestions}
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                    <span className="text-slate-500">Score</span>
                    <span className="text-rose-400">{result.score}/{result.totalQuestions}</span>
                  </div>
                  <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-rose-500 rounded-full transition-all duration-1000"
                      style={{ width: `${result.totalQuestions > 0 ? (result.score / result.totalQuestions) * 100 : 0}%` }}
                    />
                  </div>
                </div>

                <div className="p-6 bg-white/5 rounded-2xl text-sm text-slate-400 leading-relaxed">
                  You answered <strong className="text-white">{result.score}</strong> out of <strong className="text-white">{result.totalQuestions}</strong> questions correctly.
                  {' '}You may not resubmit a claim for this item. If you believe this is your item, contact campus security.
                </div>

                <Button variant="ghost" size="sm" onClick={() => navigate('/')} className="w-full">
                  Browse Other Items
                </Button>
              </div>
            )
          ) : (
            /* ── FORM ── */
            <form className="glass-card p-5 sm:p-10 rounded-[2rem] sm:rounded-[3rem] border-white/5 space-y-8 sm:space-y-10" onSubmit={handleSubmit}>
              <div className="space-y-6">
                <p className="text-xs text-slate-400 leading-relaxed">
                  Answer the {questions.length} question{questions.length !== 1 ? 's' : ''} below.
                  You need at least <strong className="text-white">{threshold}</strong> correct to unlock the finder's contact.
                  Answers are case-insensitive and minor typos are forgiven.
                </p>

                {questions.map((q, index) => (
                  <div key={index} className="space-y-3 p-6 glass-card rounded-[2rem] border-white/5">
                    <div className="flex items-start gap-3">
                      <span className="w-7 h-7 bg-brand-gold/10 text-brand-gold rounded-lg flex items-center justify-center text-[10px] font-black border border-brand-gold/20 shrink-0 mt-0.5">
                        Q{index + 1}
                      </span>
                      <p className="text-sm font-bold text-white leading-snug">{q.question}</p>
                    </div>
                    <div className="relative pl-10">
                      <HelpCircle size={14} className="absolute left-3 top-3.5 text-slate-600" />
                      <input
                        type="text"
                        autoComplete="off"
                        className="input-field w-full pl-8"
                        placeholder="Type your answer here..."
                        value={answers[index] || ''}
                        onChange={(e) => handleAnswerChange(index, e.target.value)}
                        required
                      />
                    </div>
                  </div>
                ))}

                {/* ── Optional context hints ─────────────────────────────── */}
                <div className="p-6 bg-white/3 rounded-[2rem] border border-white/5 space-y-5">
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                    Optional Context — improves your composite score
                  </p>

                  {/* Location hint */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-brand-gold/70 flex items-center gap-2">
                      <MapPin size={12} />
                      Where did you lose it? (approximate location)
                    </label>
                    <input
                      className="input-field w-full"
                      placeholder="e.g. Near the Science faculty library entrance..."
                      value={locationHint}
                      onChange={e => setLocationHint(e.target.value)}
                    />
                  </div>

                  {/* Reported time */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-brand-gold/70 flex items-center gap-2">
                      <Clock size={12} />
                      Approximate time you lost it
                    </label>
                    <input
                      type="datetime-local"
                      className="input-field w-full"
                      value={reportedTime}
                      onChange={e => setReportedTime(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div className="pt-4">
                <Button
                  loading={loading}
                  type="submit"
                  variant="accent"
                  size="xl"
                  className="w-full"
                  icon={ShieldCheck}
                  disabled={!allAnswered}
                >
                  Submit & Verify Ownership
                </Button>
                {requiresManual && (
                  <p className="text-center text-[10px] text-amber-500/70 mt-3 font-medium flex items-center justify-center gap-1.5">
                    <Hourglass size={11} />
                    This item requires manual review — contact details won't be released immediately.
                  </p>
                )}
                {!allAnswered && (
                  <p className="text-center text-[10px] text-slate-500 mt-3 font-medium">
                    Answer all {questions.length} questions to enable submission.
                  </p>
                )}
              </div>
            </form>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-8">
          <div className="glass-card p-5 sm:p-8 rounded-[2rem] sm:rounded-[3rem] border-white/5 space-y-6">
            <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-3">
              <Info className="text-brand-gold" size={18} />
              How It Works
            </h3>
            <div className="space-y-5">
              {[
                ['01', 'Answer all questions', 'Set by whoever found this item.'],
                ['02', 'System auto-grades', 'Handles typos, casing, word order.'],
                requiresManual
                  ? ['03', 'Manual review', `This item needs ${riskLevel === 'HIGH' || isStrict ? 'admin / finder' : 'finder'} approval.`]
                  : ['03', 'Auto-verified', 'If score ≥ 75, contact released instantly.'],
                ['04', 'Contact revealed', "Finder's details in-app and via email."],
              ].map(([num, title, desc]) => (
                <div key={num} className="flex gap-4">
                  <span className="w-8 h-8 bg-white/5 rounded-xl flex items-center justify-center text-[10px] font-black text-slate-500 border border-white/10 shrink-0">{num}</span>
                  <div>
                    <p className="text-xs font-black text-white">{title}</p>
                    <p className="text-[10px] text-slate-500 mt-0.5">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Scoring explanation */}
          <div className="glass-card p-5 sm:p-8 rounded-[2rem] sm:rounded-[3rem] border-white/5 space-y-4">
            <h3 className="text-sm font-black text-white uppercase tracking-widest">Score Weights</h3>
            {[
              ['Answer accuracy', '60%'],
              ['Location match', '15%'],
              ['Time proximity', '10%'],
              ['Answer detail', '15%'],
            ].map(([label, weight]) => (
              <div key={label} className="flex justify-between items-center">
                <span className="text-[10px] text-slate-400 font-medium">{label}</span>
                <span className="text-[10px] font-black text-brand-gold">{weight}</span>
              </div>
            ))}
          </div>

          <div className="bg-rose-950/20 p-5 sm:p-8 rounded-[2rem] sm:rounded-[3rem] border border-rose-900/30">
            <p className="text-[10px] text-rose-300/70 leading-relaxed font-medium">
              <span className="font-black text-rose-500 uppercase tracking-widest block mb-2">Legal Notice</span>
              False ownership claims are a violation of campus policy and may lead to disciplinary action.
              Repeated fraudulent attempts are logged and reported to campus authorities.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
