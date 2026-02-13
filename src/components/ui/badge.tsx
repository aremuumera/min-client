import * as React from 'react';
import { cn } from '@/utils/helper';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'neutral';
  pill?: boolean;
}

const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant = 'primary', pill = false, children, ...props }, ref) => {
    const variantClasses = {
      primary: 'bg-primary-100 text-primary-700',
      secondary: 'bg-secondary-100 text-secondary-700',
      success: 'bg-green-100 text-green-700',
      warning: 'bg-yellow-100 text-yellow-700',
      error: 'bg-red-100 text-red-700',
      neutral: 'bg-neutral-100 text-neutral-700',
    };

    return (
      <span
        ref={ref}
        className={cn(
          'inline-flex items-center px-1.5 py-0.5 text-xs font-semibold leading-none',
          pill ? 'rounded-full' : 'rounded-sm',
          variantClasses[variant],
          className
        )}
        {...props}
      >
        {children}
      </span>
    );
  }
);

Badge.displayName = 'Badge';

export { Badge };
