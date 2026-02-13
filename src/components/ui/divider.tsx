import * as React from 'react';
import { cn } from '@/utils/helper';

export interface DividerProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Orientation of the divider */
  orientation?: 'horizontal' | 'vertical';
  /** Whether the divider has flexible width/height */
  flexItem?: boolean;
  /** Text orientation within the divider */
  textAlign?: 'left' | 'center' | 'right';
}

const Divider = React.forwardRef<HTMLDivElement, DividerProps>(
  ({ className, orientation = 'horizontal', flexItem = false, textAlign = 'center', children, ...props }, ref) => {
    if (children && orientation === 'horizontal') {
      return (
        <div
          ref={ref}
          role="separator"
          className={cn(
            'flex items-center text-xs font-medium text-neutral-500 uppercase tracking-wider my-4',
            className
          )}
          {...props}
        >
          <div className={cn('flex-grow h-px bg-neutral-200', textAlign === 'left' ? 'w-4 flex-grow-0' : '')} />
          <span className="px-3">{children}</span>
          <div className={cn('flex-grow h-px bg-neutral-200', textAlign === 'right' ? 'w-4 flex-grow-0' : '')} />
        </div>
      );
    }

    return (
      <div
        ref={ref}
        role="separator"
        className={cn(
          orientation === 'horizontal' ? 'h-px w-full bg-neutral-200 my-4' : 'w-px h-full bg-neutral-200 mx-4',
          flexItem && (orientation === 'horizontal' ? 'w-auto' : 'h-auto self-stretch'),
          className
        )}
        {...props}
      />
    );
  }
);

Divider.displayName = 'Divider';

export { Divider };
