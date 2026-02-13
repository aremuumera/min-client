'use client';

import React, { useState, useEffect } from 'react';
import { Box } from '@/components/ui/box';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Option } from '@/components/core/option';
import { getCountryTelCode, countryOptions } from '@/utils/CountriesState';

interface PhoneNumberInputProps {
  name?: string;
  value?: string;
  _number?: string;
  country?: string;
  options?: Array<{ label: string; value: string }>;
  onChange?: (formattedNumber: string, code: string, countryName: string) => void;
  placeholder?: string;
  isInValid?: boolean;
  borderColor?: string;
  className?: string;
  sx?: React.CSSProperties;
}

export default function PhoneNumberInput({
  name = 'phone',
  _number = '',
  country = 'NGA',
  options = countryOptions,
  onChange,
  placeholder = 'Enter phone number',
  isInValid,
  borderColor,
  className,
  ...rest
}: PhoneNumberInputProps) {
  const [number, setNumber] = useState(_number || '');
  const [selectedCountry, setSelectedCountry] = useState(country);
  const [countryCode, setCountryCode] = useState(getCountryTelCode(country) || '');
  const [countryName, setCountryName] = useState('');

  useEffect(() => {
    setSelectedCountry(country);
    setCountryCode(getCountryTelCode(country) || '');
    const foundCountry = options.find((option) => option.value === country);
    setCountryName(foundCountry?.label || '');
  }, [country, options]);

  useEffect(() => {
    setNumber(_number);
  }, [_number]);

  const onCountryChange = (value: string) => {
    const code = getCountryTelCode(value || '');
    const selectedCountryName = options.find((option) => option.value === value)?.label || '';
    setCountryCode(code || '');
    setSelectedCountry(value);
    setCountryName(selectedCountryName);
    onChange?.(number, code || '', selectedCountryName);
  };

  const onPhoneNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setNumber(value);
    onChange?.(value, countryCode, countryName);
  };

  return (
    <Box className={`flex items-center gap-2 ${className || ''}`} {...rest}>
      <Select
        value={selectedCountry}
        onChange={(e) => onCountryChange(e.target.value)}
        className="w-28 shrink-0"
      >
        <Option value="" disabled>Select</Option>
        {options.map((option, idx) => (
          <Option key={idx} value={option.value}>
            {option.value} ({getCountryTelCode(option.value)})
          </Option>
        ))}
      </Select>
      <div className="flex items-center flex-1 gap-2">
        <span className="text-sm text-gray-500 whitespace-nowrap">{countryCode}</span>
        <Input
          id={`${name}-${Math.random()}`}
          name={name}
          type="tel"
          value={number}
          onChange={onPhoneNumberChange}
          placeholder={placeholder}
          error={isInValid}
          fullWidth
          className="flex-1"
        />
      </div>
    </Box>
  );
}
