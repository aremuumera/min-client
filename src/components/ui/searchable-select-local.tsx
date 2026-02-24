import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Portal } from '@/components/ui/portal';

export const SearchableSelectLocal = ({ options, value, onChange, label, placeholder, searchPlaceholder }: any) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const containerRef = useRef<HTMLDivElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const filteredOptions = options.filter((option: any) => {
        const searchStr = (option.label || option.name || (typeof option === 'string' ? option : '')).toLowerCase();
        return searchStr.includes(searchTerm.toLowerCase());
    });

    const handleSelect = (optionValue: any) => {
        onChange(optionValue);
        setIsOpen(false);
        setSearchTerm('');
    };

    useEffect(() => {
        const handleOutsideInteraction = (e: Event) => {
            if (!isOpen) return;
            const target = e.target as Node;

            if (e.type === 'scroll' && dropdownRef.current && dropdownRef.current.contains(target)) {
                return;
            }

            if (
                containerRef.current && !containerRef.current.contains(target) &&
                (!dropdownRef.current || !dropdownRef.current.contains(target))
            ) {
                setIsOpen(false);
            } else if (e.type === 'scroll') {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleOutsideInteraction);
            document.addEventListener('scroll', handleOutsideInteraction, true);
        }

        return () => {
            document.removeEventListener('mousedown', handleOutsideInteraction);
            document.removeEventListener('scroll', handleOutsideInteraction, true);
        };
    }, [isOpen]);

    const selectedOption = options.find((opt: any) => opt.value === value || opt.isoCode === value || opt === value);
    const displayValue = selectedOption ? (selectedOption.label || selectedOption.name || selectedOption.value || selectedOption) : value;

    return (
        <div className="relative w-full" ref={containerRef}>
            {label && <label className="mb-1.5 block text-sm font-medium text-neutral-700">{label}</label>}
            <div
                onClick={() => setIsOpen(!isOpen)}
                className="flex min-h-[42px] w-full cursor-pointer items-center justify-between gap-2 rounded-lg border border-neutral-200 bg-white px-3 py-2 transition-all hover:border-neutral-300 focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
            >
                <span className={`truncate text-sm ${!displayValue ? 'text-neutral-400' : 'text-neutral-900'}`}>
                    {displayValue || placeholder || 'Select...'}
                </span>
                <ChevronDown size={18} className={`text-neutral-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
            </div>

            <AnimatePresence>
                {isOpen && (
                    <Portal>
                        <motion.div
                            ref={dropdownRef}
                            initial={{ opacity: 0, y: -4 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -4 }}
                            transition={{ duration: 0.15 }}
                            style={{
                                position: 'fixed',
                                top: `${containerRef.current?.getBoundingClientRect().bottom! + 4}px`,
                                left: `${containerRef.current?.getBoundingClientRect().left}px`,
                                width: `${containerRef.current?.getBoundingClientRect().width}px`,
                                zIndex: 9999
                            }}
                            className="overflow-hidden rounded-lg border border-neutral-200 bg-white shadow-xl"
                        >
                            <div className="sticky top-0 z-10 border-b border-neutral-100 bg-white p-2">
                                <div className="relative">
                                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                                    <input
                                        type="text"
                                        className="w-full rounded-md border border-neutral-200 bg-neutral-50 py-1.5 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                                        placeholder={searchPlaceholder || "Search..."}
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        onClick={(e) => e.stopPropagation()}
                                        autoFocus
                                    />
                                </div>
                            </div>
                            <ul className="max-h-[250px] overflow-auto py-1">
                                {filteredOptions.length > 0 ? (
                                    filteredOptions.map((option: any, index: number) => {
                                        const optValue = option.value || option.isoCode || option;
                                        const isSelected = optValue === value;
                                        return (
                                            <li
                                                key={optValue || index}
                                                onClick={() => handleSelect(optValue)}
                                                className={`px-3 py-2 text-sm cursor-pointer transition-colors hover:bg-neutral-50 ${isSelected ? 'bg-primary-50 text-primary-600 font-medium' : 'text-neutral-700'}`}
                                            >
                                                {option.label || option.name || option.value || option}
                                            </li>
                                        );
                                    })
                                ) : (
                                    <li className="px-3 py-6 text-center text-sm text-neutral-400">No results found</li>
                                )}
                            </ul>
                        </motion.div>
                    </Portal>
                )}
            </AnimatePresence>
        </div>
    );
};
