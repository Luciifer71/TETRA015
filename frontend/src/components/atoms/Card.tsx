import React from 'react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'glass' | 'outline';
  hoverEffect?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  variant = 'default',
  hoverEffect = false,
  className = '',
  ...props
}) => {
  const baseStyles = 'rounded-2xl p-6 transition-all duration-300';

  const variantStyles = {
    default: 'bg-white dark:bg-[#263C49] border border-slate-300 dark:border-[#344e5f] shadow-md dark:shadow-2xl',
    glass: 'bg-white/95 dark:bg-[#263C49]/90 backdrop-blur-xl border border-slate-300 dark:border-[#344e5f] shadow-lg dark:shadow-2xl',
    outline: 'bg-transparent border border-slate-300 dark:border-[#344e5f]',
  };

  const hoverStyles = hoverEffect
    ? 'hover:-translate-y-1 hover:shadow-xl dark:hover:shadow-2xl hover:border-amber-500/50 dark:hover:border-amber-500/50'
    : '';

  return (
    <div className={`${baseStyles} ${variantStyles[variant]} ${hoverStyles} ${className}`} {...props}>
      {children}
    </div>
  );
};
