import * as React from 'react';
import { cn } from '@/utils/helper';

/* ============================================
   CARD CONTAINER
   ============================================ */

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Card elevation/shadow level */
  elevation?: 0 | 1 | 2 | 3;
  /** Outlined variant (no shadow) */
  outlined?: boolean;
  /** MUI-style system props */
  sx?: any;
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, elevation = 1, outlined = false, ...props }, ref) => {
    const elevationClasses = {
      0: '',
      1: 'shadow-sm',
      2: 'shadow-md',
      3: 'shadow-lg',
    };

    return (
      <div
        ref={ref}
        className={cn(
          'rounded-xl bg-white',
          outlined ? 'border border-neutral-200' : elevationClasses[elevation],
          className
        )}
        style={{ ...(props.sx || {}), ...props.style }}
        {...props}
      />
    );
  }
);

Card.displayName = 'Card';

/* ============================================
   CARD HEADER
   ============================================ */

export interface CardHeaderProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> {
  /** Title of the card */
  title?: React.ReactNode;
  /** Subtitle of the card */
  subheader?: React.ReactNode;
  /** Avatar or icon to display */
  avatar?: React.ReactNode;
  /** Action element (button, menu, etc.) */
  action?: React.ReactNode;
}

const CardHeader = React.forwardRef<HTMLDivElement, CardHeaderProps>(
  ({ className, title, subheader, avatar, action, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn('flex items-start gap-4 p-4', className)}
        {...props}
      >
        {avatar && <div className="flex-shrink-0">{avatar}</div>}
        <div className="flex-1 min-w-0">
          {title && (
            <h3 className="text-base font-semibold text-neutral-900 truncate">
              {title}
            </h3>
          )}
          {subheader && (
            <p className="text-sm text-neutral-500 truncate">{subheader}</p>
          )}
          {children}
        </div>
        {action && <div className="flex-shrink-0">{action}</div>}
      </div>
    );
  }
);

CardHeader.displayName = 'CardHeader';

/* ============================================
   CARD CONTENT
   ============================================ */

export interface CardContentProps extends React.HTMLAttributes<HTMLDivElement> { }

const CardContent = React.forwardRef<HTMLDivElement, CardContentProps>(
  ({ className, ...props }, ref) => {
    return (
      <div ref={ref} className={cn('p-4 pt-0', className)} {...props} />
    );
  }
);

CardContent.displayName = 'CardContent';

/* ============================================
   CARD ACTIONS
   ============================================ */

export interface CardActionsProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Disable spacing between buttons */
  disableSpacing?: boolean;
}

const CardActions = React.forwardRef<HTMLDivElement, CardActionsProps>(
  ({ className, disableSpacing = false, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'flex items-center p-4 pt-0',
          !disableSpacing && 'gap-2',
          className
        )}
        {...props}
      />
    );
  }
);

CardActions.displayName = 'CardActions';

/* ============================================
   CARD MEDIA
   ============================================ */

export interface CardMediaProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Image source */
  image?: string;
  /** Alt text for the image */
  alt?: string;
  /** Height of the media */
  height?: number | string;
}

const CardMedia = React.forwardRef<HTMLDivElement, CardMediaProps>(
  ({ className, image, alt, height = 200, style, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn('bg-cover bg-center bg-no-repeat', className)}
        style={{
          backgroundImage: image ? `url(${image})` : undefined,
          height: typeof height === 'number' ? `${height}px` : height,
          ...style,
        }}
        role={image ? 'img' : undefined}
        aria-label={alt}
        {...props}
      />
    );
  }
);

CardMedia.displayName = 'CardMedia';

export interface CardTitleProps extends React.HTMLAttributes<HTMLHeadingElement> { }
const CardTitle = ({ className, ...props }: CardTitleProps) => (
  <h3 className={cn('text-base font-semibold text-neutral-900 truncate', className)} {...props} />
);

export { Card, CardHeader, CardContent, CardActions, CardMedia, CardTitle };
