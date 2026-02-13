import * as React from 'react';
import { cn } from '@/utils/helper';

export interface StackProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Layout direction */
  direction?: 'row' | 'column' | 'row-reverse' | 'column-reverse';
  /** Space between items (Tailwind spacing scale) */
  spacing?: number | string;
  /** Whether to wrap items */
  wrap?: boolean;
  /** MUI-style system props */
  sx?: any;
  /** As child - render as a different element */
  as?: React.ElementType;
  /** MUI-style layout props */
  alignItems?: any;
  justifyContent?: any;
  alignContent?: any;
  flexDirection?: any;
  flexWrap?: any;
  flexGrow?: any;
  flexShrink?: any;
  /** Allow any other props for custom components */
  [key: string]: any;
}

const Stack = React.forwardRef<HTMLDivElement, StackProps>(
  (
    {
      className,
      direction = 'column',
      spacing = 2,
      wrap = false,
      style,
      as: Component = 'div',
      sx,
      // MUI-style layout props to filter out from DOM
      alignItems,
      justifyContent,
      alignContent,
      flexDirection,
      flexWrap,
      flexGrow,
      flexShrink,
      ...props
    },
    ref
  ) => {
    const directionClasses: Record<string, string> = {
      row: 'flex-row',
      column: 'flex-col',
      'row-reverse': 'flex-row-reverse',
      'column-reverse': 'flex-col-reverse',
    };

    const gapClass = typeof spacing === 'number' ? `gap-${spacing}` : '';
    const customGap = typeof spacing === 'string' ? spacing : undefined;

    return (
      <Component
        ref={ref}
        className={cn(
          'flex',
          !flexDirection && (directionClasses[direction] as string),
          wrap && !flexWrap && 'flex-wrap',
          gapClass,
          className
        )}
        style={{
          gap: customGap,
          alignItems,
          justifyContent,
          alignContent,
          flexDirection,
          flexWrap,
          flexGrow,
          flexShrink,
          ...(sx || {}),
          ...style,
        }}
        {...props}
      />
    );
  }
);

Stack.displayName = 'Stack';

export { Stack };
