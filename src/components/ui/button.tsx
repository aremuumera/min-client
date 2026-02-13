import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/utils/helper';

/**
 * Button variants using class-variance-authority
 * Matches MUI button styling from the original customer-frontend
 */
const buttonVariants = cva(
  // Base styles
  [
    'inline-flex items-center justify-center gap-2',
    'font-medium rounded-lg',
    'transition-all duration-200',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2',
    'disabled:pointer-events-none disabled:opacity-50',
    'cursor-pointer select-none',
  ],
  {
    variants: {
      variant: {
        contained: [
          'text-white shadow-sm',
          'hover:shadow-lg hover:brightness-110',
          'active:brightness-95',
        ],
        outlined: [
          'border-2 bg-transparent shadow-sm',
          'hover:bg-opacity-10',
          'active:bg-opacity-20',
        ],
        text: [
          'bg-transparent',
          'hover:bg-opacity-10',
          'active:bg-opacity-20',
        ],
      },
      color: {
        primary: '',
        secondary: '',
        success: '',
        info: '',
        warning: '',
        error: '',
      },
      size: {
        sm: 'h-8 px-3 text-xs',
        md: 'h-10 px-4 text-sm',
        lg: 'h-12 px-6 text-base',
      },
      fullWidth: {
        true: 'w-full',
        false: '',
      },
    },
    compoundVariants: [
      // Contained variants
      { variant: 'contained', color: 'primary', className: 'bg-primary-500 hover:bg-primary-600' },
      { variant: 'contained', color: 'secondary', className: 'bg-secondary-700 hover:bg-secondary-800' },
      { variant: 'contained', color: 'success', className: 'bg-success-500 hover:bg-success-600' },
      { variant: 'contained', color: 'info', className: 'bg-info-500 hover:bg-info-600' },
      { variant: 'contained', color: 'warning', className: 'bg-warning-500 hover:bg-warning-600 text-neutral-900' },
      { variant: 'contained', color: 'error', className: 'bg-error-500 hover:bg-error-600' },

      // Outlined variants
      { variant: 'outlined', color: 'primary', className: 'border-primary-500 text-primary-500 hover:bg-primary-50' },
      { variant: 'outlined', color: 'secondary', className: 'border-secondary-300 text-secondary-700 hover:bg-secondary-50' },
      { variant: 'outlined', color: 'success', className: 'border-success-500 text-success-500 hover:bg-success-50' },
      { variant: 'outlined', color: 'info', className: 'border-info-500 text-info-500 hover:bg-info-50' },
      { variant: 'outlined', color: 'warning', className: 'border-warning-500 text-warning-500 hover:bg-warning-50' },
      { variant: 'outlined', color: 'error', className: 'border-error-500 text-error-500 hover:bg-error-50' },

      // Text variants
      { variant: 'text', color: 'primary', className: 'text-primary-500 hover:bg-primary-50' },
      { variant: 'text', color: 'secondary', className: 'text-secondary-700 hover:bg-secondary-50' },
      { variant: 'text', color: 'success', className: 'text-success-500 hover:bg-success-50' },
      { variant: 'text', color: 'info', className: 'text-info-500 hover:bg-info-50' },
      { variant: 'text', color: 'warning', className: 'text-warning-500 hover:bg-warning-50' },
      { variant: 'text', color: 'error', className: 'text-error-500 hover:bg-error-50' },
    ],
    defaultVariants: {
      variant: 'contained',
      color: 'primary',
      size: 'md',
      fullWidth: false,
    },
  }
);

export interface ButtonProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'color'>,
  VariantProps<typeof buttonVariants> {
  /** Content to render before the button text */
  startIcon?: React.ReactNode;
  /** Content to render after the button text */
  endIcon?: React.ReactNode;
  /** Loading state */
  loading?: boolean;
  /** As child - render as a different element */
  asChild?: boolean;
  /** MUI-style system props */
  sx?: any;
}

/**
 * Button component
 * Replacement for MUI Button with matching variants and styling
 */
const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      color,
      size,
      fullWidth,
      startIcon,
      endIcon,
      loading,
      disabled,
      children,
      sx,
      style,
      ...props
    },
    ref
  ) => {
    return (
      <button
        className={cn(buttonVariants({ variant, color: color ?? undefined, size, fullWidth, className }))}
        style={{ ...(sx || {}), ...style }}
        ref={ref}
        disabled={disabled || loading}
        {...props}
      >
        {loading ? (
          <svg
            className="animate-spin h-4 w-4"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        ) : (
          startIcon
        )}
        {children}
        {!loading && endIcon}
      </button>
    );
  }
);

Button.displayName = 'Button';

export { Button, buttonVariants };
