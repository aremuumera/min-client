'use client';

import React from 'react';
import { Input } from '@/components/ui/input';
import { FormLabel } from '@/components/ui/form-control';

interface CustomDatePickerProps {
  label?: string;
  value: string | Date | null;
  onChange: (date: string | null) => void;
  error?: boolean;
  fullWidth?: boolean;
  placeholder?: string;
  sx?: React.CSSProperties;
  className?: string;
}

const CustomDatePicker = ({ 
  label, 
  value, 
  onChange, 
  error, 
  fullWidth, 
  placeholder,
  className,
  ...rest 
}: CustomDatePickerProps) => {
  // Convert Date to string if needed
  const dateValue = value instanceof Date 
    ? value.toISOString().split('T')[0] 
    : value || '';

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(newValue || null);
  };

  return (
    <div className={`${fullWidth ? 'w-full' : ''} ${className || ''}`}>
      {label && (
        <FormLabel className="pb-1">{label}</FormLabel>
      )}
      <Input
        type="date"
        value={dateValue}
        onChange={handleChange}
        placeholder={placeholder}
        error={error}
        fullWidth={fullWidth}
        {...rest}
      />
    </div>
  );
};

export default CustomDatePicker;
