'use client';

import * as React from 'react';
import { useCloseOnEscape } from '@/lib/ui/use-close-on-escape';
import { AnimatePresence, motion } from 'framer-motion';
import { cn } from '@/utils/helper';

export interface PopoverProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onDrag' | 'onDragStart' | 'onDragEnd' | 'onAnimationStart' | 'onDragOver' | 'onDragEnter' | 'onDragLeave' | 'onPointerEnter' | 'onPointerLeave' | 'onPointerDown' | 'onPointerUp' | 'onPointerMove' | 'onPointerOut' | 'onPointerCancel' | 'onTransitionEnd'> {
  /** Trigger element */
  trigger: React.ReactNode;
  /** Children content */
  children: React.ReactNode;
  /** Whether the popover is open */
  open?: boolean;
  /** Callback when open state changes */
  onOpenChange?: (open: boolean) => void;
  /** Position relative to trigger */
  position?: 'top' | 'bottom' | 'left' | 'right';
  /** Alignment relative to trigger */
  align?: 'start' | 'center' | 'end';
  /**
   * Phones (under 640 px): open across the screen, 16 px from each side, just under the top bar, so a wide
   * panel never runs off an edge (owner, 2026-11-24: the notifications list ran off the left side)
   */
  fullWidthOnMobile?: boolean;
  /** Classes for the wrapper around the trigger, e.g. "min-w-0 max-w-full" so a shortened ID can shrink in a row */
  rootClassName?: string;
}

const positionClasses = {
  top: 'bottom-full mb-1',
  bottom: 'top-full mt-1',
  left: 'right-full mr-1',
  right: 'left-full ml-1',
};

const alignClasses = {
  start: {
    top: 'left-0',
    bottom: 'left-0',
    left: 'top-0',
    right: 'top-0',
  },
  center: {
    top: 'left-1/2 -translate-x-1/2',
    bottom: 'left-1/2 -translate-x-1/2',
    left: 'top-1/2 -translate-y-1/2',
    right: 'top-1/2 -translate-y-1/2',
  },
  end: {
    top: 'right-0',
    bottom: 'right-0',
    left: 'bottom-0',
    right: 'bottom-0',
  },
};

function Popover({
  trigger,
  children,
  open: controlledOpen,
  onOpenChange,
  position = 'bottom',
  align = 'start',
  fullWidthOnMobile = false,
  rootClassName,
  className,
  ...props
}: PopoverProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  const open = controlledOpen !== undefined ? controlledOpen : uncontrolledOpen;
  const setOpen = onOpenChange !== undefined ? onOpenChange : setUncontrolledOpen;

  // Toggle open
  const toggle = () => setOpen(!open);

  // Close on click outside
  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };

    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open, setOpen]);

  // Escape closes it too, as keyboard users expect
  useCloseOnEscape(open, React.useCallback(() => setOpen(false), [setOpen]));

  return (
    <div className={cn('relative inline-block', rootClassName)} ref={containerRef}>
      <div onClick={toggle} className="max-w-full cursor-pointer">
        {trigger}
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: position === 'bottom' ? -5 : 5 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: position === 'bottom' ? -5 : 5 }}
            transition={{ duration: 0.1 }}
            className={cn(
              'absolute z-50 min-w-[150px] overflow-hidden rounded-lg border border-hairline bg-canvas p-1',
              positionClasses[position],
              alignClasses[align][position],
              className,
              fullWidthOnMobile && 'max-sm:fixed max-sm:inset-x-4 max-sm:top-[72px] max-sm:mt-0 max-sm:w-auto max-sm:translate-x-0'
            )}
            {...props}
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export { Popover };
