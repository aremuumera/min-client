import * as React from 'react';
import { cn } from '@/utils/helper';

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Variant of the skeleton */
  variant?: 'text' | 'circular' | 'rectangular' | 'rounded';
  /** Animation style */
  animation?: 'pulse' | 'wave' | false;
}

const Skeleton = React.forwardRef<HTMLDivElement, SkeletonProps>(
  ({ className, variant = 'text', animation = 'pulse', ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'bg-neutral-200',
          animation === 'pulse' && 'animate-pulse',
          animation === 'wave' && 'relative overflow-hidden before:absolute before:inset-0 before:-translate-x-full before:animate-[wave_2s_linear_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/20 before:to-transparent',
          variant === 'text' && 'h-3 w-full rounded-md',
          variant === 'circular' && 'rounded-full',
          variant === 'rectangular' && 'rounded-none',
          variant === 'rounded' && 'rounded-xl',
          className
        )}
        {...props}
      />
    );
  }
);

Skeleton.displayName = 'Skeleton';

export { Skeleton };
