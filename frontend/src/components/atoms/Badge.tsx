import React from 'react';
import { RiskLevel, InvoiceStatus } from '../../types/invoice';
import { ShieldCheck, ShieldAlert, AlertTriangle, CheckCircle2, Clock, XCircle, FileWarning } from 'lucide-react';

export interface BadgeProps {
  type: 'risk' | 'status';
  value: RiskLevel | InvoiceStatus | string;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
}

export const Badge: React.FC<BadgeProps> = ({ type, value, size = 'md', showIcon = true }) => {
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-[11px] font-semibold gap-1 rounded-md',
    md: 'px-2.5 py-1 text-xs font-semibold gap-1.5 rounded-lg',
    lg: 'px-3.5 py-1.5 text-sm font-bold gap-2 rounded-xl',
  };

  if (type === 'risk') {
    const risk = value as RiskLevel;
    const config = {
      MINIMAL: {
        bg: 'bg-sky-100 dark:bg-sky-500/15 text-sky-900 dark:text-sky-300 border-sky-300 dark:border-sky-500/30',
        icon: <ShieldCheck className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />,
        label: 'MINIMAL',
      },
      LOW: {
        bg: 'bg-emerald-100 dark:bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-500/30',
        icon: <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />,
        label: 'LOW RISK',
      },
      MEDIUM: {
        bg: 'bg-yellow-100 dark:bg-yellow-500/15 text-yellow-900 dark:text-yellow-300 border-yellow-300 dark:border-yellow-500/30',
        icon: <AlertTriangle className="w-3.5 h-3.5 text-yellow-600 dark:text-yellow-400" />,
        label: 'MEDIUM RISK',
      },
      HIGH: {
        bg: 'bg-orange-100 dark:bg-orange-500/20 text-orange-950 dark:text-orange-300 border-orange-300 dark:border-orange-500/40',
        icon: <ShieldAlert className="w-3.5 h-3.5 text-orange-600 dark:text-orange-400" />,
        label: 'HIGH RISK',
      },
      CRITICAL: {
        bg: 'bg-red-100 dark:bg-red-500/25 text-red-900 dark:text-red-300 border-red-400 dark:border-red-500/60 animate-pulse',
        icon: <ShieldAlert className="w-3.5 h-3.5 text-red-600 dark:text-red-400" />,
        label: 'CRITICAL',
      },
    }[risk] || {
      bg: 'bg-slate-200 dark:bg-slate-700/50 text-slate-800 dark:text-slate-300 border-slate-300 dark:border-slate-600',
      icon: null,
      label: value,
    };

    return (
      <span className={`inline-flex items-center border ${config.bg} ${sizeClasses[size]}`}>
        {showIcon && config.icon}
        <span>{config.label}</span>
      </span>
    );
  }

  // Status type
  const status = value as InvoiceStatus;
  const config = {
    PENDING: {
      bg: 'bg-slate-200 dark:bg-slate-700/40 text-slate-800 dark:text-slate-300 border-slate-300 dark:border-slate-600',
      icon: <Clock className="w-3.5 h-3.5 text-slate-600 dark:text-slate-400" />,
    },
    PROCESSING: {
      bg: 'bg-indigo-100 dark:bg-indigo-500/15 text-indigo-800 dark:text-indigo-300 border-indigo-300 dark:border-indigo-500/30',
      icon: <Clock className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />,
    },
    PROCESSED: {
      bg: 'bg-blue-100 dark:bg-blue-500/15 text-blue-800 dark:text-blue-300 border-blue-300 dark:border-blue-500/30',
      icon: <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />,
    },
    FLAGGED: {
      bg: 'bg-amber-100 dark:bg-amber-500/15 text-amber-900 dark:text-amber-300 border-amber-300 dark:border-amber-500/30',
      icon: <FileWarning className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />,
    },
    APPROVED: {
      bg: 'bg-emerald-100 dark:bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-500/30',
      icon: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />,
    },
    REJECTED: {
      bg: 'bg-rose-100 dark:bg-rose-500/15 text-rose-900 dark:text-rose-300 border-rose-300 dark:border-rose-500/30',
      icon: <XCircle className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />,
    },
    FAILED: {
      bg: 'bg-rose-100 dark:bg-rose-500/20 text-rose-900 dark:text-rose-300 border-rose-300 dark:border-rose-500/40',
      icon: <XCircle className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />,
    },
  }[status] || {
    bg: 'bg-slate-200 dark:bg-slate-700/50 text-slate-800 dark:text-slate-300 border-slate-300 dark:border-slate-600',
    icon: null,
  };

  return (
    <span className={`inline-flex items-center border ${config.bg} ${sizeClasses[size]}`}>
      {showIcon && config.icon}
      <span>{status}</span>
    </span>
  );
};

