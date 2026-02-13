import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/utils/helper';

const typographyVariants = cva('text-foreground', {
  variants: {
    variant: {
      h1: 'scroll-m-20 text-4xl font-extrabold tracking-tight lg:text-5xl',
      h2: 'scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight first:mt-0',
      h3: 'scroll-m-20 text-2xl font-semibold tracking-tight',
      h4: 'scroll-m-20 text-xl font-semibold tracking-tight',
      h5: 'text-lg font-semibold tracking-tight',
      h6: 'text-base font-semibold tracking-tight',
      body1: 'leading-7 [&:not(:first-child)]:mt-6',
      body2: 'text-sm leading-snug',
      subtitle1: 'text-lg font-medium leading-none',
      subtitle2: 'text-sm font-medium leading-none',
      caption: 'text-xs text-muted-foreground',
      overline: 'text-xs font-medium uppercase tracking-wider',
    },
    gutterBottom: {
      true: 'mb-[0.35em]',
    },
    paragraph: {
      true: 'mb-4',
    },
    noWrap: {
      true: 'truncate w-full',
    },
  },
  defaultVariants: {
    variant: 'body1',
    gutterBottom: false,
    paragraph: false,
    noWrap: false,
  },
});

export interface TypographyProps
  extends React.HTMLAttributes<HTMLHeadingElement | HTMLParagraphElement>,
  VariantProps<typeof typographyVariants> {
  component?: React.ElementType;
  children?: React.ReactNode;
  sx?: React.CSSProperties;
  align?: 'left' | 'center' | 'right' | 'justify' | 'inherit';
  color?: string;
  fontWeight?: string | number;
  [key: string]: any;
}

const variantMapping: Record<string, string> = {
  h1: 'h1',
  h2: 'h2',
  h3: 'h3',
  h4: 'h4',
  h5: 'h5',
  h6: 'h6',
  subtitle1: 'h6',
  subtitle2: 'h6',
  body1: 'p',
  body2: 'p',
  caption: 'span',
  overline: 'span',
};

const Typography = React.forwardRef<HTMLElement, TypographyProps>(
  (
    {
      className,
      variant = 'body1',
      gutterBottom = false,
      paragraph = false,
      noWrap = false,
      children,
      sx,
      component,
      // Destructure MUI-specific props to keep them out of cleanProps
      color,
      align,
      fontWeight,
      ...props
    },
    ref
  ) => {
    const Component = (component || variantMapping[variant as string] || 'p') as any;

    // Filter out props that shouldn't be passed to DOM
    const cleanProps = { ...props };

    return (
      <Component
        ref={ref}
        className={cn(
          typographyVariants({
            variant: variant as any,
            gutterBottom,
            paragraph,
            noWrap,
          }),
          className
        )}
        style={{
          ...(sx || {}),
          // Handle alignment and color if passed as MUI props but not in CSS classes
          textAlign: align,
          fontWeight: fontWeight,
        }}
        {...cleanProps}
      >
        {children}
      </Component>
    );
  }
);
Typography.displayName = 'Typography';

export { Typography, typographyVariants };
