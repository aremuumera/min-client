'use client';

import * as React from 'react';
import { X } from 'lucide-react';
import { Drawer } from './drawer';
import { cn } from '@/utils/helper';

/*
 * SideSheet — record details and edit forms beside a list (design.md: side-sheet on the overlay).
 * Full width on phones; 480px (md) or 640px (lg) from tablet up. Header and footer stay put, the body scrolls.
 */
export interface SideSheetProps {
  open: boolean;
  onClose: () => void;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: 'md' | 'lg';
}

export function SideSheet({ open, onClose, title, subtitle, children, footer, size = 'md' }: SideSheetProps) {
  return (
    <Drawer open={open} onClose={onClose} anchor="right" className={cn('!w-full', size === 'md' ? 'md:!w-[480px]' : 'md:!w-[640px]')}>
      <div role="dialog" aria-modal="true" className="flex h-full min-h-0 flex-col">
        <div className="flex items-start gap-3 border-b border-hairline px-4 py-3 md:px-6">
          <div className="min-w-0 flex-1 py-1.5">
            <h2 className="text-lg font-semibold text-ink break-words">{title}</h2>
            {subtitle && <div className="mt-0.5 text-sm text-steel break-words">{subtitle}</div>}
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-steel hover:bg-surface-soft hover:text-ink">
            <X className="h-5 w-5" aria-hidden />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 md:px-6">{children}</div>
        {footer && <div className="flex flex-col-reverse gap-2 border-t border-hairline px-4 py-3 sm:flex-row sm:justify-end md:px-6">{footer}</div>}
      </div>
    </Drawer>
  );
}
