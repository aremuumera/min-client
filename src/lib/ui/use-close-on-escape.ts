'use client';

import * as React from 'react';

/**
 * Closes an open popover, menu or dropdown when Escape is pressed. It listens first (capture) and stops the key,
 * so a sheet or dialog the popover sits in stays open: Escape closes the top layer only.
 */
export function useCloseOnEscape(open: boolean, close: () => void) {
  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      e.stopPropagation();
      close();
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [open, close]);
}
