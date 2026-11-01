'use client';

import * as React from 'react';
import { Select } from './select';
import { SearchableSelect } from './searchable-select';

export interface DropdownSelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface DropdownSelectProps {
  id?: string;
  value?: string;
  options: readonly DropdownSelectOption[];
  /** First option with an empty value ("All", "None"…) */
  placeholder?: string;
  onValueChange: (value: string) => void;
  disabled?: boolean;
  error?: boolean;
  /** Search box in the list. Default: on for lists longer than 8 */
  searchable?: boolean;
  className?: string;
  'aria-label'?: string;
  'aria-invalid'?: boolean;
  'aria-describedby'?: string;
}

/** Our dropdown for a list of values: search appears on its own for long lists. Works inside FormField */
export function DropdownSelect({ options, placeholder, onValueChange, searchable, ...props }: DropdownSelectProps) {
  const all = [...(placeholder !== undefined ? [{ value: '', label: placeholder }] : []), ...options];
  const shared = { ...props, value: props.value ?? '', placeholder: placeholder ?? 'Select…', fullWidth: true, onChange: (e: { target: { value: string } }) => onValueChange(e.target.value) };
  return searchable ?? options.length > 8 ? <SearchableSelect {...shared} options={all} /> : <Select {...shared} options={all} />;
}
