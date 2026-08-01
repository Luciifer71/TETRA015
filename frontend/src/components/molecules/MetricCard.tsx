import React from 'react';
import { Card } from '../atoms/Card';
import { TrendingUp, TrendingDown } from 'lucide-react';

export interface MetricCardProps {
  title: string;
  value: string | number;
  change?: string;
  isPositive?: boolean;
  subtitle?: string;
  icon: React.ReactNode;
  iconBgColor?: string;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  change,
  isPositive = true,
  subtitle,
  icon,
  iconBgColor = 'bg-amber-500/10 text-amber-600 dark:text-gold-400',
}) => {
  return (
    <Card variant="glass" hoverEffect className="relative overflow-hidden group border border-slate-200 dark:border-matte-800">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-black text-slate-800 dark:text-zinc-400 uppercase tracking-wider">{title}</p>
          <h3 className="text-2xl font-black text-slate-950 dark:text-white mt-2 tracking-tight group-hover:text-amber-600 dark:group-hover:text-gold-400 transition-colors">
            {value}
          </h3>
        </div>
        <div className={`p-3 rounded-2xl ${iconBgColor} transition-transform duration-300 group-hover:scale-110 shadow-sm`}>
          {icon}
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between text-xs pt-3 border-t border-slate-200 dark:border-matte-800/80">
        {change && (
          <div className={`flex items-center font-extrabold gap-1 ${isPositive ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-700 dark:text-rose-400'}`}>
            {isPositive ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
            <span>{change}</span>
          </div>
        )}
        {subtitle && <span className="font-semibold text-slate-600 dark:text-zinc-400">{subtitle}</span>}
      </div>
    </Card>
  );
};
