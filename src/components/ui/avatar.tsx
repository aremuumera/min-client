'use client'

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/utils/helper';

const avatarVariants = cva(
  [
    'relative inline-flex items-center justify-center shrink-0 overflow-hidden rounded-full',
    'bg-neutral-200 text-neutral-600 font-medium',
  ],
  {
    variants: {
      size: {
        xs: 'h-6 w-6 text-xs',
        sm: 'h-8 w-8 text-sm',
        md: 'h-10 w-10 text-base',
        lg: 'h-12 w-12 text-lg',
        xl: 'h-16 w-16 text-xl',
      },
      variant: {
        circular: 'rounded-full',
        rounded: 'rounded-lg',
        square: 'rounded-none',
      },
    },
    defaultVariants: {
      size: 'md',
      variant: 'circular',
    },
  }
);

export interface AvatarProps
  extends React.HTMLAttributes<HTMLDivElement>,
  VariantProps<typeof avatarVariants> {
  /** Image source */
  src?: string;
  /** Alt text for the image */
  alt?: string;
  /** Fallback content when image fails or is not provided */
  fallback?: React.ReactNode;
  /** MUI-style system props */
  sx?: any;
}

const Avatar = React.forwardRef<HTMLDivElement, AvatarProps>(
  ({ className, size, variant, src, alt, fallback, children, ...props }, ref) => {
    // If src is provided, it behaves like the old monolithic component for backward compatibility
    // If no src, it behaves like a container for AvatarImage/AvatarFallback
    const [imageError, setImageError] = React.useState(false);
    const showLegacyBehavior = !!src || !!fallback || !!alt;

    if (showLegacyBehavior) {
      const showFallback = !src || imageError;
      const initials = React.useMemo(() => {
        if (!alt) return null;
        const words = alt.trim().split(' ');
        if (words.length === 1) {
          return words[0].charAt(0).toUpperCase();
        }
        return (words[0].charAt(0) + words[words.length - 1].charAt(0)).toUpperCase();
      }, [alt]);

      return (
        <div
          ref={ref}
          className={cn(avatarVariants({ size, variant }), className)}
          {...props}
        >
          {!showFallback ? (
            <img
              src={src}
              alt={alt}
              className="h-full w-full object-cover"
              onError={() => setImageError(true)}
            />
          ) : (
            fallback || children || initials
          )}
        </div>
      );
    }

    return (
      <div
        ref={ref}
        className={cn(avatarVariants({ size, variant }), className)}
        {...props}
      >
        {children}
      </div>
    );
  }
);
Avatar.displayName = 'Avatar';

const AvatarImage = React.forwardRef<
  HTMLImageElement,
  React.ImgHTMLAttributes<HTMLImageElement>
>(({ className, ...props }, ref) => (
  <img
    ref={ref}
    className={cn('aspect-square h-full w-full object-cover', className)}
    {...props}
  />
));
AvatarImage.displayName = 'AvatarImage';

const AvatarFallback = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      'flex h-full w-full items-center justify-center rounded-full bg-muted font-medium',
      className
    )}
    {...props}
  />
));
AvatarFallback.displayName = 'AvatarFallback';

/* ============================================
   AVATAR GROUP
   ============================================ */

export interface AvatarGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Maximum number of avatars to show */
  max?: number;
  /** Size of the avatars */
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  /** Total count (for showing "+N more") */
  total?: number;
}

function AvatarGroup({
  className,
  children,
  max = 5,
  size = 'md',
  total,
  ...props
}: AvatarGroupProps) {
  const childrenArray = React.Children.toArray(children);
  const visibleChildren = childrenArray.slice(0, max);
  const remainingCount = total !== undefined ? total - max : childrenArray.length - max;

  const spacingMap = {
    xs: '-ml-1.5',
    sm: '-ml-2',
    md: '-ml-3',
    lg: '-ml-4',
    xl: '-ml-5',
  };

  return (
    <div className={cn('flex items-center', className)} {...props}>
      {visibleChildren.map((child, index) => (
        <div
          key={index}
          className={cn(
            'relative ring-2 ring-white rounded-full',
            index > 0 && spacingMap[size]
          )}
          style={{ zIndex: visibleChildren.length - index }}
        >
          {React.isValidElement<AvatarProps>(child)
            ? React.cloneElement(child, { size })
            : child}
        </div>
      ))}
      {remainingCount > 0 && (
        <div
          className={cn(
            avatarVariants({ size }),
            'ring-2 ring-white bg-neutral-100 text-neutral-600',
            spacingMap[size]
          )}
        >
          +{remainingCount}
        </div>
      )}
    </div>
  );
}

export { Avatar, AvatarImage, AvatarFallback, AvatarGroup, avatarVariants };
