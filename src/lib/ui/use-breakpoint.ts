'use client';

import { useSyncExternalStore } from 'react';

/* phone < 768px, tablet 768–1023px, desktop ≥ 1024px (design.md breakpoints) */
export type Breakpoint = 'phone' | 'tablet' | 'desktop';

const read = (): Breakpoint => (typeof window === 'undefined' ? 'desktop' : window.innerWidth < 768 ? 'phone' : window.innerWidth < 1024 ? 'tablet' : 'desktop');
const subscribe = (cb: () => void) => {
  window.addEventListener('resize', cb);
  return () => window.removeEventListener('resize', cb);
};

export function useBreakpoint(): Breakpoint {
  return useSyncExternalStore(subscribe, read, () => 'desktop');
}
