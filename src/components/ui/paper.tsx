import * as React from 'react';
import { cn } from '@/utils/helper';

export interface PaperProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Elevation level (0-3) */
  elevation?: 0 | 1 | 2 | 3;
  /** Outlined variant */
  variant?: 'elevation' | 'outlined';
  /** Square corners */
  square?: boolean;
}

const Paper = React.forwardRef<HTMLDivElement, PaperProps>(
  ({ className, elevation = 1, variant = 'elevation', square = false, ...props }, ref) => {
    const elevationClasses = {
      0: 'shadow-none',
      1: 'shadow-sm',
      2: 'shadow-md',
      3: 'shadow-lg',
    };

    return (
      <div
        ref={ref}
        className={cn(
          'bg-white',
          !square && 'rounded-xl',
          variant === 'outlined' ? 'border border-neutral-200' : elevationClasses[elevation],
          className
        )}
        {...props}
      />
    );
  }
);

Paper.displayName = 'Paper';

export { Paper };
