import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Mail, Lock, LogIn, ArrowLeft, RefreshCw, Loader, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import useAuthStore from '../store/useAuthStore';

const schema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

// Google icon SVG
const GoogleIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
);

export default function Login() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const justVerified = searchParams.get('verified') === 'true';
  const { login, loginWithGoogle, resendVerificationEmail, loading, error, setError } = useAuthStore();
  const [showResend, setShowResend]   = useState(false);
  const [resending, setResending]     = useState(false);
  const [lastEmail, setLastEmail]     = useState('');
  const [lastPassword, setLastPassword] = useState('');

  const { register, handleSubmit, getValues, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data) => {
    setShowResend(false);
    try {
      await login(data);
      navigate('/dashboard');
    } catch (err) {
      // Show resend button if the error is about email verification
      if (err.message?.includes('verify')) {
        setLastEmail(data.email);
        setLastPassword(data.password);
        setShowResend(true);
      }
    }
  };

  const handleResend = async () => {
    setResending(true);
    try {
      const result = await resendVerificationEmail(lastEmail, lastPassword);
      if (result?.alreadyVerified) {
        toast.info('Your email is already verified! Try logging in again.');
        setShowResend(false);
      } else {
        toast.success('Verification email sent! Check your inbox.');
        setShowResend(false);
      }
    } catch (err) {
      // error shown by store
    } finally {
      setResending(false);
    }
  };

  const handleGoogle = async () => {
    try {
      const result = await loginWithGoogle();
      // Only navigate if we got a result (popup success); redirect flow handles itself
      if (result) navigate('/dashboard');
    } catch (err) {
      // Error shown by store
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-brand-blue/20 rounded-full blur-[120px] -z-10"></div>

      <div className="max-w-md w-full space-y-8 glass-card p-6 sm:p-12 rounded-[2rem] sm:rounded-[3rem] animate-fade-in border-white/10">
        <div>
          <Link to="/" className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] text-slate-500 hover:text-brand-gold mb-10 transition-all group">
            <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
            Back to Portal
          </Link>
          <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tighter leading-tight">
            Welcome Back, <br /><span className="text-brand-gold">Student!</span>
          </h2>
          <p className="mt-4 text-sm text-slate-400 font-medium">
            Securely sign in to manage your lost and found reports.
          </p>
        </div>

        {justVerified && (
          <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-2xl flex items-center gap-3">
            <CheckCircle size={16} className="text-emerald-400 shrink-0" />
            <p className="text-xs text-emerald-400 font-black uppercase tracking-wider">
              Email verified! You can now sign in.
            </p>
          </div>
        )}

        {error && (
          <div className="bg-rose-500/10 border border-rose-500/20 p-4 rounded-2xl space-y-3">
            <p className="text-[10px] text-rose-400 font-black uppercase tracking-wider text-center">{error}</p>
            {showResend && (
              <button
                type="button"
                onClick={handleResend}
                disabled={resending}
                className="w-full flex items-center justify-center gap-2 py-2 px-4 bg-brand-gold/10 hover:bg-brand-gold/20 border border-brand-gold/30 rounded-xl text-xs font-black text-brand-gold uppercase tracking-widest transition-colors disabled:opacity-60"
              >
                {resending ? <Loader size={13} className="animate-spin" /> : <RefreshCw size={13} />}
                {resending ? 'Sending…' : 'Resend Verification Email'}
              </button>
            )}
          </div>
        )}

        {/* Google Sign-In */}
        <button
          type="button"
          onClick={handleGoogle}
          disabled={loading}
          className="w-full flex items-center justify-center gap-3 py-3 px-4 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-2xl transition-all text-sm font-bold text-white disabled:opacity-60"
        >
          <GoogleIcon />
          Continue with Google
        </button>

        <div className="flex items-center gap-4">
          <div className="flex-1 h-px bg-white/10"></div>
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">or</span>
          <div className="flex-1 h-px bg-white/10"></div>
        </div>

        <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-6">
            <div>
              <label className="block text-[10px] font-black text-brand-gold uppercase tracking-[0.2em] mb-3 px-1">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                <input
                  {...register('email')}
                  type="email"
                  onChange={() => { if (error) setError(null); }}
                  className="input-field pl-12"
                  placeholder="student@university.edu"
                />
              </div>
              {errors.email && <p className="mt-2 text-[10px] text-rose-400 px-1 font-black uppercase tracking-wider">{errors.email.message}</p>}
            </div>

            <div>
              <label className="block text-[10px] font-black text-brand-gold uppercase tracking-[0.2em] mb-3 px-1">Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                <input
                  {...register('password')}
                  type="password"
                  onChange={() => { if (error) setError(null); }}
                  className="input-field pl-12"
                  placeholder="••••••••"
                />
              </div>
              {errors.password && <p className="mt-2 text-[10px] text-rose-400 px-1 font-black uppercase tracking-wider">{errors.password.message}</p>}
            </div>
          </div>

          <div className="flex items-center justify-end px-1">
            <Link to="/forgot-password" className="text-xs font-black uppercase tracking-widest text-brand-gold hover:text-amber-300 transition-colors">
              Forgot password?
            </Link>
          </div>

          <button
            disabled={loading}
            type="submit"
            className="btn-accent w-full py-3 sm:py-5 flex items-center justify-center gap-3 text-sm uppercase tracking-[0.25em] font-black disabled:opacity-70 shadow-2xl shadow-brand-gold/10"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-brand-blue/30 border-t-brand-blue rounded-full animate-spin"></div>
            ) : (
              <>
                <span>Sign In</span>
                <LogIn size={20} />
              </>
            )}
          </button>
        </form>

        <p className="text-center text-xs text-slate-500 font-bold uppercase tracking-widest pt-4">
          New to CIRS?{' '}
          <Link to="/register" className="text-brand-gold hover:text-amber-300 transition-colors border-b-2 border-brand-gold/20 pb-0.5 ml-1">
            Create account
          </Link>
        </p>
      </div>
    </div>
  );
}
