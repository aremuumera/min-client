import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Portal } from '@/components/ui/portal';
import { Checkbox } from '@/components/ui/checkbox';

export const MultiCheckboxSelectLocal = ({ options, value = [], onChange, label, placeholder, searchPlaceholder }: any) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const containerRef = useRef<HTMLDivElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const filteredOptions = options.filter((option: any) => {
        const searchStr = (option.label || option.name || (typeof option === 'string' ? option : '')).toLowerCase();
        return searchStr.includes(searchTerm.toLowerCase());
    });

    const safeValue = Array.isArray(value) ? value : [];

    const handleToggle = (optionValue: any) => {
        const newValue = safeValue.includes(optionValue)
            ? safeValue.filter((v: any) => v !== optionValue)
            : [...safeValue, optionValue];
        onChange(newValue);
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

    const getDisplayValue = () => {
        if (!safeValue || safeValue.length === 0) return placeholder || 'Select...';
        const labels = safeValue.map((v: any) => {
            const option = options.find((opt: any) => opt.value === v || opt.isoCode === v || opt === v);
            return option ? (option.label || option.name || option.value || option) : v;
        });

        if (labels.length === 1) return labels[0];
        if (labels.length > 2) return `${labels.length} items selected`;
        return labels.join(', ');
    };

    return (
        <div className="relative w-full" ref={containerRef}>
            {label && <label className="mb-1.5 block text-sm font-medium text-neutral-700">{label}</label>}
            <div
                onClick={() => setIsOpen(!isOpen)}
                className="flex min-h-[42px] w-full cursor-pointer items-center justify-between gap-2 rounded-lg border border-neutral-200 bg-white px-3 py-2 transition-all hover:border-neutral-300 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 overflow-hidden"
            >
                <span className={`truncate text-sm flex-1 ${!safeValue?.length ? 'text-neutral-400' : 'text-neutral-900'}`}>
                    {getDisplayValue()}
                </span>
                <ChevronDown size={18} className={`shrink-0 text-neutral-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
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
                                        const isSelected = safeValue.includes(optValue);
                                        return (
                                            <li
                                                key={optValue || index}
                                                onClick={() => handleToggle(optValue)}
                                                className={`flex items-center gap-3 px-3 py-2 text-sm cursor-pointer transition-colors hover:bg-neutral-50 ${isSelected ? 'bg-primary-50' : ''}`}
                                            >
                                                <Checkbox checked={isSelected} readOnly className="pointer-events-none" />
                                                <span className={`truncate ${isSelected ? 'text-primary-600 font-medium' : 'text-neutral-700'}`}>
                                                    {option.label || option.name || option.value || option}
                                                </span>
                                            </li>
                                        );
                                    })
                                ) : (
                                    <li className="px-3 py-6 text-center text-sm text-neutral-400">No results found</li>
                                )}
                            </ul>
                            {safeValue.length > 0 && (
                                <div className="border-t border-neutral-100 p-2 text-center">
                                    <button
                                        type="button"
                                        onClick={() => onChange([])}
                                        className="text-xs font-medium text-primary-600 hover:text-primary-700"
                                    >
                                        Clear Selections
                                    </button>
                                </div>
                            )}
                        </motion.div>
                    </Portal>
                )}
            </AnimatePresence>
        </div >
    );
};
