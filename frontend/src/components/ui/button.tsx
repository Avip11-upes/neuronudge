import React, { ButtonHTMLAttributes, forwardRef } from 'react';
import { cn } from '../../lib/utils';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', disabled, children, ...props }, ref) => {
    const baseClasses =
      'inline-flex items-center justify-center font-medium rounded-xl transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none select-none cursor-pointer whitespace-nowrap active:scale-[0.98]';

    const sizeClasses = {
      sm: 'text-xs px-3.5 py-1.5 min-h-[36px]',
      md: 'text-sm px-5 py-2.5 min-h-[44px]',
      lg: 'text-base px-6 py-3.5 min-h-[50px] font-semibold',
    }[size];

    const variantClasses = {
      primary:
        'bg-stone-900 text-stone-50 hover:bg-stone-800 shadow-sm focus-visible:ring-stone-900',
      secondary:
        'bg-amber-100 text-amber-900 hover:bg-amber-200 border border-amber-200 focus-visible:ring-amber-500',
      outline:
        'border border-stone-300 text-stone-700 bg-white hover:bg-stone-50 hover:border-stone-400 focus-visible:ring-stone-500',
      ghost:
        'text-stone-600 hover:bg-stone-100 hover:text-stone-900 focus-visible:ring-stone-400',
      danger:
        'bg-rose-600 text-white hover:bg-rose-700 shadow-sm focus-visible:ring-rose-500',
    }[variant];

    return (
      <button
        ref={ref}
        disabled={disabled}
        className={cn(baseClasses, sizeClasses, variantClasses, className)}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
