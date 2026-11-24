'use client';

import * as React from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/utils/helper';

/*
 * The chat list's filter tabs. Sized so all five fit the chat list on one line (owner, 2026-11-24: "Admin" was
 * cut off); where they still don't fit, the row scrolls sideways and fades at the edge that has more. Flat, no shadow.
 */
export type ConversationType = 'all' | 'product' | 'rfq' | 'business' | 'admin';

interface ConversationTypeFilterProps {
  selectedType: ConversationType | string;
  onTypeChange: (type: ConversationType) => void;
  conversationCounts: Partial<Record<ConversationType, number>>;
}

const TYPES: { value: ConversationType; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'product', label: 'Product' },
  { value: 'rfq', label: 'RFQ' },
  { value: 'business', label: 'Business' },
  { value: 'admin', label: 'Admin' },
];

export function ConversationTypeFilter({ selectedType, onTypeChange, conversationCounts }: ConversationTypeFilterProps) {
  const rowRef = React.useRef<HTMLDivElement>(null);
  const [fadeRight, setFadeRight] = React.useState(false);

  const measure = React.useCallback(() => {
    const el = rowRef.current;
    if (el) setFadeRight(el.scrollWidth - el.clientWidth - el.scrollLeft > 4);
  }, []);

  React.useEffect(() => {
    const el = rowRef.current;
    if (!el) return;
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, [measure]);

  return (
    <div className="relative pt-1">
      <div ref={rowRef} role="tablist" aria-label="Filter chats" onScroll={measure} className="no-scrollbar flex w-full gap-1 overflow-x-auto">
        {TYPES.map((type) => {
          const active = selectedType === type.value;
          const count = conversationCounts[type.value] ?? 0;
          return (
            <button
              key={type.value}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => onTypeChange(type.value)}
              className={cn(
                'inline-flex min-h-8 shrink-0 items-center gap-1 whitespace-nowrap rounded-lg px-2 text-[13px] transition-colors',
                active ? 'bg-primary font-semibold text-on-primary' : 'bg-surface-soft font-medium text-slate hover:bg-hairline-soft'
              )}
            >
              {type.label}
              {count > 0 && (
                <Badge variant="primary" pill className="h-4 px-1 text-[10px]">
                  {count}
                </Badge>
              )}
            </button>
          );
        })}
      </div>
      {fadeRight && <span className="pointer-events-none absolute inset-y-0 right-0 w-8 bg-linear-to-l from-surface to-transparent" aria-hidden />}
    </div>
  );
}
