'use client';

import * as React from 'react';
import { Check, ChevronDown } from 'lucide-react';
import { cn } from '@/utils/helper';
import { Portal } from './portal';

export interface SelectOption {
  value: string;
  label: React.ReactNode;
  disabled?: boolean;
  isSelectable?: boolean;
  className?: string;
}

export interface SelectProps {
  /** Options to display (array version) */
  options?: SelectOption[];
  /** Children (alternative to options array) */
  children?: React.ReactNode;
  /** Currently selected value */
  value?: string;
  /** Callback when value changes */
  onChange?: (event: { target: { value: string; name?: string } } | any) => void;
  /** Name of the field */
  name?: string;
  /** Placeholder text */
  placeholder?: string;
  /** Label for the select */
  label?: string;
  /** Helper text */
  helperText?: string;
  /** Error message */
  errorMessage?: string;
  /** Whether the select is disabled */
  disabled?: boolean;
  /** Full width */
  fullWidth?: boolean;
  /** Custom class name */
  className?: string;
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Whether there is an error */
  error?: boolean;
  /** MUI-style MenuProps */
  MenuProps?: any;
  /** MUI-style native select */
  native?: boolean;
  /** Custom render function for the selected value */
  renderValue?: (value: string) => React.ReactNode;
  /** Whether the select is open (controlled) */
  open?: boolean;
  /** Callback when select opens */
  onOpen?: () => void;
  /** Callback when select closes */
  onClose?: () => void;
}

const sizeClasses = {
  sm: 'h-8 text-xs',
  md: 'h-10 text-sm',
  lg: 'h-12 text-base',
};

function Select({
  options = [],
  children,
  value,
  onChange,
  placeholder = 'Select an option',
  label,
  helperText,
  errorMessage,
  disabled = false,
  fullWidth = false,
  className,
  size = 'md',
  error,
  renderValue,
  name,
  open: controlledOpen,
  onOpen,
  onClose,
}: SelectProps) {
  const [internalIsOpen, setInternalIsOpen] = React.useState(false);
  const isOpen = controlledOpen !== undefined ? controlledOpen : internalIsOpen;

  const setIsOpen = (value: boolean) => {
    if (value) {
      onOpen?.();
    } else {
      onClose?.();
    }
    setInternalIsOpen(value);
  };
  const [highlightedIndex, setHighlightedIndex] = React.useState(-1);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const listRef = React.useRef<HTMLUListElement>(null);

  // If children are provided instead of options array
  const derivedOptions = React.useMemo(() => {
    if (options.length > 0) {
      return options.map((opt) => ({
        ...opt,
        isSelectable: opt.isSelectable !== undefined ? opt.isSelectable : true,
      }));
    }
    if (!children) return [];

    return React.Children.toArray(children)
      .filter((child): child is React.ReactElement => React.isValidElement(child))
      .map((child: any) => ({
        value: child.props.value,
        label: child.props.children,
        disabled: child.props.disabled,
        isSelectable: child.props.value !== undefined,
        className: child.props.className,
      }));
  }, [options, children]);

  const selectedOption = derivedOptions.find((opt) => opt.value === value);
  const hasError = !!errorMessage || error;

  // Close on click outside
  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      const isInsideContainer = containerRef.current?.contains(target);
      const isInsideDropdown = listRef.current?.contains(target);
      // Close if the click is outside both the container and the portal dropdown
      if (!isInsideContainer && !isInsideDropdown) {
        setIsOpen(false);
      }
    };

    const handleScroll = (e: Event) => {
      if (isOpen && listRef.current && listRef.current.contains(e.target as Node)) {
        return;
      }
      if (isOpen) setIsOpen(false);
    };

    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('scroll', handleScroll, true); // Capture scroll events from any container
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('scroll', handleScroll, true);
    };
  }, [isOpen]);

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;

    switch (e.key) {
      case 'Enter':
      case ' ':
        e.preventDefault();
        if (isOpen && highlightedIndex >= 0) {
          const option = derivedOptions[highlightedIndex];
          if (!option.disabled) {
            onChange?.({ target: { value: option.value, name } });
            setIsOpen(false);
          }
        } else {
          setIsOpen(true);
        }
        break;
      case 'ArrowDown':
        e.preventDefault();
        if (!isOpen) {
          setIsOpen(true);
        } else {
          setHighlightedIndex((prev) =>
            prev < derivedOptions.length - 1 ? prev + 1 : prev
          );
        }
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : prev));
        break;
      case 'Escape':
        setIsOpen(false);
        break;
    }
  };

  return (
    <div
      className={cn('relative', fullWidth && 'w-full', className)}
      ref={containerRef}
    >
      {label && (
        <label className="mb-1.5 block text-sm font-medium text-neutral-700">
          {label}
        </label>
      )}

      {/* Trigger */}
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        className={cn(
          'flex w-full items-center justify-between gap-2 rounded-lg border px-3',
          'transition-colors duration-200',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500',
          sizeClasses[size],
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
        <span className={cn((!selectedOption && !value) && 'text-neutral-400', 'truncate')}>
          {renderValue && value
            ? renderValue(value)
            : selectedOption?.label || placeholder}
        </span>
        <ChevronDown
          className={cn(
            'h-4 w-4 text-neutral-500 transition-transform',
            isOpen && 'rotate-180'
          )}
        />
      </button>

      {/* Dropdown */}
      {/* Dropdown */}
      {isOpen && (
        <Portal>
          <ul
            ref={listRef}
            style={{
              position: 'fixed',
              top: `${containerRef.current ? containerRef.current.getBoundingClientRect().bottom + 4 : 0}px`,
              left: `${containerRef.current ? containerRef.current.getBoundingClientRect().left : 0}px`,
              width: `${containerRef.current ? containerRef.current.getBoundingClientRect().width : 0}px`,
              zIndex: 9999,
            }}
            className={cn(
              'overflow-auto rounded-lg border border-neutral-200',
              'bg-white shadow-lg',
              'max-h-[250px]'
            )}
          >
            {derivedOptions.map((option, index) => {
              if (!option.isSelectable) {
                return <div key={index}>{option.label}</div>;
              }

              return (
                <li
                  key={option.value || index}
                  onMouseDown={(e) => {
                    // Use onMouseDown to prevent blur from happening before click
                    e.preventDefault();
                    e.stopPropagation();
                    if (!option.disabled) {
                      onChange?.({ target: { value: option.value, name } });
                      setIsOpen(false);
                    }
                  }}
                  onMouseEnter={() => setHighlightedIndex(index)}
                  className={cn(
                    'flex items-center justify-between px-3 py-3 min-h-[44px] cursor-pointer transition-colors',
                    option.disabled
                      ? 'opacity-50 cursor-not-allowed'
                      : highlightedIndex === index
                        ? 'bg-primary-50'
                        : 'hover:bg-neutral-50',
                    option.value === value && 'text-primary-500',
                    option.className
                  )}
                >
                  <div className="flex-1 truncate">{option.label}</div>
                  {option.value === value && (
                    <Check className="h-4 w-4 text-primary-500" />
                  )}
                </li>
              );
            })}
          </ul>
        </Portal>
      )}

      {/* Helper/Error text */}
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

export { Select };
