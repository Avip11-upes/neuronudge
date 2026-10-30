import React, { HTMLAttributes } from 'react';
import { cn } from '../../lib/utils';

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'neutral' | 'amber' | 'emerald' | 'indigo' | 'rose' | 'outline';
}

export function Badge({ className, variant = 'neutral', children, ...props }: BadgeProps) {
  const variantStyles = {
    neutral: 'bg-stone-100 text-stone-700 border-stone-200',
    amber: 'bg-amber-50 text-amber-900 border-amber-200',
    emerald: 'bg-emerald-50 text-emerald-900 border-emerald-200',
    indigo: 'bg-indigo-50 text-indigo-900 border-indigo-200',
    rose: 'bg-rose-50 text-rose-900 border-rose-200',
    outline: 'bg-transparent text-stone-700 border-stone-300',
  }[variant];

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-semibold tracking-wide border whitespace-nowrap select-none',
        variantStyles,
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}
