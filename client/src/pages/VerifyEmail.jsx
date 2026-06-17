import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { applyActionCode, sendEmailVerification } from 'firebase/auth';
import { auth } from '../config/firebase';
import {
  Mail, CheckCircle, XCircle, Loader, ArrowRight,
  ShieldCheck, RefreshCw, AlertTriangle
} from 'lucide-react';
import { toast } from 'sonner';

const CLIENT_URL = import.meta.env.VITE_CLIENT_URL || 'http://localhost:5173';

// Status can be: 'verifying' | 'success' | 'error' | 'waiting'
export default function VerifyEmail() {
  const [searchParams]  = useSearchParams();
  const navigate        = useNavigate();
  const [status, setStatus]   = useState('waiting');
  const [errorMsg, setErrorMsg] = useState('');
  const [resending, setResending] = useState(false);

  const mode    = searchParams.get('mode');
  const oobCode = searchParams.get('oobCode');

  useEffect(() => {
    // Only process if Firebase sent us here with a real action code
    if (mode !== 'verifyEmail' || !oobCode) return;

    setStatus('verifying');

    applyActionCode(auth, oobCode)
      .then(() => {
        setStatus('success');
        toast.success('Email verified! Redirecting to login…');
        // Give user 3 seconds to read the success message then redirect
        setTimeout(() => navigate('/login'), 3000);
      })
      .catch(err => {
        console.error('[VerifyEmail] applyActionCode error:', err.code, err.message);
        let msg = 'Something went wrong. Please try requesting a new verification email.';
        if (err.code === 'auth/expired-action-code') {
          msg = 'This verification link has expired. Please sign in and request a new one.';
        } else if (err.code === 'auth/invalid-action-code') {
          msg = 'This link is invalid or has already been used. If you already verified, just sign in.';
        } else if (err.code === 'auth/user-disabled') {
          msg = 'Your account has been disabled. Please contact support.';
        }
        setErrorMsg(msg);
        setStatus('error');
      });
  }, []); // intentionally only runs once on mount

  const handleResend = async () => {
    const fbUser = auth.currentUser;
    if (!fbUser) {
      toast.error('Please sign in first, then we can resend the verification email.');
      navigate('/login');
      return;
    }
    setResending(true);
    try {
      await sendEmailVerification(fbUser, {
        url: `${CLIENT_URL}/login?verified=true`,
      });
      toast.success('Verification email resent! Check your inbox.');
    } catch (err) {
      toast.error(err.message || 'Failed to resend. Try again shortly.');
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-brand-blue/20 rounded-full blur-[120px] -z-10" />

      <div className="max-w-md w-full text-center space-y-8 glass-card p-6 sm:p-12 rounded-[2rem] sm:rounded-[3rem] animate-fade-in border-white/10">

        {/* ── Verifying ── */}
        {status === 'verifying' && (
          <>
            <div className="bg-brand-gold/10 p-4 rounded-full border border-brand-gold/20 shadow-2xl shadow-brand-gold/5 w-fit mx-auto">
              <Loader className="h-16 w-16 text-brand-gold animate-spin" />
            </div>
            <div>
              <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tighter leading-tight">
                Verifying your <br /><span className="text-brand-gold">Email…</span>
              </h2>
              <p className="mt-6 text-sm text-slate-400 font-medium">
                Please wait while we confirm your email address.
              </p>
            </div>
          </>
        )}

        {/* ── Success ── */}
        {status === 'success' && (
          <>
            <div className="bg-emerald-500/10 p-4 rounded-full border border-emerald-500/20 shadow-2xl shadow-emerald-500/5 w-fit mx-auto">
              <CheckCircle className="h-16 w-16 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tighter leading-tight">
                Email <span className="text-emerald-400">Verified!</span>
              </h2>
              <p className="mt-6 text-sm text-slate-400 font-medium leading-relaxed">
                Your email address has been confirmed. You can now sign in to your account.
                Redirecting you to the login page…
              </p>
            </div>
            <Link
              to="/login"
              className="btn-accent inline-flex items-center gap-3 py-3 px-8 text-sm uppercase tracking-widest font-black"
            >
              Sign In Now
              <ArrowRight size={18} />
            </Link>
          </>
        )}

        {/* ── Error ── */}
        {status === 'error' && (
          <>
            <div className="bg-rose-500/10 p-4 rounded-full border border-rose-500/20 shadow-2xl shadow-rose-500/5 w-fit mx-auto">
              <XCircle className="h-16 w-16 text-rose-400" />
            </div>
            <div>
              <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tighter leading-tight">
                Link <span className="text-rose-400">Expired</span>
              </h2>
              <p className="mt-6 text-sm text-slate-400 font-medium leading-relaxed">
                {errorMsg}
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={handleResend}
                disabled={resending}
                className="inline-flex items-center justify-center gap-2 py-3 px-6 bg-brand-gold text-brand-blue-dark font-black text-sm uppercase tracking-widest rounded-2xl hover:bg-brand-gold/90 transition-colors disabled:opacity-60"
              >
                {resending ? <Loader size={16} className="animate-spin" /> : <RefreshCw size={16} />}
                {resending ? 'Sending…' : 'Resend Email'}
              </button>
              <Link
                to="/login"
                className="inline-flex items-center justify-center gap-2 py-3 px-6 bg-white/5 text-white font-black text-sm uppercase tracking-widest rounded-2xl hover:bg-white/10 transition-colors border border-white/10"
              >
                Back to Login
              </Link>
            </div>
          </>
        )}

        {/* ── Waiting — user was redirected here by Firebase after it verified their email ── */}
        {status === 'waiting' && (
          <>
            <div className="bg-emerald-500/10 p-4 rounded-full border border-emerald-500/20 shadow-2xl shadow-emerald-500/5 w-fit mx-auto">
              <CheckCircle className="h-16 w-16 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tighter leading-tight">
                Email <span className="text-emerald-400">Verified!</span>
              </h2>
              <p className="mt-6 text-sm text-slate-400 font-medium leading-relaxed">
                Your email address has been confirmed. You can now sign in to your account.
              </p>
            </div>
            <Link
              to="/login"
              className="btn-accent inline-flex items-center gap-3 py-3 px-8 text-sm uppercase tracking-widest font-black"
            >
              Sign In Now
              <ArrowRight size={18} />
            </Link>
          </>
        )}

        <div className="pt-4 border-t border-white/5">
          <div className="flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
            <ShieldCheck size={14} />
            Secured by Firebase Authentication
          </div>
        </div>
      </div>
    </div>
  );
}
