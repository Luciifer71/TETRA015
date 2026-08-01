import React from 'react';
import { Badge } from '../atoms/Badge';
import { RiskLevel } from '../../types/invoice';

export interface RiskGaugeProps {
  score: number;
  level: RiskLevel;
  confidence?: number;
  size?: 'sm' | 'md' | 'lg';
}

export const RiskGauge: React.FC<RiskGaugeProps> = ({ score, level, confidence, size = 'md' }) => {
  const getScoreColor = (s: number) => {
    if (s >= 90) return 'text-red-500 stroke-red-500';
    if (s >= 70) return 'text-rose-400 stroke-rose-400';
    if (s >= 35) return 'text-amber-400 stroke-amber-400';
    return 'text-emerald-400 stroke-emerald-400';
  };

  const getScoreBg = (s: number) => {
    if (s >= 90) return 'bg-red-500/10 border-red-500/30';
    if (s >= 70) return 'bg-rose-500/10 border-rose-500/30';
    if (s >= 35) return 'bg-amber-500/10 border-amber-500/30';
    return 'bg-emerald-500/10 border-emerald-500/30';
  };

  const strokeDashoffset = 251.2 - (251.2 * score) / 100;

  return (
    <div className={`flex flex-col items-center justify-center p-4 rounded-2xl border ${getScoreBg(score)} backdrop-blur-md`}>
      <div className="relative flex items-center justify-center w-28 h-28">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
          <circle
            cx="50"
            cy="50"
            r="40"
            className="stroke-slate-800 fill-none"
            strokeWidth="8"
          />
          <circle
            cx="50"
            cy="50"
            r="40"
            className={`fill-none transition-all duration-1000 ease-out ${getScoreColor(score)}`}
            strokeWidth="8"
            strokeDasharray="251.2"
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute flex flex-col items-center justify-center">
          <span className={`text-3xl font-extrabold tracking-tight ${getScoreColor(score).split(' ')[0]}`}>
            {score}
          </span>
          <span className="text-[10px] uppercase font-bold text-slate-400">/ 100</span>
        </div>
      </div>

      <div className="mt-3 flex flex-col items-center gap-1">
        <Badge type="risk" value={level} size="md" />
        {confidence !== undefined && (
          <span className="text-[11px] font-medium text-slate-400">
            OCR Confidence: <span className="text-slate-200 font-semibold">{confidence}%</span>
          </span>
        )}
      </div>
    </div>
  );
};
