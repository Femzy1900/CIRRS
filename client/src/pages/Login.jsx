import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, LogIn, ArrowLeft } from 'lucide-react';
import useAuthStore from '../store/useAuthStore';

const schema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export default function Login() {
  const navigate = useNavigate();
  const { setAuth, setLoading, loading } = useAuthStore();
  
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
  });

  const onSubmit = (data) => {
    setLoading(true);
    // Simulate login
    setTimeout(() => {
      setAuth({ name: 'Demo User', email: data.email }, 'dummy-jwt-token');
      setLoading(false);
      navigate('/dashboard');
    }, 1500);
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-brand-blue/20 rounded-full blur-[120px] -z-10"></div>
      
      <div className="max-w-md w-full space-y-8 glass-card p-12 rounded-[3rem] animate-fade-in border-white/10">
        <div>
          <Link to="/" className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] text-slate-500 hover:text-brand-gold mb-10 transition-all group">
            <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
            Back to Portal
          </Link>
          <h2 className="text-4xl font-black text-white tracking-tighter leading-tight">Welcome Back, <br /><span className="text-brand-gold">Student!</span></h2>
          <p className="mt-4 text-sm text-slate-400 font-medium">
            Securely sign in to manage your lost and found reports.
          </p>
        </div>
        
        <form className="mt-10 space-y-8" onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-6">
            <div>
              <label className="block text-[10px] font-black text-brand-gold uppercase tracking-[0.2em] mb-3 px-1">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                <input
                  {...register('email')}
                  type="email"
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
                  className="input-field pl-12"
                  placeholder="••••••••"
                />
              </div>
              {errors.password && <p className="mt-2 text-[10px] text-rose-400 px-1 font-black uppercase tracking-wider">{errors.password.message}</p>}
            </div>
          </div>

          <div className="flex items-center justify-between px-1">
            <div className="flex items-center">
              <input type="checkbox" className="h-4 w-4 bg-white/5 border-white/10 rounded-md cursor-pointer checked:bg-brand-gold transition-all" />
              <label className="ml-3 block text-xs text-slate-400 font-bold cursor-pointer">Remember me</label>
            </div>
            <Link className="text-xs font-black uppercase tracking-widest text-brand-gold hover:text-amber-300 transition-colors">
              Forgot password?
            </Link>
          </div>

          <div>
            <button
              disabled={loading}
              type="submit"
              className="btn-accent w-full py-5 flex items-center justify-center gap-3 text-sm uppercase tracking-[0.25em] font-black disabled:opacity-70 shadow-2xl shadow-brand-gold/10"
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
          </div>
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
