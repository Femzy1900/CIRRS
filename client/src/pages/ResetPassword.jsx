import React, { useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { confirmPasswordReset, verifyPasswordResetCode } from 'firebase/auth';
import { auth } from '../config/firebase';
import {
  ArrowLeft, ShieldCheck, Eye, EyeOff, Loader,
  CheckCircle, XCircle, KeyRound, Lock
} from 'lucide-react';
import { toast } from 'sonner';

const ResetPassword = () => {
  const [searchParams]  = useSearchParams();
  const navigate        = useNavigate();

  const mode    = searchParams.get('mode');
  const oobCode = searchParams.get('oobCode');

  // UI state
  const [step, setStep]           = useState('loading'); // loading | form | success | invalid
  const [email, setEmail]         = useState('');
  const [password, setPassword]   = useState('');
  const [confirm, setConfirm]     = useState('');
  const [showPass, setShowPass]   = useState(false);
  const [showConf, setShowConf]   = useState(false);
  const [loading, setLoading]     = useState(false);
  const [errorMsg, setErrorMsg]   = useState('');

  // Verify the oobCode on mount — confirms link is valid & not expired
  useEffect(() => {
    if (mode !== 'resetPassword' || !oobCode) {
      // No code in URL — user navigated here directly (not from email)
      setStep('no-code');
      return;
    }

    verifyPasswordResetCode(auth, oobCode)
      .then((userEmail) => {
        setEmail(userEmail);
        setStep('form');
      })
      .catch((err) => {
        console.error('[ResetPassword] verifyPasswordResetCode:', err.code);
        setStep('invalid');
        if (err.code === 'auth/expired-action-code') {
          setErrorMsg('This reset link has expired. Please request a new one.');
        } else if (err.code === 'auth/invalid-action-code') {
          setErrorMsg('This reset link is invalid or has already been used.');
        } else {
          setErrorMsg('Something went wrong. Please try requesting a new reset link.');
        }
      });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password.length < 6) {
      setErrorMsg('Password must be at least 6 characters.');
      return;
    }
    if (password !== confirm) {
      setErrorMsg('Passwords do not match.');
      return;
    }
    setErrorMsg('');
    setLoading(true);

    try {
      await confirmPasswordReset(auth, oobCode, password);
      setStep('success');
      toast.success('Password reset! You can now sign in.');
      setTimeout(() => navigate('/login'), 3000);
    } catch (err) {
      console.error('[ResetPassword] confirmPasswordReset:', err.code);
      if (err.code === 'auth/expired-action-code') {
        setErrorMsg('This link has expired. Please request a new reset email.');
      } else if (err.code === 'auth/weak-password') {
        setErrorMsg('Password is too weak. Use at least 6 characters.');
      } else {
        setErrorMsg(err.message || 'Failed to reset password. Try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  // ── Loading / verifying oobCode ──────────────────────────────────────────────
  if (step === 'loading') {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader className="w-12 h-12 text-brand-gold animate-spin mx-auto" />
          <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Verifying link…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-brand-blue/20 rounded-full blur-[120px] -z-10" />

      <div className="max-w-md w-full space-y-8 glass-card p-6 sm:p-12 rounded-[2rem] sm:rounded-[3rem] animate-fade-in border-white/10">

        {/* ── ✅ Success ── */}
        {step === 'success' && (
          <div className="text-center space-y-8">
            <div className="bg-emerald-500/10 p-4 rounded-full border border-emerald-500/20 shadow-2xl w-fit mx-auto">
              <CheckCircle className="h-16 w-16 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tighter leading-tight">
                Password <span className="text-emerald-400">Updated!</span>
              </h2>
              <p className="mt-6 text-sm text-slate-400 font-medium leading-relaxed">
                Your password has been reset successfully.<br />
                Redirecting you to login…
              </p>
            </div>
            <Link
              to="/login"
              className="btn-accent inline-flex items-center justify-center gap-3 py-3 px-8 text-sm uppercase tracking-widest font-black"
            >
              Sign In Now
            </Link>
          </div>
        )}

        {/* ── ❌ Invalid / expired link ── */}
        {step === 'invalid' && (
          <div className="text-center space-y-8">
            <div className="bg-rose-500/10 p-4 rounded-full border border-rose-500/20 shadow-2xl w-fit mx-auto">
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
            <div className="flex flex-col gap-3">
              <Link
                to="/forgot-password"
                className="btn-accent inline-flex items-center justify-center gap-3 py-3 px-8 text-sm uppercase tracking-widest font-black"
              >
                Request New Link
              </Link>
              <Link
                to="/login"
                className="inline-flex items-center justify-center gap-2 text-xs font-black uppercase tracking-[0.2em] text-slate-400 hover:text-brand-gold transition-all group"
              >
                <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
                Back to Login
              </Link>
            </div>
          </div>
        )}

        {/* ── No code — user navigated here directly ── */}
        {step === 'no-code' && (
          <div className="text-center space-y-8">
            <div className="bg-brand-gold/10 p-4 rounded-full border border-brand-gold/20 shadow-2xl w-fit mx-auto">
              <ShieldCheck className="h-16 w-16 text-brand-gold" />
            </div>
            <div>
              <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tighter leading-tight">
                Reset <span className="text-brand-gold">Password</span>
              </h2>
              <p className="mt-6 text-sm text-slate-400 font-medium leading-relaxed">
                To reset your password, use the link sent to your email address.
                If you haven't requested one yet, click below.
              </p>
            </div>
            <div className="flex flex-col gap-3">
              <Link
                to="/forgot-password"
                className="btn-accent inline-flex items-center justify-center gap-3 py-3 px-8 text-sm uppercase tracking-widest font-black"
              >
                Send Reset Email
              </Link>
              <Link
                to="/login"
                className="inline-flex items-center justify-center gap-2 text-xs font-black uppercase tracking-[0.2em] text-slate-400 hover:text-brand-gold transition-all group"
              >
                <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
                Back to Login
              </Link>
            </div>
          </div>
        )}

        {/* ── 📝 Reset form ── */}
        {step === 'form' && (
          <>
            <div>
              <Link
                to="/login"
                className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] text-slate-500 hover:text-brand-gold mb-8 transition-all group"
              >
                <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
                Back to Login
              </Link>
              <div className="flex items-center gap-4 mb-6">
                <div className="bg-brand-gold/10 p-3 rounded-2xl border border-brand-gold/20">
                  <KeyRound className="h-8 w-8 text-brand-gold" />
                </div>
                <div>
                  <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tighter leading-tight">
                    Set New Password
                  </h2>
                  <p className="text-xs text-slate-500 font-bold mt-0.5 truncate max-w-[220px]">{email}</p>
                </div>
              </div>
            </div>

            {errorMsg && (
              <div className="bg-rose-500/10 border border-rose-500/20 p-4 rounded-2xl">
                <p className="text-[10px] text-rose-400 font-black uppercase tracking-wider text-center">{errorMsg}</p>
              </div>
            )}

            <form className="space-y-6" onSubmit={handleSubmit}>
              {/* New password */}
              <div className="space-y-2">
                <label className="block text-[10px] font-black text-brand-gold uppercase tracking-[0.2em] px-1">
                  New Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                  <input
                    type={showPass ? 'text' : 'password'}
                    required
                    minLength={6}
                    className="input-field pl-12 pr-12 w-full"
                    placeholder="At least 6 characters"
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); setErrorMsg(''); }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(v => !v)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-brand-gold transition-colors"
                  >
                    {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Confirm password */}
              <div className="space-y-2">
                <label className="block text-[10px] font-black text-brand-gold uppercase tracking-[0.2em] px-1">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                  <input
                    type={showConf ? 'text' : 'password'}
                    required
                    minLength={6}
                    className="input-field pl-12 pr-12 w-full"
                    placeholder="Repeat your new password"
                    value={confirm}
                    onChange={(e) => { setConfirm(e.target.value); setErrorMsg(''); }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConf(v => !v)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-brand-gold transition-colors"
                  >
                    {showConf ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {/* Live match indicator */}
                {confirm && (
                  <p className={`text-[10px] font-black uppercase tracking-wider px-1 ${password === confirm ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {password === confirm ? '✓ Passwords match' : '✗ Passwords do not match'}
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={loading || !password || !confirm}
                className="btn-accent w-full py-3 sm:py-5 flex items-center justify-center gap-3 text-sm uppercase tracking-[0.25em] font-black disabled:opacity-60 shadow-2xl shadow-brand-gold/10"
              >
                {loading ? (
                  <Loader className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <ShieldCheck size={18} />
                    Reset Password
                  </>
                )}
              </button>
            </form>
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
};

export default ResetPassword;
