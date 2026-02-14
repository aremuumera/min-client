'use client';

import * as React from 'react';
import { Search, X, ChevronDown, Check } from 'lucide-react';
import { Box } from './box';
import { MenuItem } from './menu';
import { Checkbox } from './checkbox';
import { TextField } from './input';
import { cn } from '@/utils/helper';
import { Portal } from './portal';

export interface MultiCheckboxSelectOption {
    value: string;
    label: string;
}

export interface MultiCheckboxSelectProps {
    label?: string;
    options: MultiCheckboxSelectOption[];
    value: string[];
    onChange: (value: string[]) => void;
    placeholder?: string;
    searchPlaceholder?: string;
    errorMessage?: string;
    helperText?: string;
    disabled?: boolean;
    fullWidth?: boolean;
    className?: string;
}

export function MultiCheckboxSelect({
    label,
    options,
    value = [],
    onChange,
    placeholder = 'Select options...',
    searchPlaceholder = 'Search...',
    errorMessage,
    helperText,
    disabled = false,
    fullWidth = false,
    className,
}: MultiCheckboxSelectProps) {
    const [isOpen, setIsOpen] = React.useState(false);
    const [searchTerm, setSearchTerm] = React.useState('');
    const containerRef = React.useRef<HTMLDivElement>(null);

    const filteredOptions = options.filter((option) =>
        option.label.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleToggle = (optionValue: string) => {
        const newValue = value.includes(optionValue)
            ? value.filter((v) => v !== optionValue)
            : [...value, optionValue];
        onChange(newValue);
    };

    const handleClear = (e: React.MouseEvent) => {
        e.stopPropagation();
        onChange([]);
    };

    // Close on click outside
    React.useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const hasError = !!errorMessage;

    return (
        <div className={cn('relative', fullWidth && 'w-full', className)} ref={containerRef}>
            {label && (
                <label className="mb-1.5 block text-sm font-medium text-neutral-700">
                    {label}
                </label>
            )}

            {/* Trigger */}
            <button
                type="button"
                onClick={() => !disabled && setIsOpen(!isOpen)}
                disabled={disabled}
                className={cn(
                    'flex min-h-[40px] w-full items-center justify-between gap-2 rounded-lg border px-3 py-2',
                    'transition-colors duration-200 text-left',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500',
                    hasError
                        ? 'border-error-500'
                        : isOpen
                            ? 'border-primary-500'
                            : 'border-neutral-200',
                    disabled
                        ? 'cursor-not-allowed opacity-50 bg-neutral-50'
                        : 'hover:border-neutral-300'
                )}
            >
                <div className="flex-1 min-w-0">
                    {value.length > 0 ? (
                        <span className="block truncate text-sm text-neutral-900">
                            {value.map(v => options.find(opt => opt.value === v)?.label || v).join(', ')}
                        </span>
                    ) : (
                        <span className="block truncate text-sm text-neutral-400">{placeholder}</span>
                    )}
                </div>
                <div className="flex items-center gap-1 shrink-0">
                    {value.length > 0 && !disabled && (
                        <X
                            className="h-4 w-4 text-neutral-400 hover:text-neutral-600"
                            onClick={handleClear}
                        />
                    )}
                    <ChevronDown
                        className={cn(
                            'h-4 w-4 text-neutral-500 transition-transform',
                            isOpen && 'rotate-180'
                        )}
                    />
                </div>
            </button>

            {/* Dropdown */}
            {isOpen && (
                <Portal>
                    <div
                        style={{
                            position: 'fixed',
                            top: `${containerRef.current ? containerRef.current.getBoundingClientRect().bottom + 4 : 0}px`,
                            left: `${containerRef.current ? containerRef.current.getBoundingClientRect().left : 0}px`,
                            width: `${containerRef.current ? containerRef.current.getBoundingClientRect().width : 0}px`,
                        }}
                        className={cn(
                            'z-[9999] overflow-hidden rounded-lg border border-neutral-200',
                            'bg-white shadow-lg'
                        )}
                    >
                        <Box className="sticky top-0 z-10 bg-white border-b border-neutral-200 p-2">
                            <TextField
                                fullWidth
                                inputSize="sm"
                                placeholder={searchPlaceholder}
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                autoFocus
                                onClick={(e) => e.stopPropagation()}
                                onKeyDown={(e) => e.stopPropagation()}
                                startAdornment={<Search className="h-4 w-4 text-neutral-400 mr-2" />}
                            />
                        </Box>
                        <ul className="max-h-[300px] overflow-auto py-1">
                            {filteredOptions.length > 0 ? (
                                filteredOptions.map((option) => (
                                    <li
                                        key={option.value}
                                        onClick={() => handleToggle(option.value)}
                                        className={cn(
                                            'flex items-center gap-3 px-3 py-2 cursor-pointer transition-colors hover:bg-neutral-50',
                                            value.includes(option.value) && 'bg-primary-50'
                                        )}
                                    >
                                        <Checkbox
                                            checked={value.includes(option.value)}
                                            onChange={() => { }} // Controlled by li click
                                            className="pointer-events-none"
                                        />
                                        <span className={cn(
                                            'text-sm flex-1 truncate',
                                            value.includes(option.value) ? 'text-primary-600 font-medium' : 'text-neutral-700'
                                        )}>
                                            {option.label}
                                        </span>
                                    </li>
                                ))
                            ) : (
                                <Box className="p-4 text-center text-sm text-neutral-500">
                                    No results found
                                </Box>
                            )}
                        </ul>
                    </div>
                </Portal>
            )}

            {/* Error/Helper Text */}
            {(helperText || errorMessage) && (
                <p
                    className={cn(
                        'mt-1.5 text-xs',
                        hasError ? 'text-error-500' : 'text-neutral-500'
                    )}
                >
                    {errorMessage || helperText}
                </p>
            )}
        </div>
    );
}
