'use client';

import * as React from 'react';
import { DropdownSelect, type DropdownSelectOption } from './dropdown-select';
import { Input } from './input';

const CUSTOM = '__custom';

export interface SelectWithCustomProps {
  id: string;
  value: string;
  options: readonly DropdownSelectOption[];
  onChange: (value: string) => void;
  placeholder?: string;
  /** Label of the box that appears for Custom */
  customLabel: string;
  customPlaceholder?: string;
  maxLength?: number;
}

/** A list with a Custom choice: choosing Custom opens a box to type in, and the typed text is the value */
export function SelectWithCustom({ id, value, options, onChange, placeholder = 'Not set', customLabel, customPlaceholder, maxLength = 255 }: SelectWithCustomProps) {
  const known = options.some((o) => o.value === value);
  const [custom, setCustom] = React.useState(!!value && !known);
  const inputId = `${id}-custom`;
  return (
    <div className="flex flex-col gap-2">
      <DropdownSelect
        id={id}
        searchable={false}
        value={custom ? CUSTOM : value}
        options={[...options, { value: CUSTOM, label: 'Custom' }]}
        placeholder={placeholder}
        onValueChange={(next) => {
          setCustom(next === CUSTOM);
          onChange(next === CUSTOM ? '' : next);
        }}
      />
      {custom && (
        <div className="flex flex-col gap-1.5">
          <label htmlFor={inputId} className="text-[13px] text-steel">{customLabel}</label>
          <Input id={inputId} value={value} onChange={(e) => onChange(e.target.value)} placeholder={customPlaceholder} maxLength={maxLength} autoComplete="off" />
        </div>
      )}
    </div>
  );
}
