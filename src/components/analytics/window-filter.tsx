'use client';

import * as React from 'react';
import { DropdownSelect, FilterBar, Input } from '@/components/ui';
import { DEFAULT_WINDOW, INTERVALS, PRESETS, windowProblem, windowText, type Preset, type Window, type WindowChoice } from '@/lib/analytics';

/** The period every section shows (step 2.14, D5): a preset or two dates, and how to group it */
export function WindowFilter({ value, onChange, shown, children }: { value: WindowChoice; onChange: (w: WindowChoice) => void; shown?: Window; children?: React.ReactNode }) {
  const problem = windowProblem(value);
  const changed = (value.preset !== DEFAULT_WINDOW.preset ? 1 : 0) + (value.interval ? 1 : 0);
  return (
    <div className="space-y-2" data-testid="analytics-window">
      <FilterBar activeCount={changed} onClear={() => onChange(DEFAULT_WINDOW)}>
        <DropdownSelect aria-label="Period" value={value.preset} onValueChange={(v) => onChange({ ...value, preset: v as Preset })} options={PRESETS} className="md:w-48" />
        {value.preset === 'custom' && (
          <>
            <Input type="date" aria-label="From" value={value.from} max={value.to || undefined} onChange={(e) => onChange({ ...value, from: e.target.value })} className="md:w-44" />
            <Input type="date" aria-label="To" value={value.to} min={value.from || undefined} onChange={(e) => onChange({ ...value, to: e.target.value })} className="md:w-44" />
          </>
        )}
        <DropdownSelect aria-label="Group by" value={value.interval} onValueChange={(v) => onChange({ ...value, interval: v as WindowChoice['interval'] })} options={INTERVALS} placeholder="Group automatically" className="md:w-48" />
        {children}
      </FilterBar>
      {problem ? <p className="text-sm text-semantic-error-text" role="alert">{problem}</p> : shown && <p className="text-sm text-steel">Showing {windowText(shown)}.</p>}
    </div>
  );
}
