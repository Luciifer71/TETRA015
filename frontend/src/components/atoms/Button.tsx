import React from 'react';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline' | 'success';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  className = '',
  disabled,
  ...props
}) => {
  const baseStyles = 'inline-flex items-center justify-center font-bold rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed select-none active:scale-[0.98]';

  const variantStyles = {
    primary: 'bg-gradient-to-r from-amber-400 via-gold-500 to-amber-500 hover:from-amber-300 hover:to-gold-400 text-matte-950 shadow-gold-md focus:ring-gold-400 border border-gold-300/40',
    secondary: 'bg-slate-100 dark:bg-matte-900 hover:bg-slate-200 dark:hover:bg-matte-800 text-slate-900 dark:text-zinc-100 border border-slate-300 dark:border-matte-700/60 focus:ring-zinc-500',
    success: 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/20 focus:ring-emerald-500',
    danger: 'bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-600/20 focus:ring-rose-500',
    outline: 'border border-slate-300 dark:border-matte-700 hover:border-gold-500 text-slate-900 dark:text-zinc-200 hover:bg-slate-100 dark:hover:bg-matte-800/50 focus:ring-zinc-500',
    ghost: 'hover:bg-slate-100 dark:hover:bg-matte-800/60 text-slate-800 dark:text-zinc-300 hover:text-slate-950 dark:hover:text-white focus:ring-zinc-500',
  };

  const sizeStyles = {
    sm: 'px-3.5 py-1.5 text-xs gap-1.5',
    md: 'px-4.5 py-2.5 text-sm gap-2',
    lg: 'px-6 py-3 text-base gap-2.5 rounded-2xl',
  };

  return (
    <button
      className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? <Loader2 className="w-4 h-4 animate-spin shrink-0" /> : leftIcon}
      <span>{children}</span>
      {!isLoading && rightIcon}
    </button>
  );
};
