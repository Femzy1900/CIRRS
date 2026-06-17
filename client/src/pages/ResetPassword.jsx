import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ShieldCheck } from 'lucide-react';

// Password reset is now handled entirely by Firebase.
// The user clicks a link in their email which takes them to Firebase's
// secure reset page. After resetting, they're redirected back to /login.
// This page is kept for any legacy links that may still exist.
const ResetPassword = () => {
  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-brand-blue/20 rounded-full blur-[120px] -z-10"></div>

      <div className="max-w-md w-full text-center space-y-8 glass-card p-6 sm:p-12 rounded-[2rem] sm:rounded-[3rem] animate-fade-in border-white/10">
        <div className="bg-brand-gold/10 p-4 rounded-full border border-brand-gold/20 shadow-2xl shadow-brand-gold/5 w-fit mx-auto">
          <ShieldCheck className="h-16 w-16 text-brand-gold" />
        </div>

        <div>
          <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tighter leading-tight">
            Password Reset
          </h2>
          <p className="mt-6 text-sm text-slate-400 font-medium leading-relaxed">
            Password resets are now handled securely by Firebase.
            If you requested a reset, check your email for the link.
            After resetting, return here to sign in.
          </p>
        </div>

        <div className="flex flex-col gap-4 pt-2">
          <Link
            to="/login"
            className="btn-accent inline-flex items-center justify-center gap-3 py-3 px-8 text-sm uppercase tracking-widest font-black"
          >
            Go to Login
          </Link>
          <Link
            to="/forgot-password"
            className="inline-flex items-center justify-center gap-2 text-xs font-black uppercase tracking-[0.2em] text-slate-400 hover:text-brand-gold transition-all group"
          >
            <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
            Request a new reset link
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
