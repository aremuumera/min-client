"use client";

import React, { useState, useEffect, useRef } from "react";
import Flag from "react-world-flags";
import { getCountryTelCode } from "@/utils/countries-state";
import { ChevronDown, Phone, Check } from "lucide-react";
import { cn } from "@/utils/helper";

interface PhoneNumberInputProps {
  name: string;
  _number?: string;
  country: string;
  options?: Array<{ label: string; value: string }>;
  onChange: (formattedNumber: string, countryCode: string, countryName: string) => void;
  placeholder?: string;
  isInValid?: boolean;
  borderColor?: string;
  className?: string;
  [key: string]: any;
}

export default function PhoneNumberInput({
  name,
  _number = "",
  country,
  options = [],
  onChange,
  placeholder,
  isInValid,
  borderColor,
  className,
  ...rest
}: PhoneNumberInputProps) {
  const [number, setNumber] = useState(_number || "");
  const [selectedCountry, setSelectedCountry] = useState(country);
  const [countryCode, setCountryCode] = useState(getCountryTelCode(country) || "");
  const [countryName, setCountryName] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setSelectedCountry(country);
    setCountryCode(getCountryTelCode(country) || "");
    const foundCountry = options.find((option) => option.value === country);
    setCountryName(foundCountry?.label || "");
  }, [country, options]);

  useEffect(() => {
    setNumber(_number);
  }, [_number]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleCountrySelect = (value: string) => {
    const code = getCountryTelCode(value) || "";
    const selectedCountryName = options.find((option) => option.value === value)?.label || "";
    setCountryCode(code);
    setSelectedCountry(value);
    setCountryName(selectedCountryName);
    onChange(number, code, selectedCountryName);
    setIsDropdownOpen(false);
  };

  const onPhoneNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setNumber(value);
    onChange(value, countryCode, countryName);
  };

  return (
    <div className={cn("w-full relative", isDropdownOpen && "z-10", className)} {...rest}>
      <div
        className={cn(
          "flex items-center w-full h-11 rounded-lg border bg-transparent transition-all",
          isInValid ? "border-red-500" : "border-gray-300 focus-within:ring-1 focus-within:ring-green-500",
        )}
        style={borderColor ? { borderColor } : {}}
      >
        {/* Country Selector */}
        <div className="relative flex items-center h-full" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center h-full px-3 gap-2 border-r border-gray-200 bg-gray-50/50 hover:bg-gray-100 transition-colors group rounded-l-lg"
          >
            {selectedCountry ? (
              <Flag className="w-6 h-4 object-cover rounded-[1px] shadow-sm" code={selectedCountry} />
            ) : (
              <Phone size={14} className="text-gray-400" />
            )}
            <ChevronDown size={14} className={cn("text-gray-400 transition-transform", isDropdownOpen && "rotate-180")} />
          </button>

          {isDropdownOpen && (
            <div className="absolute top-full left-0 mt-1 z-50 w-64 max-h-60 overflow-y-auto rounded-lg border border-neutral-200 bg-white shadow-lg animate-in fade-in zoom-in-95 duration-200">
              <div className="p-1">
                {options.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => handleCountrySelect(option.value)}
                    className={cn(
                      "flex items-center justify-between w-full px-3 h-11 text-sm rounded-md transition-colors",
                      selectedCountry === option.value ? "bg-green-50 text-green-700 font-medium" : "text-neutral-700 hover:bg-neutral-50"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <Flag className="w-5 h-3 object-cover rounded-[1px]" code={option.value} />
                      <span className="truncate max-w-[140px] text-left">{option.label}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-neutral-400">{getCountryTelCode(option.value)}</span>
                      {selectedCountry === option.value && <Check size={14} className="text-green-600" />}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Input */}
        <div className="flex-grow flex items-center px-3 gap-2 h-full rounded-r-lg">
          {countryCode && (
            <span className="text-sm font-medium text-gray-500 whitespace-nowrap">
              {countryCode}
            </span>
          )}
          <input
            id={name}
            name={name}
            type="number"
            value={number}
            onChange={onPhoneNumberChange}
            placeholder={placeholder}
            className="
              w-full 
              h-full 
              bg-transparent 
              text-sm
              border-0! 
              ring-0!
              outline-none!
              focus:ring-0!
              focus:outline-none!
              [&::-webkit-outer-spin-button]:appearance-none 
              [&::-webkit-inner-spin-button]:appearance-none
              appearance-none
              rounded-r-lg
            "
          />
        </div>
      </div>
    </div>
  );
}
