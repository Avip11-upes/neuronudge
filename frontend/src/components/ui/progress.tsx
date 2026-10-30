import React from 'react';
import { cn } from '../../lib/utils';

export interface ProgressProps {
  value: number; // 0 to 100
  className?: string;
  color?: 'amber' | 'emerald' | 'indigo' | 'stone';
}

export function Progress({ value, className, color = 'stone' }: ProgressProps) {
  const clamped = Math.max(0, Math.min(100, value || 0));

  const barColor = {
    amber: 'bg-amber-500',
    emerald: 'bg-emerald-500',
    indigo: 'bg-indigo-600',
    stone: 'bg-stone-800',
  }[color];

  return (
    <div
      role="progressbar"
      aria-valuenow={clamped}
      aria-valuemin={0}
      aria-valuemax={100}
      className={cn('h-2.5 w-full overflow-hidden rounded-full bg-stone-200/80', className)}
    >
      <div
        className={cn('h-full transition-all duration-300 ease-out rounded-full', barColor)}
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}
