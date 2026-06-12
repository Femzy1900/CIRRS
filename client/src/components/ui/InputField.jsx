import React, { forwardRef } from 'react';

const InputField = forwardRef(({ label, icon: Icon, error, className = '', ...props }, ref) => {
  return (
    <div className={`space-y-3 ${className}`}>
      {label && (
        <label className="block text-[10px] font-black text-brand-gold uppercase tracking-[0.2em] px-1">
          {label}
        </label>
      )}
      <div className="relative group">
        {Icon && (
          <Icon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-brand-gold transition-colors" size={18} />
        )}
        <input
          ref={ref}
          className={`input-field ${Icon ? 'pl-12' : 'px-6'} ${error ? 'border-rose-500 focus:ring-rose-500/10' : ''}`}
          {...props}
        />
      </div>
      {error && (
        <p className="text-[10px] text-rose-500 font-black uppercase tracking-widest px-1">
          {error}
        </p>
      )}
    </div>
  );
});

InputField.displayName = 'InputField';

export default InputField;
