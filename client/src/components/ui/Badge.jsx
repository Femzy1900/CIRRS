import React from 'react';

const Badge = ({ children, variant = 'neutral', className = '' }) => {
  const variants = {
    neutral: 'bg-white/5 text-slate-400 border-white/5',
    success: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
    danger: 'bg-rose-500/10 text-rose-500 border-rose-500/20',
    warning: 'bg-brand-gold/10 text-brand-gold border-brand-gold/20',
    info: 'bg-sky-500/10 text-sky-500 border-sky-500/20',
  };

  return (
    <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-[0.15em] border backdrop-blur-md ${variants[variant]} ${className}`}>
      {children}
    </span>
  );
};

export default Badge;
