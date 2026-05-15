import React, { useEffect, useState, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { CheckCircle2, XCircle, Loader2, ArrowRight, ShieldCheck } from 'lucide-react';
import useAuthStore from '../store/useAuthStore';

const VerifyEmail = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const { verifyEmail, loading, error } = useAuthStore();
  const [isSuccess, setIsSuccess] = useState(false);
  const verifyAttempted = useRef(false);

  useEffect(() => {
    const attemptVerification = async () => {
      if (token && !verifyAttempted.current) {
        verifyAttempted.current = true;
        try {
          await verifyEmail(token);
          setIsSuccess(true);
        } catch (err) {
          setIsSuccess(false);
        }
      }
    };

    attemptVerification();
  }, [token, verifyEmail]);

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-brand-blue/20 rounded-full blur-[120px] -z-10"></div>
      
      <div className="max-w-md w-full text-center space-y-8 glass-card p-12 rounded-[3rem] animate-fade-in border-white/10">
        {loading ? (
          <div className="py-12">
            <Loader2 className="h-16 w-16 text-brand-gold animate-spin mx-auto mb-6" />
            <h2 className="text-2xl font-black text-white uppercase tracking-widest">Verifying Email...</h2>
            <p className="mt-4 text-slate-400 font-medium">Please wait while we secure your account.</p>
          </div>
        ) : isSuccess ? (
          <div className="py-8">
            <div className="bg-brand-gold/10 p-4 rounded-full border border-brand-gold/20 shadow-2xl shadow-brand-gold/5 w-fit mx-auto mb-8">
              <CheckCircle2 className="h-16 w-16 text-brand-gold" />
            </div>
            <h2 className="text-4xl font-black text-white tracking-tighter leading-tight">Email <br /><span className="text-brand-gold">Verified!</span></h2>
            <p className="mt-6 text-sm text-slate-400 font-medium leading-relaxed">
              Your account has been successfully verified. <br />
              You can now access all CIRS features.
            </p>
            <div className="mt-10">
              <Link
                to="/login"
                className="btn-accent inline-flex items-center gap-3 py-4 px-10 text-sm uppercase tracking-widest font-black"
              >
                Go to Login
                <ArrowRight size={18} />
              </Link>
            </div>
          </div>
        ) : (
          <div className="py-8">
            <div className="bg-rose-500/10 p-4 rounded-full border border-rose-500/20 shadow-2xl shadow-rose-500/5 w-fit mx-auto mb-8">
              <XCircle className="h-16 w-16 text-rose-500" />
            </div>
            <h2 className="text-4xl font-black text-white tracking-tighter leading-tight">Verification <br /><span className="text-rose-500">Failed</span></h2>
            <p className="mt-6 text-sm text-slate-400 font-medium leading-relaxed">
              {error || "The verification link is invalid or has expired."}
            </p>
            <div className="mt-10">
              <Link
                to="/register"
                className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] text-brand-gold hover:text-amber-300 transition-all group"
              >
                Try Registering Again
                <ArrowRight className="group-hover:translate-x-1 transition-transform" size={14} />
              </Link>
            </div>
          </div>
        )}

        <div className="pt-6 border-t border-white/5">
           <div className="flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
             <ShieldCheck size={14} />
             Secure Verification System
           </div>
        </div>
      </div>
    </div>
  );
};

export default VerifyEmail;
