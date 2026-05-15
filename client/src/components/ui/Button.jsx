import React from 'react';

const Button = ({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  className = '', 
  loading = false, 
  icon: Icon,
  ...props 
}) => {
  const variants = {
    primary: 'btn-primary',
    accent: 'btn-accent',
    secondary: 'btn-secondary',
    ghost: 'bg-transparent hover:bg-white/5 text-slate-400 hover:text-white border border-transparent hover:border-white/10',
    danger: 'bg-rose-500/10 text-rose-500 border border-rose-500/20 hover:bg-rose-500 hover:text-white transition-all'
  };

  const sizes = {
    sm: 'px-4 py-2 text-[10px]',
    md: 'px-6 py-3 text-xs',
    lg: 'px-8 py-4 text-sm',
    xl: 'px-10 py-5 text-base'
  };

  return (
    <button
      className={`flex items-center justify-center gap-2 font-black uppercase tracking-widest rounded-2xl transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={loading || props.disabled}
      {...props}
    >
      {loading ? (
        <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
      ) : (
        <>
          {children}
          {Icon && <Icon size={size === 'sm' ? 14 : size === 'xl' ? 24 : 20} />}
        </>
      )}
    </button>
  );
};

export default Button;
