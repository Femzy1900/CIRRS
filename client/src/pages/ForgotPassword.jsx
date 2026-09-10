import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft, CheckCircle2, Send, AlertTriangle, RefreshCw } from 'lucide-react';
import useAuthStore from '../store/useAuthStore';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const { forgotPassword, loading, error, setError } = useAuthStore();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) return;
    try {
      await forgotPassword(email);
      setIsSubmitted(true);
    } catch (err) {
      // Error handled by store
    }
  };

  const handleResend = async () => {
    if (!email || resending) return;
    try {
      setResending(true);
      setResendSuccess(false);
      await forgotPassword(email);
      setResendSuccess(true);
    } catch (err) {
      // Error handled by store
    } finally {
      setResending(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-brand-blue/20 rounded-full blur-[120px] -z-10"></div>

        <div className="max-w-md w-full text-center space-y-6 glass-card p-6 sm:p-10 rounded-[2rem] sm:rounded-[3rem] animate-fade-in border-white/10">
          <div className="flex justify-center">
            <div className="bg-brand-gold/10 p-4 rounded-full border border-brand-gold/20 shadow-2xl shadow-brand-gold/5">
              <CheckCircle2 className="h-12 w-12 text-brand-gold" />
            </div>
          </div>
          <div>
            <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tighter leading-tight">
              Check your <br /><span className="text-brand-gold">Inbox</span>
            </h2>
            <p className="mt-4 text-sm text-slate-300 font-medium leading-relaxed">
              A password reset link has been sent to <br />
              <span className="text-white font-bold">{email}</span>.
              <br /><br />
              Click the link in the email, set a new password, then return to sign in.
            </p>
          </div>

          {/* Spam / Junk Notice */}
          <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-2xl text-left space-y-1.5">
            <div className="flex items-center gap-2 text-amber-400 font-bold text-xs uppercase tracking-wider">
              <AlertTriangle size={15} />
              <span>Check your Spam / Junk Folder</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              If the email doesn't arrive in your primary inbox within 1–2 minutes, please be sure to check your <strong className="text-white">Spam</strong> or <strong className="text-white">Junk</strong> folder.
            </p>
          </div>

          {resendSuccess && (
            <div className="bg-emerald-500/10 border border-emerald-500/20 p-3 rounded-xl">
              <p className="text-xs text-emerald-400 font-bold">✓ A new reset link has been sent to your email!</p>
            </div>
          )}

          {/* Retry / Resend Actions */}
          <div className="space-y-3 pt-2">
            <button
              onClick={handleResend}
              disabled={resending}
              className="w-full py-3 px-4 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <RefreshCw size={14} className={resending ? "animate-spin" : ""} />
              {resending ? 'Sending new link...' : "Didn't get the email? Resend link"}
            </button>

            <div>
              <button
                onClick={() => { setIsSubmitted(false); setResendSuccess(false); }}
                className="text-xs text-slate-400 hover:text-white transition-colors underline underline-offset-4"
              >
                Wrong email address? Try again
              </button>
            </div>
          </div>

          <div className="pt-4 border-t border-white/5">
            <Link
              to="/login"
              className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] text-brand-gold hover:text-amber-300 transition-all group"
            >
              <ArrowLeft className="group-hover:-translate-x-1 transition-transform" size={14} />
              Back to Login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-brand-blue/20 rounded-full blur-[120px] -z-10"></div>

      <div className="max-w-md w-full space-y-8 glass-card p-6 sm:p-12 rounded-[2rem] sm:rounded-[3rem] animate-fade-in border-white/10">
        <div>
          <Link to="/login" className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] text-slate-500 hover:text-brand-gold mb-10 transition-all group">
            <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
            Back to Login
          </Link>
          <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tighter leading-tight">
            Reset <br /><span className="text-brand-gold">Password</span>
          </h2>
          <p className="mt-4 text-sm text-slate-400 font-medium">
            Enter your email and Firebase will send a secure reset link directly to your inbox.
          </p>
        </div>

        {error && (
          <div className="bg-rose-500/10 border border-rose-500/20 p-4 rounded-2xl">
            <p className="text-[10px] text-rose-400 font-black uppercase tracking-wider text-center">{error}</p>
          </div>
        )}

        <form className="mt-6 sm:mt-10 space-y-6 sm:space-y-8" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="email" className="block text-[10px] font-black text-brand-gold uppercase tracking-[0.2em] mb-3 px-1">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => { setEmail(e.target.value); if (error) setError(null); }}
                className="input-field pl-12"
                placeholder="student@university.edu"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-accent w-full py-3 sm:py-5 flex items-center justify-center gap-3 text-sm uppercase tracking-[0.25em] font-black disabled:opacity-70 shadow-2xl shadow-brand-gold/10"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-brand-blue/30 border-t-brand-blue rounded-full animate-spin"></div>
            ) : (
              <>
                <span>Send Reset Link</span>
                <Send size={18} />
              </>
            )}
          </button>
        </form>

        <p className="text-center text-xs text-slate-500 font-bold uppercase tracking-widest pt-4">
          Remember your password?{' '}
          <Link to="/login" className="text-brand-gold hover:text-amber-300 transition-colors border-b-2 border-brand-gold/20 pb-0.5 ml-1">
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
};

export default ForgotPassword;
