import React from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  leftIcon,
  rightIcon,
  className = '',
  id,
  ...props
}) => {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className="flex flex-col gap-1.5 w-full">
      {label && (
        <label htmlFor={inputId} className="text-xs font-black text-slate-950 dark:text-[#DFE0E2] uppercase tracking-wider">
          {label}
        </label>
      )}
      <div className="relative flex items-center w-full">
        {leftIcon && (
          <div className="absolute left-3.5 text-slate-500 dark:text-[#AAABB0] pointer-events-none flex items-center justify-center">
            {leftIcon}
          </div>
        )}
        <input
          id={inputId}
          className={`w-full bg-slate-50 dark:bg-[#263C49] border ${
            error
              ? 'border-rose-500 focus:ring-rose-500'
              : 'border-slate-300 dark:border-[#344e5f] focus:border-amber-500 dark:focus:border-amber-400 focus:ring-amber-500/20'
          } text-slate-950 dark:text-[#DFE0E2] font-semibold placeholder-slate-500 dark:placeholder-[#AAABB0] text-sm rounded-xl px-4 py-2.5 transition-all duration-200 focus:outline-none focus:ring-2 focus:bg-white dark:focus:bg-[#263C49] ${
            leftIcon ? 'pl-10' : ''
          } ${rightIcon ? 'pr-10' : ''} ${className}`}
          {...props}
        />
        {rightIcon && (
          <div className="absolute right-3.5 text-slate-500 dark:text-[#AAABB0] flex items-center justify-center">
            {rightIcon}
          </div>
        )}
      </div>
      {error && <span className="text-xs font-bold text-rose-600 dark:text-rose-400">{error}</span>}
    </div>
  );
};
