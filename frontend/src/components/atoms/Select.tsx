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
        <label htmlFor={selectId} className="text-xs font-black text-slate-950 dark:text-[#DFE0E2] uppercase tracking-wider">
          {label}
        </label>
      )}
      <select
        id={selectId}
        className={`w-full bg-slate-50 dark:bg-[#263C49] border ${
          error
            ? 'border-rose-500'
            : 'border-slate-300 dark:border-[#344e5f] focus:border-amber-500 dark:focus:border-amber-400 focus:ring-amber-500/20'
        } text-slate-950 dark:text-[#DFE0E2] font-semibold text-sm rounded-xl px-4 py-2.5 transition-all duration-200 focus:outline-none focus:ring-2 cursor-pointer ${className}`}
        {...props}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value} className="bg-white dark:bg-[#263C49] text-slate-950 dark:text-[#DFE0E2] font-semibold">
            {opt.label}
          </option>
        ))}
      </select>
      {error && <span className="text-xs font-bold text-rose-600 dark:text-rose-400">{error}</span>}
    </div>
  );
};
