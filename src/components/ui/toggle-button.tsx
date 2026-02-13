import * as React from 'react';
import { cn } from '@/utils/helper';

/* ============================================
   TOGGLE BUTTON
   ============================================ */

export interface ToggleButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Whether the button is selected */
  selected?: boolean;
  /** Value of the button */
  value: any;
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Color (though MUI default is standard, we support primary) */
  color?: 'primary' | 'standard';
}

const ToggleButton = React.forwardRef<HTMLButtonElement, ToggleButtonProps>(
  ({ className, selected = false, value, size = 'md', color = 'standard', ...props }, ref) => {
    return (
      <button
        ref={ref}
        type="button"
        aria-pressed={selected}
        className={cn(
          'inline-flex items-center justify-center transition-colors border-neutral-200',
          'hover:bg-neutral-50 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary-500',
          selected ? 'bg-neutral-100 text-neutral-900 border-neutral-300 z-10' : 'bg-white text-neutral-600',
          color === 'primary' && selected && 'bg-primary-50 text-primary-600 border-primary-200',
          size === 'sm' && 'h-8 px-3 text-xs',
          size === 'md' && 'h-10 px-4 text-sm',
          size === 'lg' && 'h-12 px-6 text-base',
          'first:rounded-l-lg last:rounded-r-lg border-y border-x -ml-px first:ml-0',
          className
        )}
        {...props}
      />
    );
  }
);

ToggleButton.displayName = 'ToggleButton';

/* ============================================
   TOGGLE BUTTON GROUP
   ============================================ */

export interface ToggleButtonGroupProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onChange'> {
  /** Value of the group */
  value?: any;
  /** Callback when value changes */
  onChange?: (event: React.MouseEvent<HTMLElement>, value: any) => void;
  /** Exclusive selection */
  exclusive?: boolean;
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Orientation */
  orientation?: 'horizontal' | 'vertical';
}

const ToggleButtonGroup = React.forwardRef<HTMLDivElement, ToggleButtonGroupProps>(
  ({ className, value, onChange, exclusive = false, size = 'md', orientation = 'horizontal', children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        role="group"
        className={cn(
          'inline-flex',
          orientation === 'horizontal' ? 'flex-row' : 'flex-col',
          className
        )}
        {...props}
      >
        {React.Children.map(children, (child) => {
          if (!React.isValidElement(child)) return null;

          const childElement = child as React.ReactElement<any>;
          const isSelected = exclusive ? value === childElement.props.value : value?.includes?.(childElement.props.value);

          return React.cloneElement(childElement, {
            selected: isSelected,
            size: size,
            onClick: (e: React.MouseEvent<HTMLElement>) => {
              if (exclusive) {
                onChange?.(e, childElement.props.value === value ? null : childElement.props.value);
              } else {
                const index = value?.indexOf(childElement.props.value);
                const nextValue = index >= 0
                  ? value.filter((v: any) => v !== childElement.props.value)
                  : [...(value || []), childElement.props.value];
                onChange?.(e, nextValue);
              }
              childElement.props.onClick?.(e);
            },
            className: cn(
              orientation === 'vertical' && 'rounded-none first:rounded-t-lg last:rounded-b-lg -mt-px first:mt-0 ml-0',
              childElement.props.className
            ),
          });
        })}
      </div>
    );
  }
);

ToggleButtonGroup.displayName = 'ToggleButtonGroup';

export { ToggleButton, ToggleButtonGroup };
