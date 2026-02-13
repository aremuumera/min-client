'use client';

import * as React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { cn } from '@/utils/helper';
import { IconButton } from './icon-button';

/* ============================================
   MODAL CONTEXT
   ============================================ */

interface ModalContextValue {
  open: boolean;
  onClose: () => void;
}

const ModalContext = React.createContext<ModalContextValue | undefined>(undefined);

function useModalContext() {
  const context = React.useContext(ModalContext);
  if (!context) {
    throw new Error('Modal components must be used within a Modal');
  }
  return context;
}

/* ============================================
   MODAL ROOT
   ============================================ */

export interface ModalProps {
  /** Whether the modal is open */
  open: boolean;
  /** Callback when the modal should close */
  onClose: () => void;
  /** Children content */
  children: React.ReactNode;
  /** Size of the modal */
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'full';
  /** Whether clicking the backdrop closes the modal */
  closeOnBackdropClick?: boolean;
  /** Whether pressing Escape closes the modal */
  closeOnEscape?: boolean;
  /** MUI-style system props */
  sx?: any;
  /** Additional CSS classes */
  className?: string;
  /** Whether the modal should be full width */
  fullWidth?: boolean;
  /** Maximum width of the modal (alias for size) */
  maxWidth?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'full';
  /** Props for the paper element */
  PaperProps?: { sx?: any; className?: string };
}

const sizeClasses = {
  xs: 'max-w-xs',
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  full: 'max-w-full mx-4',
};

function Modal({
  open,
  onClose,
  children,
  size = 'md',
  closeOnBackdropClick = true,
  closeOnEscape = true,
  sx,
  className,
  fullWidth,
  maxWidth,
  PaperProps,
  ...props
}: ModalProps) {
  const actualSize = maxWidth || size;
  const actualFullWidth = fullWidth || actualSize === 'full';
  // Handle escape key
  React.useEffect(() => {
    if (!closeOnEscape) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [open, onClose, closeOnEscape]);

  // Prevent body scroll when modal is open
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
    <ModalContext.Provider value={{ open, onClose }}>
      <AnimatePresence>
        {open && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="absolute inset-0 bg-black/50"
              onClick={closeOnBackdropClick ? onClose : undefined}
            />

            {/* Modal Content */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.2 }}
              className={cn(
                'relative w-full bg-white rounded-xl shadow-xl',
                actualFullWidth ? 'max-w-none mx-4' : sizeClasses[actualSize],
                className,
                PaperProps?.className
              )}
              style={{ ...(sx || {}), ...(PaperProps?.sx || {}) }}
              onClick={(e) => e.stopPropagation()}
            >
              {children}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </ModalContext.Provider>
  );
}

/* ============================================
   MODAL HEADER
   ============================================ */

export interface ModalHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Whether to show a close button */
  showCloseButton?: boolean;
}

function ModalHeader({
  className,
  children,
  showCloseButton = true,
  ...props
}: ModalHeaderProps) {
  const { onClose } = useModalContext();

  return (
    <div
      className={cn(
        'flex items-center justify-between gap-4 p-4 border-b border-neutral-200',
        className
      )}
      {...props}
    >
      <h2 className="text-lg font-semibold text-neutral-900">{children}</h2>
      {showCloseButton && (
        <IconButton
          aria-label="Close modal"
          onClick={onClose}
          size="sm"
          className="-mr-2"
        >
          <X className="h-5 w-5" />
        </IconButton>
      )}
    </div>
  );
}

/* ============================================
   MODAL BODY
   ============================================ */

export interface ModalBodyProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Whether to show top/bottom borders */
  dividers?: boolean;
}

function ModalBody({ className, dividers = false, ...props }: ModalBodyProps) {
  return (
    <div
      className={cn(
        'p-4 overflow-y-auto max-h-[60vh]',
        dividers && 'border-y border-neutral-200',
        className
      )}
      {...props}
    />
  );
}

/* ============================================
   MODAL FOOTER
   ============================================ */

export interface ModalFooterProps extends React.HTMLAttributes<HTMLDivElement> {
  sx?: any;
}

function ModalFooter({ className, sx, ...props }: ModalFooterProps) {
  return (
    <div
      className={cn(
        'flex items-center justify-end gap-2 p-4 border-t border-neutral-200',
        className
      )}
      style={{ ...(sx || {}) }}
      {...props}
    />
  );
}

export { Modal, ModalHeader, ModalBody, ModalFooter };

// Alias for MUI compatibility
export const Dialog = Modal;
export const DialogTitle = ModalHeader;
export const DialogContent = ModalBody;
export const DialogActions = ModalFooter;
