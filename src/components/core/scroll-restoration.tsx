import * as React from 'react';
import { usePathname } from 'next/navigation';

// ReactRouter doesn't handle scroll restoration by default.
// The component it exports doesn't work with BrowserRouter.
export function ScrollRestoration() {
  const pathname = usePathname();

  React.useEffect(() => {
    window.scrollTo(0, 0);
    document.body.scrollTop = 0; // For Safari
    document.documentElement.scrollTop = 0; // For Chrome, Firefox, IE and Opera
    
  }, [pathname]);

  return null;
}
