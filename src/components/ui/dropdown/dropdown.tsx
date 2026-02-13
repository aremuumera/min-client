import * as React from 'react';

import { DropdownContext } from './dropdown-context';

export function Dropdown({ children, delay = 50 }: { children: React.ReactNode; delay?: number }) {
  const [anchorEl, setAnchorEl] = React.useState<any | null>(null);
  const cleanupRef = React.useRef<any>(null);

  const handleTriggerMouseEnter = React.useCallback((event: React.MouseEvent) => {
    clearTimeout(cleanupRef.current);
    setAnchorEl(event.currentTarget);
  }, []);

  const handleTriggerMouseLeave = React.useCallback(
    (_: any) => {
      cleanupRef.current = setTimeout(() => {
        setAnchorEl(null);
      }, delay);
    },
    [delay]
  );

  const handleTriggerKeyUp = React.useCallback((event: any) => {
    if (event.key === 'Enter' || event.key === ' ') {
      setAnchorEl(event.currentTarget);
    }
  }, []);

  const handlePopoverMouseEnter = React.useCallback((_: any) => {
    clearTimeout(cleanupRef.current);
  }, []);

  const handlePopoverMouseLeave = React.useCallback(
    (_: any) => {
      cleanupRef.current = setTimeout(() => {
        setAnchorEl(null);
      }, delay);
    },
    [delay]
  );

  const handlePopoverEscapePressed = React.useCallback(() => {
    setAnchorEl(null);
  }, []);

  const open = Boolean(anchorEl);

  return (
    <DropdownContext.Provider
      value={{
        anchorEl,
        onPopoverMouseEnter: handlePopoverMouseEnter,
        onPopoverMouseLeave: handlePopoverMouseLeave,
        onPopoverEscapePressed: handlePopoverEscapePressed,
        onTriggerMouseEnter: handleTriggerMouseEnter,
        onTriggerMouseLeave: handleTriggerMouseLeave,
        onTriggerKeyUp: handleTriggerKeyUp,
        open,
      }}
    >
      {children}
    </DropdownContext.Provider>
  );
}
