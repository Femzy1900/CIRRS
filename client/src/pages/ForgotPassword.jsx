import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft, CheckCircle2, Send } from 'lucide-react';
import useAuthStore from '../store/useAuthStore';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
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

  if (isSubmitted) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-brand-blue/20 rounded-full blur-[120px] -z-10"></div>

        <div className="max-w-md w-full text-center space-y-8 glass-card p-6 sm:p-12 rounded-[2rem] sm:rounded-[3rem] animate-fade-in border-white/10">
          <div className="flex justify-center">
            <div className="bg-brand-gold/10 p-4 rounded-full border border-brand-gold/20 shadow-2xl shadow-brand-gold/5">
              <CheckCircle2 className="h-12 w-12 text-brand-gold" />
            </div>
          </div>
          <div>
            <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tighter leading-tight">
              Check your <br /><span className="text-brand-gold">Inbox</span>
            </h2>
            <p className="mt-6 text-sm text-slate-400 font-medium leading-relaxed">
              A password reset link has been sent to <br />
              <span className="text-white font-bold">{email}</span>.
              <br /><br />
              Click the link in the email, set a new password, then come back to sign in.
            </p>
          </div>
          <div className="pt-2">
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
