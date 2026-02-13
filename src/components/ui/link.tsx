import * as React from 'react';
import NextLink, { type LinkProps as NextLinkProps } from 'next/link';
import { cn } from '@/utils/helper';

export interface LinkProps
  extends React.AnchorHTMLAttributes<HTMLAnchorElement>,
  Omit<NextLinkProps, 'href'> {
  href: string;
}

const Link = React.forwardRef<HTMLAnchorElement, LinkProps>(
  ({ className, href, children, ...props }, ref) => {
    return (
      <NextLink
        ref={ref}
        href={href}
        className={cn(
          'text-primary hover:underline underline-offset-4 font-medium',
          className
        )}
        style={{ ...({}) }}
        {...props}
      >
        {children}
      </NextLink>
    );
  }
);
Link.displayName = 'Link';

export { Link };
