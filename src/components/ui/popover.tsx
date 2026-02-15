'use client';

import * as React from 'react';
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

  return (
    <div className="relative inline-block" ref={containerRef}>
      <div onClick={toggle} className="cursor-pointer">
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
              'absolute z-50 min-w-[150px] overflow-hidden rounded-lg border border-neutral-200 bg-white p-1 shadow-lg',
              positionClasses[position],
              alignClasses[align][position],
              className
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
