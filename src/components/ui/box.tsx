import * as React from 'react';
import { cn } from '@/utils/helper';

export interface BoxProps extends React.HTMLAttributes<HTMLDivElement> {
  sx?: any;
  component?: React.ElementType;
  display?: string;
  flexDirection?: any;
  alignItems?: any;
  justifyContent?: any;
  p?: string | number;
  m?: string | number;
  pt?: string | number;
  pr?: string | number;
  pb?: string | number;
  pl?: string | number;
  mt?: string | number;
  mr?: string | number;
  mb?: string | number;
  ml?: string | number;
  px?: string | number;
  py?: string | number;
  mx?: string | number;
  my?: string | number;
}

const Box = React.forwardRef<HTMLDivElement, BoxProps>(
  (
    {
      className,
      component: Component = 'div',
      sx,
      // Filter out potential MUI system props that aren't valid DOM attributes
      display,
      flexDirection,
      alignItems,
      justifyContent,
      p,
      m,
      pt,
      pr,
      pb,
      pl,
      mt,
      mr,
      mb,
      ml,
      px,
      py,
      mx,
      my,
      ...props
    },
    ref
  ) => {
    return (
      <Component
        ref={ref}
        className={cn(className)}
        style={{
          display,
          flexDirection,
          alignItems,
          justifyContent,
          padding: p,
          margin: m,
          paddingTop: pt,
          paddingRight: pr,
          paddingBottom: pb,
          paddingLeft: pl,
          marginTop: mt,
          marginRight: mr,
          marginBottom: mb,
          marginLeft: ml,
          ...(sx || {}),
        }}
        {...props}
      />
    );
  }
);

Box.displayName = 'Box';

export { Box };
