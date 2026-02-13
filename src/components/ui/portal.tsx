'use client';

import * as React from 'react';
import * as ReactDOM from 'react-dom';

interface PortalProps {
  children: React.ReactNode;
  container?: HTMLElement | null;
}

export const Portal = ({ children, container }: PortalProps) => {
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return ReactDOM.createPortal(children, container || document.body);
};
