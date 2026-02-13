'use client';

import * as React from 'react';
import { cn } from '@/utils/helper';

export interface CollapseProps extends React.HTMLAttributes<HTMLDivElement> {
  in?: boolean;
  timeout?: number;
}

const Collapse = React.forwardRef<HTMLDivElement, CollapseProps>(
  ({ in: isOpen, className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'overflow-hidden transition-all duration-300 ease-in-out',
          isOpen ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0',
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Collapse.displayName = 'Collapse';

export { Collapse };
