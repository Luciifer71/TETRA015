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
    primary: 'bg-[#2E2E2D] hover:bg-[#4B4C51] text-white dark:bg-[#8D9797] dark:hover:bg-[#a1acac] dark:text-[#000000] border border-[#2E2E2D] dark:border-[#8D9797] shadow-sm focus:ring-[#8D9797]',
    secondary: 'bg-[#F3F3F3] dark:bg-[#121215] hover:bg-[#D0D0D2] dark:hover:bg-white/10 text-[#2E2E2D] dark:text-[#F3DDB6] border border-[#D0D0D2] dark:border-white/15 focus:ring-slate-400',
    success: 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-md focus:ring-emerald-500',
    danger: 'bg-rose-600 hover:bg-rose-500 text-white shadow-md focus:ring-rose-500',
    outline: 'border border-[#D0D0D2] dark:border-white/15 text-[#2E2E2D] dark:text-[#F3DDB6] hover:bg-[#F3F3F3] dark:hover:bg-white/5 focus:ring-slate-400',
    ghost: 'hover:bg-[#D0D0D2]/40 dark:hover:bg-white/5 text-[#2E2E2D] dark:text-[#F3DDB6] focus:ring-slate-400',
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
