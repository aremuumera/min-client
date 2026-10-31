import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/utils/helper';

/**
 * Button (design-system/design.md: button-primary / secondary / danger / ghost).
 * The MUI-style API (variant, color, size) is kept for the existing pages; the look is MINMEG's:
 * pill, semibold, 44px on phones, brand green with white text, flat (no shadows).
 */
const buttonVariants = cva(
  // Base styles
  [
    'inline-flex items-center justify-center gap-2',
    'font-semibold rounded-full whitespace-nowrap',
    'transition-colors duration-150',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2',
    'disabled:pointer-events-none disabled:bg-hairline disabled:text-muted disabled:border-hairline',
    'cursor-pointer select-none',
  ],
  {
    variants: {
      variant: {
        contained: ['text-white'],
        outlined: ['border bg-canvas'],
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
        sm: 'h-11 md:h-9 px-4 text-xs',
        md: 'h-11 px-5 text-sm',
        lg: 'h-12 px-6 text-base',
      },
      fullWidth: {
        true: 'w-full',
        false: '',
      },
    },
    compoundVariants: [
      // Contained variants
      { variant: 'contained', color: 'primary', className: 'bg-primary hover:bg-primary-deep active:bg-primary-pressed' },
      { variant: 'contained', color: 'secondary', className: 'bg-brand-dark hover:bg-brand-dark-hover' },
      { variant: 'contained', color: 'success', className: 'bg-primary hover:bg-primary-deep active:bg-primary-pressed' },
      { variant: 'contained', color: 'info', className: 'bg-slate hover:bg-charcoal' },
      { variant: 'contained', color: 'warning', className: 'bg-semantic-warning hover:brightness-95 text-ink' },
      { variant: 'contained', color: 'error', className: 'bg-semantic-error hover:bg-semantic-error-text' },

      // Outlined variants
      { variant: 'outlined', color: 'primary', className: 'border-primary text-primary-pressed hover:bg-brand-green-soft' },
      { variant: 'outlined', color: 'secondary', className: 'border-hairline-strong text-ink hover:bg-surface' },
      { variant: 'outlined', color: 'success', className: 'border-primary text-primary-pressed hover:bg-brand-green-soft' },
      { variant: 'outlined', color: 'info', className: 'border-hairline-strong text-slate hover:bg-surface' },
      { variant: 'outlined', color: 'warning', className: 'border-semantic-warning text-semantic-warning-text hover:bg-semantic-warning-bg' },
      { variant: 'outlined', color: 'error', className: 'border-semantic-error text-semantic-error-text hover:bg-semantic-error-bg' },

      // Text variants
      { variant: 'text', color: 'primary', className: 'text-primary-pressed hover:bg-brand-green-soft' },
      { variant: 'text', color: 'secondary', className: 'text-ink hover:bg-surface' },
      { variant: 'text', color: 'success', className: 'text-primary-pressed hover:bg-brand-green-soft' },
      { variant: 'text', color: 'info', className: 'text-slate hover:bg-surface' },
      { variant: 'text', color: 'warning', className: 'text-semantic-warning-text hover:bg-semantic-warning-bg' },
      { variant: 'text', color: 'error', className: 'text-semantic-error-text hover:bg-semantic-error-bg' },
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
  sx?: any;
}

/**
 * Button component
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
      asChild,
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
