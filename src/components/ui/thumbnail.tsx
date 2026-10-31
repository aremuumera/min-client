'use client';

import * as React from 'react';
import Image from 'next/image';
import { cn } from '@/utils/helper';

export interface ThumbnailProps {
  src?: string | null;
  /** Empty for a decorative image next to its own label */
  alt?: string;
  /** Shown when there is no image or it fails to load */
  fallback: React.ReactNode;
  size?: 'sm' | 'md';
  className?: string;
}

const SIZES = { sm: 'h-9 w-9', md: 'h-12 w-12' };

/** A small square picture for a record (category, material…), with an icon when it is missing or broken */
export function Thumbnail({ src, alt = '', fallback, size = 'sm', className }: ThumbnailProps) {
  const [failed, setFailed] = React.useState(false);
  React.useEffect(() => setFailed(false), [src]);
  const show = !!src && !failed;
  return (
    <span className={cn('flex shrink-0 items-center justify-center overflow-hidden rounded-lg border border-hairline bg-surface-feature text-primary-pressed', SIZES[size], className)}>
      {/* unoptimized: category images come from any host (not limited to next.config remotePatterns) */}
      {show ? <Image src={src} alt={alt} width={96} height={96} unoptimized className="h-full w-full object-cover" onError={() => setFailed(true)} /> : fallback}
    </span>
  );
}
