import * as React from 'react';
import { cn } from '@/utils/helper';

export interface StepperProps extends React.HTMLAttributes<HTMLDivElement> {
  activeStep?: number;
  orientation?: 'horizontal' | 'vertical';
  children: React.ReactNode;
  sx?: any;
}

const Stepper = ({ activeStep = 0, orientation = 'horizontal', children, className, sx, ...props }: StepperProps) => {
  return (
    <div
      className={cn(
        'flex w-full',
        orientation === 'horizontal' ? 'flex-row items-center justify-between' : 'flex-col',
        className
      )}
      style={{ ...(sx || {}) }}
      {...props}
    >
      {React.Children.map(children, (child, index) => {
        if (!React.isValidElement(child)) return null;
        return React.cloneElement(child as React.ReactElement<any>, {
          active: index === activeStep,
          completed: index < activeStep,
          last: index === React.Children.count(children) - 1,
        });
      })}
    </div>
  );
};

export interface StepProps extends React.HTMLAttributes<HTMLDivElement> {
  active?: boolean;
  completed?: boolean;
  last?: boolean;
  children: React.ReactNode;
  sx?: any;
}

const Step = ({ active, completed, last, children, className, sx, ...props }: StepProps) => {
  return (
    <div className={cn('flex items-center flex-1 relative', className)} style={{ ...(sx || {}) }} {...props}>
      {children}
      {!last && (
        <div
          className={cn(
            'flex-1 h-[2px] mx-4 transition-colors',
            completed ? 'bg-primary-500' : 'bg-neutral-200'
          )}
        />
      )}
    </div>
  );
};

export interface StepLabelProps extends React.HTMLAttributes<HTMLDivElement> {
  active?: boolean;
  completed?: boolean;
  children: React.ReactNode;
  StepIconComponent?: React.ElementType;
}

const StepLabel = ({ active, completed, children, className, StepIconComponent, ...props }: StepLabelProps) => {
  return (
    <div className={cn('flex items-center gap-2', className)} {...props}>
      {StepIconComponent ? (
        <StepIconComponent active={active} completed={completed} />
      ) : (
        <div
          className={cn(
            'w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors',
            active && 'bg-primary-500 text-white',
            completed && 'bg-success-500 text-white',
            !active && !completed && 'bg-neutral-200 text-neutral-500'
          )}
        >
          {completed ? '✓' : ''}
        </div>
      )}
      <span
        className={cn(
          'text-sm transition-colors',
          active ? 'font-bold text-neutral-900' : 'text-neutral-500'
        )}
      >
        {children}
      </span>
    </div>
  );
};

export { Stepper, Step, StepLabel };
