import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Lock, CheckCircle2, ArrowLeft, ShieldCheck } from 'lucide-react';
import useAuthStore from '../store/useAuthStore';

const ResetPassword = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passError, setPassError] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const { resetPassword, loading, error, setError } = useAuthStore();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setPassError('');

    if (password.length < 6) {
      setPassError('Password must be at least 6 characters long');
      return;
    }

    if (password !== confirmPassword) {
      setPassError('Passwords do not match');
      return;
    }

    try {
      await resetPassword(token, password);
      setIsSuccess(true);
      setTimeout(() => {
        navigate('/login');
      }, 4000);
    } catch (err) {
      // Error is handled by store
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-brand-blue/20 rounded-full blur-[120px] -z-10"></div>
        
        <div className="max-w-md w-full text-center space-y-8 glass-card p-12 rounded-[3rem] animate-fade-in border-white/10">
          <div className="flex justify-center">
            <div className="bg-brand-gold/10 p-4 rounded-full border border-brand-gold/20 shadow-2xl shadow-brand-gold/5">
              <CheckCircle2 className="h-12 w-12 text-brand-gold" />
            </div>
          </div>
          <div>
            <h2 className="text-4xl font-black text-white tracking-tighter leading-tight">Password <br /><span className="text-brand-gold">Updated!</span></h2>
            <p className="mt-6 text-sm text-slate-400 font-medium leading-relaxed">
              Your password has been successfully reset. <br />
              Redirecting you to login in a few seconds...
            </p>
          </div>
          <div className="pt-6">
            <Link
              to="/login"
              className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] text-brand-gold hover:text-amber-300 transition-all group"
            >
              <ArrowLeft className="group-hover:-translate-x-1 transition-transform" size={14} />
              Go to Login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-brand-blue/20 rounded-full blur-[120px] -z-10"></div>
      
      <div className="max-w-md w-full space-y-8 glass-card p-12 rounded-[3rem] animate-fade-in border-white/10">
        <div>
          <div className="flex justify-between items-start mb-10">
            <Link to="/login" className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] text-slate-500 hover:text-brand-gold transition-all group">
              <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
              Cancel
            </Link>
            <div className="p-3 bg-brand-blue/40 rounded-2xl border border-white/5 backdrop-blur-md">
              <ShieldCheck size={24} className="text-brand-gold" />
            </div>
          </div>
          <h2 className="text-4xl font-black text-white tracking-tighter leading-tight">Create New <br /><span className="text-brand-gold">Password</span></h2>
          <p className="mt-4 text-sm text-slate-400 font-medium">
            Choose a strong password to secure your account.
          </p>
        </div>

        {(error || passError) && (
          <div className="bg-rose-500/10 border border-rose-500/20 p-4 rounded-2xl">
            <p className="text-[10px] text-rose-400 font-black uppercase tracking-wider text-center">{error || passError}</p>
          </div>
        )}

        <form className="mt-10 space-y-8" onSubmit={handleSubmit}>
          <div className="space-y-6">
            <div>
              <label className="block text-[10px] font-black text-brand-gold uppercase tracking-[0.2em] mb-3 px-1">New Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (error) setError(null);
                    setPassError('');
                  }}
                  className="input-field pl-12"
                  placeholder="Minimum 6 characters"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-black text-brand-gold uppercase tracking-[0.2em] mb-3 px-1">Confirm New Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    setPassError('');
                  }}
                  className="input-field pl-12"
                  placeholder="Repeat new password"
                />
              </div>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="btn-accent w-full py-5 flex items-center justify-center gap-3 text-sm uppercase tracking-[0.25em] font-black disabled:opacity-70 shadow-2xl shadow-brand-gold/10"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-brand-blue/30 border-t-brand-blue rounded-full animate-spin"></div>
              ) : (
                <>
                  <span>Update Password</span>
                  <CheckCircle2 size={20} />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ResetPassword;
