import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/utils/helper';

const iconButtonVariants = cva(
  [
    'inline-flex items-center justify-center',
    'rounded-full',
    'transition-all duration-200',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2',
    'disabled:pointer-events-none disabled:opacity-50',
    'cursor-pointer select-none',
  ],
  {
    variants: {
      variant: {
        default: 'hover:bg-neutral-100 active:bg-neutral-200',
        contained: 'text-white shadow-sm',
        outlined: 'border-2 bg-transparent',
      },
      color: {
        default: '',
        primary: '',
        secondary: '',
        success: '',
        info: '',
        warning: '',
        error: '',
      },
      size: {
        sm: 'h-8 w-8 text-sm',
        md: 'h-10 w-10 text-base',
        lg: 'h-12 w-12 text-lg',
      },
    },
    compoundVariants: [
      // Default variant colors
      { variant: 'default', color: 'default', className: 'text-neutral-600 hover:bg-neutral-100' },
      { variant: 'default', color: 'primary', className: 'text-primary-500 hover:bg-primary-50' },
      { variant: 'default', color: 'secondary', className: 'text-secondary-700 hover:bg-secondary-50' },
      { variant: 'default', color: 'success', className: 'text-success-500 hover:bg-success-50' },
      { variant: 'default', color: 'info', className: 'text-info-500 hover:bg-info-50' },
      { variant: 'default', color: 'warning', className: 'text-warning-500 hover:bg-warning-50' },
      { variant: 'default', color: 'error', className: 'text-error-500 hover:bg-error-50' },

      // Contained variant colors
      { variant: 'contained', color: 'primary', className: 'bg-primary-500 hover:bg-primary-600' },
      { variant: 'contained', color: 'secondary', className: 'bg-secondary-700 hover:bg-secondary-800' },
      { variant: 'contained', color: 'success', className: 'bg-success-500 hover:bg-success-600' },
      { variant: 'contained', color: 'info', className: 'bg-info-500 hover:bg-info-600' },
      { variant: 'contained', color: 'warning', className: 'bg-warning-500 hover:bg-warning-600 text-neutral-900' },
      { variant: 'contained', color: 'error', className: 'bg-error-500 hover:bg-error-600' },

      // Outlined variant colors
      { variant: 'outlined', color: 'primary', className: 'border-primary-500 text-primary-500 hover:bg-primary-50' },
      { variant: 'outlined', color: 'secondary', className: 'border-secondary-300 text-secondary-700 hover:bg-secondary-50' },
      { variant: 'outlined', color: 'success', className: 'border-success-500 text-success-500 hover:bg-success-50' },
      { variant: 'outlined', color: 'info', className: 'border-info-500 text-info-500 hover:bg-info-50' },
      { variant: 'outlined', color: 'warning', className: 'border-warning-500 text-warning-500 hover:bg-warning-50' },
      { variant: 'outlined', color: 'error', className: 'border-error-500 text-error-500 hover:bg-error-50' },
    ],
    defaultVariants: {
      variant: 'default',
      color: 'default',
      size: 'md',
    },
  }
);

export interface IconButtonProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'color'>,
  VariantProps<typeof iconButtonVariants> {
  /** Accessible label for the button */
  'aria-label': string;
}

const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ className, variant, color, size, children, ...props }, ref) => {
    return (
      <button
        className={cn(iconButtonVariants({ variant, color: color ?? undefined, size, className }))}
        ref={ref}
        {...props}
      >
        {children}
      </button>
    );
  }
);

IconButton.displayName = 'IconButton';

export { IconButton, iconButtonVariants };
