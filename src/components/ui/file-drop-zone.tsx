'use client';

import * as React from 'react';
import { Upload } from 'lucide-react';
import { cn } from '@/utils/helper';

export interface FileDropZoneProps {
  /** Names the file input for screen readers */
  label: string;
  /** Shown in the box, e.g. the formats and sizes allowed */
  hint: React.ReactNode;
  accept: string;
  multiple?: boolean;
  disabled?: boolean;
  onFiles: (files: FileList) => void;
}

/** The dashed upload box: click to browse, or drop files on it */
export function FileDropZone({ label, hint, accept, multiple, disabled, onFiles }: FileDropZoneProps) {
  const [over, setOver] = React.useState(false);
  const input = React.useRef<HTMLInputElement>(null);
  return (
    <div
      onClick={() => !disabled && input.current?.click()}
      onDragOver={(e) => {
        e.preventDefault();
        if (!disabled) setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setOver(false);
        if (!disabled && e.dataTransfer.files.length) onFiles(e.dataTransfer.files);
      }}
      className={cn(
        'flex min-h-[150px] w-full flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed px-4 py-6 text-center transition-colors',
        over ? 'border-brand-green bg-brand-green-soft' : 'border-hairline-strong bg-canvas hover:bg-surface',
        disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer',
      )}
    >
      <Upload className="h-5 w-5 text-steel" aria-hidden />
      <p className="text-sm font-medium text-ink">Click to browse, or drop files here</p>
      <p className="text-xs text-steel">{hint}</p>
      <input
        ref={input}
        aria-label={label}
        type="file"
        accept={accept}
        multiple={multiple}
        disabled={disabled}
        className="sr-only"
        onClick={(e) => e.stopPropagation()}
        onChange={(e) => {
          if (e.target.files?.length) onFiles(e.target.files);
          e.target.value = '';
        }}
      />
    </div>
  );
}
