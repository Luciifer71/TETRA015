import React from 'react';

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: SelectOption[];
  error?: string;
}

export const Select: React.FC<SelectProps> = ({
  label,
  options,
  error,
  className = '',
  id,
  ...props
}) => {
  const selectId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className="flex flex-col gap-1.5 w-full">
      {label && (
        <label htmlFor={selectId} className="text-xs font-bold text-slate-800 dark:text-slate-300 uppercase tracking-wider">
          {label}
        </label>
      )}
      <select
        id={selectId}
        className={`w-full bg-slate-50 dark:bg-[#121215] border ${
          error
            ? 'border-rose-500'
            : 'border-slate-300 dark:border-white/15 focus:border-[#8D9797] dark:focus:border-[#8D9797] focus:ring-[#8D9797]/20'
        } text-slate-950 dark:text-white font-medium text-sm rounded-xl px-4 py-2.5 transition-all duration-200 focus:outline-none focus:ring-2 cursor-pointer ${className}`}
        {...props}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value} className="bg-white dark:bg-[#1c1c22] text-slate-950 dark:text-white font-medium">
            {opt.label}
          </option>
        ))}
      </select>
      {error && <span className="text-xs font-bold text-rose-600 dark:text-rose-400">{error}</span>}
    </div>
  );
};
