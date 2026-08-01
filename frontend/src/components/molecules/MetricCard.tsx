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
      <Card variant="glass" hoverEffect className="relative overflow-hidden group border border-[#D0D0D2] dark:border-[#8D9797]/25 hover:border-[#BCBCBE] dark:hover:border-slate-400/50">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-bold text-[#4B4C51] dark:text-slate-400 uppercase tracking-wider">{title}</p>
            <h3 className="text-2xl font-black text-[#2E2E2D] dark:text-white mt-2 tracking-tight transition-colors">
              {value}
            </h3>
          </div>
          <div className={`p-3 rounded-2xl ${iconBgColor} transition-transform duration-300 group-hover:scale-110 shadow-sm shrink-0`}>
            {icon}
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between text-xs pt-3 border-t border-[#D0D0D2]/60 dark:border-white/10">
          {change && (
            <div className={`flex items-center font-bold gap-1 ${isPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
              {isPositive ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
              <span>{change}</span>
            </div>
          )}
          {subtitle && <span className="font-medium text-[#4B4C51] dark:text-slate-400">{subtitle}</span>}
        </div>
      </Card>
    </motion.div>
  );
};

