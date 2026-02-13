import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { AlertCircle, CheckCircle, Info, XCircle, X } from 'lucide-react';
import { cn } from '@/utils/helper';
import { IconButton } from './icon-button';

const alertVariants = cva(
  'relative flex gap-3 rounded-lg border p-4',
  {
    variants: {
      severity: {
        success: 'bg-success-50 border-success-200 text-success-800',
        info: 'bg-info-50 border-info-200 text-info-800',
        warning: 'bg-warning-50 border-warning-200 text-warning-800',
        error: 'bg-error-50 border-error-200 text-error-800',
      },
      variant: {
        standard: '',
        outlined: 'bg-transparent',
        filled: 'border-transparent',
      },
    },
    compoundVariants: [
      { variant: 'filled', severity: 'success', className: 'bg-success-500 text-white' },
      { variant: 'filled', severity: 'info', className: 'bg-info-500 text-white' },
      { variant: 'filled', severity: 'warning', className: 'bg-warning-500 text-neutral-900' },
      { variant: 'filled', severity: 'error', className: 'bg-error-500 text-white' },
    ],
    defaultVariants: {
      severity: 'info',
      variant: 'standard',
    },
  }
);

const iconMap = {
  success: CheckCircle,
  info: Info,
  warning: AlertCircle,
  error: XCircle,
};

export interface AlertProps
  extends React.HTMLAttributes<HTMLDivElement>,
  VariantProps<typeof alertVariants> {
  /** Title of the alert */
  title?: string;
  /** Whether the alert can be dismissed */
  dismissible?: boolean;
  /** Callback when closed/dismissed */
  onClose?: () => void;
  /** Custom icon */
  icon?: React.ReactNode;
  /** Action button */
  action?: React.ReactNode;
  /** MUI-style system props */
  sx?: any;
}

const Alert = React.forwardRef<HTMLDivElement, AlertProps>(
  (
    {
      className,
      severity,
      variant,
      title,
      dismissible,
      onClose,
      icon,
      action,
      children,
      sx,
      ...props
    },
    ref
  ) => {
    const Icon = severity ? iconMap[severity] : iconMap.info;

    return (
      <div
        ref={ref}
        role="alert"
        className={cn(alertVariants({ severity, variant }), className)}
        style={{ ...(sx || {}) }}
        {...props}
      >
        <div className="flex-shrink-0">
          {icon || <Icon className="h-5 w-5" />}
        </div>
        <div className="flex-1 min-w-0">
          {title && (
            <h5 className="font-semibold text-sm mb-1">{title}</h5>
          )}
          <div className="text-sm">{children}</div>
          {action && <div className="mt-3">{action}</div>}
        </div>
        {dismissible && (
          <IconButton
            aria-label="Dismiss alert"
            onClick={onClose}
            size="sm"
            className="-mr-2 -mt-2"
          >
            <X className="h-4 w-4" />
          </IconButton>
        )}
      </div>
    );
  }
);

export interface AlertTitleProps extends React.HTMLAttributes<HTMLHeadingElement> { }
const AlertTitle = ({ className, ...props }: AlertTitleProps) => (
  <h5 className={cn('font-semibold text-sm mb-1', className)} {...props} />
);

export interface AlertDescriptionProps extends React.HTMLAttributes<HTMLDivElement> { }
const AlertDescription = ({ className, ...props }: AlertDescriptionProps) => (
  <div className={cn('text-sm', className)} {...props} />
);

export { Alert, alertVariants, AlertTitle, AlertDescription };
