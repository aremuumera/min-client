import * as React from 'react';
import { cn } from '@/utils/helper';

/* ============================================
   BREADCRUMBS ROOT
   ============================================ */

export interface BreadcrumbsProps extends React.HTMLAttributes<HTMLElement> {
  /** Custom separator */
  separator?: React.ReactNode;
}

const Breadcrumbs = React.forwardRef<HTMLElement, BreadcrumbsProps>(
  ({ className, separator = '/', children, ...props }, ref) => {
    const allChildren = React.Children.toArray(children);

    return (
      <nav
        ref={ref}
        aria-label="breadcrumb"
        className={cn('flex flex-wrap items-center text-sm text-neutral-500', className)}
        {...props}
      >
        <ol className="flex items-center flex-wrap">
          {allChildren.map((child, index) => (
            <React.Fragment key={index}>
              <li className="flex items-center">
                {child}
              </li>
              {index < allChildren.length - 1 && (
                <li className="mx-2 text-neutral-400 select-none" aria-hidden="true">
                  {separator}
                </li>
              )}
            </React.Fragment>
          ))}
        </ol>
      </nav>
    );
  }
);

Breadcrumbs.displayName = 'Breadcrumbs';

export { Breadcrumbs };
