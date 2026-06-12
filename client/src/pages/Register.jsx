import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, User, UserPlus, ArrowLeft, ShieldCheck } from 'lucide-react';
import useAuthStore from '../store/useAuthStore';

const schema = z.object({
  fullName: z.string()
    .min(2, 'Full name must be at least 2 characters')
    .refine(val => val.trim().split(/\s+/).length >= 2, {
      message: 'Please enter both your first and last name'
    }),
  username: z.string().min(2, 'Username must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string().min(6, 'Confirm password must be at least 6 characters'),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export default function Register() {
  const navigate = useNavigate();
  const { register: registerAction, loading, error, setError } = useAuthStore();
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data) => {
    try {
      setUserEmail(data.email);
      await registerAction(data);
      setIsSubmitted(true);
    } catch (err) {
      // Error is handled by store
    }
  };

  if (isSubmitted) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-brand-blue/20 rounded-full blur-[120px] -z-10"></div>
        
        <div className="max-w-md w-full text-center space-y-8 glass-card p-12 rounded-[3rem] animate-fade-in border-white/10">
          <div className="flex justify-center">
            <div className="bg-brand-gold/10 p-4 rounded-full border border-brand-gold/20 shadow-2xl shadow-brand-gold/5">
              <Mail className="h-12 w-12 text-brand-gold" />
            </div>
          </div>
          <div>
            <h2 className="text-4xl font-black text-white tracking-tighter leading-tight">Verify your <br /><span className="text-brand-gold">Email</span></h2>
            <p className="mt-6 text-sm text-slate-400 font-medium leading-relaxed">
              We've sent a verification link to <br />
              <span className="text-white font-bold">{userEmail}</span>. 
              Please verify your email to activate your account.
            </p>
          </div>
          <div className="pt-6">
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
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-brand-blue/20 rounded-full blur-[140px] -z-10"></div>
      
      <div className="max-w-2xl w-full space-y-8 glass-card p-12 rounded-[3.5rem] animate-fade-in border-white/10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-10">
          <div className="space-y-3">
            <Link to="/" className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 hover:text-brand-gold mb-6 transition-all group">
              <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
              Back to Portal
            </Link>
            <h2 className="text-4xl font-black text-white tracking-tighter leading-tight">Join our <br /><span className="text-brand-gold">Campus Community</span></h2>
            <p className="text-sm text-slate-400 font-medium">Create your secure CIRS account today.</p>
          </div>
          <div className="hidden md:flex flex-col items-center p-6 bg-brand-blue/40 rounded-[2.5rem] border border-white/5 backdrop-blur-md shadow-2xl">
             <ShieldCheck size={40} className="text-brand-gold mb-3" />
             <span className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-gold/80 text-center leading-relaxed">Secure <br/>Verification</span>
          </div>
        </div>
        
        {error && (
          <div className="bg-rose-500/10 border border-rose-500/20 p-4 rounded-2xl">
            <p className="text-[10px] text-rose-400 font-black uppercase tracking-wider text-center">{error}</p>
          </div>
        )}
        
        <form className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-8" onSubmit={handleSubmit(onSubmit)}>
          <div className="md:col-span-2">
            <label className="block text-[10px] font-black text-brand-gold uppercase tracking-[0.2em] mb-3 px-1">Full Name</label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
              <input
                {...register('fullName')}
                type="text"
                onChange={() => { if (error) setError(null); }}
                className="input-field pl-12"
                placeholder="e.g. John Doe"
              />
            </div>
            {errors.fullName && <p className="mt-2 text-[10px] text-rose-400 px-1 font-black uppercase tracking-wider">{errors.fullName.message}</p>}
          </div>

          <div className="md:col-span-2">
            <label className="block text-[10px] font-black text-brand-gold uppercase tracking-[0.2em] mb-3 px-1">Username</label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
              <input
                {...register('username')}
                type="text"
                onChange={() => { if (error) setError(null); }}
                className="input-field pl-12"
                placeholder="Unique username"
              />
            </div>
            {errors.username && <p className="mt-2 text-[10px] text-rose-400 px-1 font-black uppercase tracking-wider">{errors.username.message}</p>}
          </div>

          <div className="md:col-span-2">
            <label className="block text-[10px] font-black text-brand-gold uppercase tracking-[0.2em] mb-3 px-1">University Email</label>
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

          <div>
            <label className="block text-[10px] font-black text-brand-gold uppercase tracking-[0.2em] mb-3 px-1">Confirm Password</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
              <input
                {...register('confirmPassword')}
                type="password"
                className="input-field pl-12"
                placeholder="••••••••"
              />
            </div>
            {errors.confirmPassword && <p className="mt-2 text-[10px] text-rose-400 px-1 font-black uppercase tracking-wider">{errors.confirmPassword.message}</p>}
          </div>

          <div className="md:col-span-2 pt-6">
            <button
              disabled={loading}
              type="submit"
              className="btn-accent w-full py-5 flex items-center justify-center gap-3 text-sm uppercase tracking-[0.25em] font-black disabled:opacity-70 shadow-2xl shadow-brand-gold/10"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-brand-blue/30 border-t-brand-blue rounded-full animate-spin"></div>
              ) : (
                <>
                  <span>Create Account</span>
                  <UserPlus size={20} />
                </>
              )}
            </button>
          </div>
        </form>

        <p className="text-center text-xs text-slate-500 font-bold uppercase tracking-widest pt-4">
          Already have an account?{' '}
          <Link to="/login" className="text-brand-gold hover:text-amber-300 transition-colors border-b-2 border-brand-gold/20 pb-0.5 ml-1">
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}
