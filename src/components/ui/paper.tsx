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
      0: '',
      1: 'border border-hairline',
      2: 'border border-hairline',
      3: 'border border-hairline',
    };

    return (
      <div
        ref={ref}
        className={cn(
          'bg-canvas',
          !square && 'rounded-lg',
          variant === 'outlined' ? 'border border-hairline' : elevationClasses[elevation],
          className
        )}
        {...props}
      />
    );
  }
);

Paper.displayName = 'Paper';

export { Paper };
