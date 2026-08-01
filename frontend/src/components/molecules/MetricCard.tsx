import React from 'react';
import { Card } from '../atoms/Card';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { motion } from 'framer-motion';

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
  iconBgColor = 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card variant="glass" hoverEffect className="relative overflow-hidden group border border-slate-200 dark:border-[#344e5f] hover:border-amber-500/50 dark:hover:border-amber-500/50">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-black text-slate-700 dark:text-[#CBCDD0] uppercase tracking-wider">{title}</p>
            <h3 className="text-2xl font-black text-slate-950 dark:text-[#DFE0E2] mt-2 tracking-tight group-hover:text-amber-600 dark:group-hover:text-yellow-400 transition-colors">
              {value}
            </h3>
          </div>
          <div className={`p-3 rounded-2xl ${iconBgColor} transition-transform duration-300 group-hover:scale-110 shadow-sm shrink-0`}>
            {icon}
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between text-xs pt-3 border-t border-slate-200 dark:border-[#344e5f]">
          {change && (
            <div className={`flex items-center font-extrabold gap-1 ${isPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
              {isPositive ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
              <span>{change}</span>
            </div>
          )}
          {subtitle && <span className="font-semibold text-slate-500 dark:text-[#A4A6A8]">{subtitle}</span>}
        </div>
      </Card>
    </motion.div>
  );
};

