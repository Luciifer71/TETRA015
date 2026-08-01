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
    default: 'bg-white dark:bg-[#1a1a1e] border border-[#D0D0D2] dark:border-[#8D9797]/25 shadow-sm dark:shadow-2xl text-[#2E2E2D] dark:text-white',
    glass: 'bg-white/95 dark:bg-[#1c1c22] border border-[#D0D0D2] dark:border-[#8D9797]/30 shadow-sm dark:shadow-2xl text-[#2E2E2D] dark:text-white',
    outline: 'bg-transparent border border-[#D0D0D2] dark:border-[#8D9797]/25 text-[#2E2E2D] dark:text-white',
  };

  const hoverStyles = hoverEffect
    ? 'hover:-translate-y-1 hover:shadow-md dark:hover:shadow-2xl hover:border-[#BCBCBE] dark:hover:border-[#8D9797]/60'
    : '';

  return (
    <div className={`${baseStyles} ${variantStyles[variant]} ${hoverStyles} ${className}`} {...props}>
      {children}
    </div>
  );
};
