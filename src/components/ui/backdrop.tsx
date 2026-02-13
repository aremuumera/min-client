'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/utils/helper';

export interface BackdropProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onDrag' | 'onDragStart' | 'onDragEnd' | 'onAnimationStart'> {
  /** Whether the backdrop is open */
  open: boolean;
  /** Whether to show a spinner */
  loading?: boolean;
}

const Backdrop = React.forwardRef<HTMLDivElement, BackdropProps>(
  ({ className, open, loading = false, children, ...props }, ref) => {
    return (
      <AnimatePresence>
        {open && (
          <motion.div
            ref={ref}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={cn(
              'fixed inset-0 z-[1200] flex items-center justify-center bg-black/50 backdrop-blur-sm',
              className
            )}
            {...props}
          >
            {loading ? (
              <div className="flex flex-col items-center gap-4">
                <div className="h-12 w-12 animate-spin rounded-full border-4 border-white/20 border-t-white" />
                {children && <div className="text-white text-sm font-medium">{children}</div>}
              </div>
            ) : (
              children
            )}
          </motion.div>
        )}
      </AnimatePresence>
    );
  }
);

Backdrop.displayName = 'Backdrop';

export { Backdrop };
