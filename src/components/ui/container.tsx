import * as React from 'react';
import { cn } from '@/utils/helper';

export interface ContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  maxWidth?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | false;
  fixed?: boolean;
  disableGutters?: boolean;
}

const Container = React.forwardRef<HTMLDivElement, ContainerProps>(
  ({ className, maxWidth = 'lg', fixed = false, disableGutters = false, ...props }, ref) => {
    const maxWidthClasses = {
      xs: 'max-w-[444px]',
      sm: 'max-w-[600px]',
      md: 'max-w-[900px]',
      lg: 'max-w-[1200px]',
      xl: 'max-w-[1536px]',
    };

    return (
      <div
        ref={ref}
        className={cn(
          'mx-auto w-full',
          !disableGutters && 'px-4 sm:px-6 lg:px-8',
          maxWidth !== false && maxWidthClasses[maxWidth],
          fixed && 'sm:max-w-screen-sm md:max-w-screen-md lg:max-w-screen-lg xl:max-w-screen-xl',
          className
        )}
        {...props}
      />
    );
  }
);

Container.displayName = 'Container';

export { Container };
