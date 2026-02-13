import * as React from 'react';
import { cn } from '@/utils/helper';

export interface GridProps extends React.HTMLAttributes<HTMLDivElement> {
  container?: boolean;
  item?: boolean;
  spacing?: number;
  xs?: number | 'auto' | boolean;
  sm?: number | 'auto' | boolean;
  md?: number | 'auto' | boolean;
  lg?: number | 'auto' | boolean;
  xl?: number | 'auto' | boolean;
  columns?: number;
  alignItems?: any;
  justifyContent?: any;
  alignContent?: any;
  direction?: any;
  flexDirection?: any;
  flexWrap?: any;
  flexGrow?: any;
  flexShrink?: any;
}

const Grid = React.forwardRef<HTMLDivElement, GridProps>(
  (
    {
      className,
      container,
      item,
      spacing = 0,
      xs,
      sm,
      md,
      lg,
      xl,
      columns,
      // MUI-style layout props to filter out from DOM
      alignItems,
      justifyContent,
      alignContent,
      direction,
      flexDirection,
      flexWrap,
      flexGrow,
      flexShrink,
      ...props
    },
    ref
  ) => {

    // Simplistic mapping of MUI grid to Tailwind grid
    // For container, we use flex or grid. MUI Grid is flex-based.

    const containerClasses = container ? cn(
      'flex flex-wrap',
      spacing > 0 && `gap-${spacing}`
    ) : '';

    const getColSpan = (val: any) => {
      if (typeof val === 'number') return `w-${val}/12`; // This is not standard tailwind for all numbers, but let's approximate or use style
      if (val === true) return 'flex-1';
      return '';
    };

    // A better approach for MUI-like grid in Tailwind:
    const itemStyle: React.CSSProperties = {
      alignItems,
      justifyContent,
      alignContent,
      flexDirection: flexDirection || (direction as any),
      flexWrap,
      flexGrow,
      flexShrink,
    };
    if (item) {
      if (typeof xs === 'number') itemStyle.width = `${(xs / 12) * 100}%`;
      // Responsive widths would need complex class mapping or more logic.
      // For now, let's use common widths if available or inline styles for precision if needed.
    }

    return (
      <div
        ref={ref}
        className={cn(
          container && 'flex flex-wrap',
          item && 'box-border',
          className
        )}
        style={{
          ...itemStyle,
          ...(container && spacing > 0 ? { gap: `${spacing * 8}px` } : {}),
          ...props.style,
        }}
        {...props}
      />
    );
  }
);

Grid.displayName = 'Grid';

export { Grid };
