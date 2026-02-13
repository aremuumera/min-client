import * as React from 'react';
import Link from 'next/link';

/**
 * This is an adapted for `next/link` component.
 * We use this to help us maintain consistency between React-Router and Next.js Router
 */
export const RouterLink = React.forwardRef(function RouterLink(props: any, ref) {
  const { href, ...other } = props;

  return <Link ref={ref} href={href} {...other} />;
});

