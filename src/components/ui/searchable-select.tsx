'use client';

import * as React from 'react';
import { Search, X } from 'lucide-react';
import { Select, SelectProps } from './select';
import { TextField } from './input';
import { Box } from './box';
import { MenuItem } from './menu';
import { FormControl } from './form-control';
import { cn } from '@/utils/helper';

interface SearchableSelectProps extends Omit<SelectProps, 'options'> {
    options: { value: string; label: string;[key: string]: any }[];
    placeholder?: string;
    searchPlaceholder?: string;
}

export function SearchableSelect({
    options,
    value,
    onChange,
    label,
    placeholder = 'Select...',
    searchPlaceholder = 'Search...',
    errorMessage,
    helperText,
    disabled,
    fullWidth,
    className,
    ...props
}: SearchableSelectProps) {
    const [searchTerm, setSearchTerm] = React.useState('');
    const [isOpen, setIsOpen] = React.useState(false);

    const filteredOptions = options.filter((option) =>
        option.label.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleOpen = () => {
        setIsOpen(true);
        setSearchTerm('');
    };

    const handleClose = () => {
        setIsOpen(false);
        setSearchTerm('');
    };

    return (
        <Select
            {...props}
            label={label}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            errorMessage={errorMessage}
            helperText={helperText}
            disabled={disabled}
            fullWidth={fullWidth}
            className={className}
            open={isOpen}
            onOpen={handleOpen}
            onClose={handleClose}
            renderValue={(selected) => {
                const option = options.find((opt) => opt.value === selected);
                return option ? option.label : selected;
            }}
        >
            <Box className="sticky top-0 z-10 bg-white border-b  border-neutral-200  p-2">
                <TextField
                    fullWidth
                    placeholder={searchPlaceholder}
                    value={searchTerm}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
                    autoFocus
                    // Prevent select from closing when clicking the search input
                    onClick={(e: React.MouseEvent) => e.stopPropagation()}
                    onKeyDown={(e: React.KeyboardEvent) => e.stopPropagation()}
                    startAdornment={<Search className="h-4 w-4 text-neutral-400 mr-2" />}
                    endAdornment={
                        searchTerm && (
                            <button
                                type="button"
                                onClick={(e: React.MouseEvent) => {
                                    e.stopPropagation();
                                    setSearchTerm('');
                                }}
                                className="p-1 hover:bg-neutral-100 rounded-full"
                            >
                                <X className="h-3 w-3 text-neutral-400" />
                            </button>
                        )
                    }
                />
            </Box>
            {filteredOptions.length > 0 ? (
                filteredOptions.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                        {option.label}
                    </MenuItem>
                ))
            ) : (
                <Box className="p-4 text-center text-sm text-neutral-500">
                    No results found
                </Box>
            )}
        </Select>
    );
}
