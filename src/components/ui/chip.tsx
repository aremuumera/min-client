import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { X } from 'lucide-react';
import { cn } from '@/utils/helper';

const chipVariants = cva(
  [
    'inline-flex items-center gap-1 rounded-full font-medium',
    'transition-colors duration-200',
  ],
  {
    variants: {
      variant: {
        filled: '',
        outlined: 'border bg-transparent',
        soft: '',
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
        sm: 'px-2 py-0.5 text-xs',
        md: 'px-2.5 py-1 text-xs',
        lg: 'px-3 py-1.5 text-sm',
      },
      clickable: {
        true: 'cursor-pointer',
        false: '',
      },
    },
    compoundVariants: [
      // Filled variants
      { variant: 'filled', color: 'default', className: 'bg-neutral-200 text-neutral-900' },
      { variant: 'filled', color: 'primary', className: 'bg-primary-500 text-white' },
      { variant: 'filled', color: 'secondary', className: 'bg-secondary-200 text-secondary-900' },
      { variant: 'filled', color: 'success', className: 'bg-success-500 text-white' },
      { variant: 'filled', color: 'info', className: 'bg-info-500 text-white' },
      { variant: 'filled', color: 'warning', className: 'bg-warning-500 text-neutral-900' },
      { variant: 'filled', color: 'error', className: 'bg-error-500 text-white' },

      // Outlined variants
      { variant: 'outlined', color: 'default', className: 'border-neutral-300 text-neutral-700' },
      { variant: 'outlined', color: 'primary', className: 'border-primary-500 text-primary-500' },
      { variant: 'outlined', color: 'secondary', className: 'border-secondary-400 text-secondary-700' },
      { variant: 'outlined', color: 'success', className: 'border-success-500 text-success-500' },
      { variant: 'outlined', color: 'info', className: 'border-info-500 text-info-500' },
      { variant: 'outlined', color: 'warning', className: 'border-warning-500 text-warning-600' },
      { variant: 'outlined', color: 'error', className: 'border-error-500 text-error-500' },

      // Soft variants
      { variant: 'soft', color: 'default', className: 'bg-neutral-100 text-neutral-700' },
      { variant: 'soft', color: 'primary', className: 'bg-primary-50 text-primary-700' },
      { variant: 'soft', color: 'secondary', className: 'bg-secondary-100 text-secondary-700' },
      { variant: 'soft', color: 'success', className: 'bg-success-50 text-success-700' },
      { variant: 'soft', color: 'info', className: 'bg-info-50 text-info-700' },
      { variant: 'soft', color: 'warning', className: 'bg-warning-50 text-warning-700' },
      { variant: 'soft', color: 'error', className: 'bg-error-50 text-error-700' },

      // Clickable hover states
      { variant: 'filled', clickable: true, className: 'hover:opacity-90' },
      { variant: 'outlined', clickable: true, className: 'hover:bg-neutral-50' },
      { variant: 'soft', clickable: true, className: 'hover:opacity-80' },
    ],
    defaultVariants: {
      variant: 'filled',
      color: 'default',
      size: 'md',
      clickable: false,
    },
  }
);

export interface ChipProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'color'>,
  VariantProps<typeof chipVariants> {
  /** Label text */
  label?: string;
  /** Icon to display before the label */
  icon?: React.ReactNode;
  /** Avatar to display before the label */
  avatar?: React.ReactNode;
  /** Whether the chip is deletable */
  onDelete?: () => void;
  /** Whether the chip is disabled */
  disabled?: boolean;
}

const Chip = React.forwardRef<HTMLDivElement, ChipProps>(
  (
    {
      className,
      variant,
      color,
      size,
      clickable,
      label,
      icon,
      avatar,
      onDelete,
      disabled,
      onClick,
      children,
      ...props
    },
    ref
  ) => {
    return (
      <div
        ref={ref}
        role={clickable ? 'button' : undefined}
        onClick={disabled ? undefined : onClick}
        className={cn(
          chipVariants({ variant, color, size, clickable: clickable || !!onClick }),
          disabled && 'opacity-50 cursor-not-allowed',
          className
        )}
        {...props}
      >
        {avatar && <span className="-ml-1">{avatar}</span>}
        {icon && <span className="flex-shrink-0">{icon}</span>}
        <span>{label || children}</span>
        {onDelete && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            disabled={disabled}
            className={cn(
              'flex-shrink-0 -mr-0.5 rounded-full p-0.5',
              'hover:bg-black/10 focus:outline-none',
              disabled && 'pointer-events-none'
            )}
          >
            <X className="h-3 w-3" />
          </button>
        )}
      </div>
    );
  }
);

Chip.displayName = 'Chip';

export { Chip, chipVariants };
