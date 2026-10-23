'use client';

import * as React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { cn } from '@/utils/helper';
import { IconButton } from './icon-button';
import { Portal } from './portal';

export interface DrawerProps {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  anchor?: 'left' | 'right' | 'top' | 'bottom';
  className?: string;
}

const anchorVariants = {
  left: { x: '-100%', y: 0 },
  right: { x: '100%', y: 0 },
  top: { x: 0, y: '-100%' },
  bottom: { x: 0, y: '100%' },
};

export function Drawer({
  open,
  onClose,
  children,
  anchor = 'left',
  className,
}: DrawerProps) {
  React.useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  return (
    <Portal>
      <AnimatePresence>
        {open && (
          <div className="fixed inset-0 z-50 flex">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-overlay"
              onClick={onClose}
            />

            {/* Content */}
            <motion.div
              initial={anchorVariants[anchor]}
              animate={{ x: 0, y: 0 }}
              exit={anchorVariants[anchor]}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className={cn(
                'relative z-50 bg-canvas border-hairline flex flex-col',
                {
                  'h-full w-80 max-w-full mr-auto border-r': anchor === 'left',
                  'h-full w-80 max-w-full ml-auto border-l': anchor === 'right',
                  'w-full h-80 mb-auto border-b': anchor === 'top',
                  'w-full h-80 mt-auto border-t': anchor === 'bottom',
                },
                className
              )}
            >
              <div className="absolute top-4 right-4 z-10">
                <IconButton onClick={onClose} aria-label="Close drawer" size="sm">
                  <X className="h-5 w-5" />
                </IconButton>
              </div>
              {children}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </Portal>
  );
}
