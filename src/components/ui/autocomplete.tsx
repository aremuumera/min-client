'use client';

import * as React from 'react';
import { cn } from '@/utils/helper';
import { Input } from './input';
import { Search, X, Check } from 'lucide-react';

export interface AutocompleteOption {
  label: string;
  value: string | number;
  [key: string]: any;
}

export interface AutocompleteProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onChange'> {
  /** Options to display */
  options: AutocompleteOption[];
  /** Current value */
  value?: AutocompleteOption | null;
  /** Callback when value changes */
  onChange?: (value: AutocompleteOption | null) => void;
  /** Placeholder text */
  placeholder?: string;
  /** Label for the input */
  label?: string;
  /** Loading state */
  loading?: boolean;
  /** Error message */
  errorMessage?: string;
  /** Whether to show search icon */
  showSearchIcon?: boolean;
}

function Autocomplete({
  className,
  options,
  value,
  onChange,
  placeholder = 'Select...',
  label,
  loading = false,
  errorMessage,
  showSearchIcon = true,
  ...props
}: AutocompleteProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [inputValue, setInputValue] = React.useState(value?.label || '');
  const [filteredOptions, setFilteredOptions] = React.useState(options);
  const containerRef = React.useRef<HTMLDivElement>(null);

  // Update input value when selection changes
  React.useEffect(() => {
    setInputValue(value?.label || '');
  }, [value]);

  // Filter options based on input
  React.useEffect(() => {
    const filtered = options.filter((option) =>
      option.label.toLowerCase().includes(inputValue.toLowerCase())
    );
    setFilteredOptions(filtered);
  }, [inputValue, options]);

  // Handle click outside to close
  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        // Reset input to selected value's label if not focused
        setInputValue(value?.label || '');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [value]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
    if (!isOpen) setIsOpen(true);
  };

  const handleOptionSelect = (option: AutocompleteOption) => {
    onChange?.(option);
    setInputValue(option.label);
    setIsOpen(false);
  };

  const handleClear = () => {
    onChange?.(null);
    setInputValue('');
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className={cn('relative w-full', className)} {...props}>
      <Input
        label={label}
        placeholder={placeholder}
        value={inputValue}
        onChange={handleInputChange}
        onFocus={() => setIsOpen(true)}
        errorMessage={errorMessage}
        startAdornment={showSearchIcon && <Search className="h-4 w-4 text-neutral-400" />}
        endAdornment={
          <div className="flex items-center gap-1">
            {inputValue && (
              <button
                type="button"
                onClick={handleClear}
                className="p-1 hover:bg-neutral-100 rounded-full transition-colors"
              >
                <X className="h-3 w-3 text-neutral-400" />
              </button>
            )}
            {loading && (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-500 border-t-transparent" />
            )}
          </div>
        }
      />

      {isOpen && (
        <div className="absolute z-50 mt-1 w-full max-h-60 overflow-auto rounded-lg border border-neutral-200 bg-white py-1 shadow-lg">
          {filteredOptions.length > 0 ? (
            filteredOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                className={cn(
                  'flex w-full items-center justify-between px-4 h-11 text-sm transition-colors hover:bg-neutral-50',
                  option.value === value?.value ? 'bg-primary-50 text-primary-500 font-medium' : 'text-neutral-700'
                )}
                onClick={() => handleOptionSelect(option)}
              >
                {option.label}
                {option.value === value?.value && <Check className="h-4 w-4" />}
              </button>
            ))
          ) : (
            <div className="px-4 py-2 text-sm text-neutral-500">No results found</div>
          )}
        </div>
      )}
    </div>
  );
}

export { Autocomplete };
