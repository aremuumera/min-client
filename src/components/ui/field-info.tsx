'use client';

import * as React from 'react';
import { Info } from 'lucide-react';
import { Portal } from './portal';

const WIDTH = 288;

/** The (i) beside a field's label: click for a short note on what the field is for */
export function FieldInfo({ label, children }: { label: string; children: React.ReactNode }) {
  const [place, setPlace] = React.useState<{ top: number; left: number } | null>(null);
  const button = React.useRef<HTMLButtonElement>(null);
  const note = React.useRef<HTMLDivElement>(null);

  const toggle = () => {
    if (place) return setPlace(null);
    const box = button.current!.getBoundingClientRect();
    setPlace({ top: box.bottom + 6, left: Math.max(16, Math.min(box.left, window.innerWidth - WIDTH - 16)) });
  };

  React.useEffect(() => {
    if (!place) return;
    const close = (e: Event) => {
      if (e.type === 'mousedown' && (note.current?.contains(e.target as Node) || button.current?.contains(e.target as Node))) return;
      setPlace(null);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      // Closes the note only, not the sheet or modal around it
      e.stopImmediatePropagation();
      setPlace(null);
    };
    document.addEventListener('mousedown', close);
    document.addEventListener('scroll', close, true);
    document.addEventListener('keydown', onKey, true);
    return () => {
      document.removeEventListener('mousedown', close);
      document.removeEventListener('scroll', close, true);
      document.removeEventListener('keydown', onKey, true);
    };
  }, [place]);

  return (
    <>
      <button ref={button} type="button" aria-label={`About ${label}`} aria-expanded={!!place} onClick={toggle} className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-steel hover:bg-surface hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500">
        <Info className="h-4 w-4" aria-hidden />
      </button>
      {place && (
        <Portal>
          <div ref={note} role="note" aria-label={`About ${label}`} style={{ position: 'fixed', top: place.top, left: place.left, width: `min(${WIDTH}px, calc(100vw - 32px))`, zIndex: 15000 }} className="rounded-lg border border-hairline bg-canvas p-3 text-[13px] leading-5 text-ink">
            {children}
          </div>
        </Portal>
      )}
    </>
  );
}
