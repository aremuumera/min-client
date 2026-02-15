
"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronDown, ChevronRight, ExternalLink, X } from 'lucide-react';
import { cn } from '@/utils/helper';
import { Logo } from '@/utils/logo';
import { icons } from './nav-icons';
import { isNavItemActive } from '@/lib/is-nav-item-active';
import { NavItemConfig } from '@/config/dashboard-config';

import { Portal } from '@/components/ui/portal';
import { motion, AnimatePresence } from 'framer-motion';

export interface MobileNavProps {
    items?: NavItemConfig[];
    open?: boolean;
    onClose: () => void;
}

export function MobileNav({ items = [], open, onClose }: MobileNavProps) {
    const pathname = usePathname();

    return (
        <Portal>
            <AnimatePresence>
                {open && (
                    <div className="fixed inset-0 z-200 lg:hidden">
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-black/60 backdrop-blur-sm z-201"
                            onClick={onClose}
                        />

                        {/* Sidebar */}
                        <motion.div
                            initial={{ x: '-100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '-100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                            className="absolute left-0 top-0 bottom-0 w-80 bg-black text-white flex flex-col shadow-2xl z-202"
                        >
                            <div className="flex items-center justify-between p-6 border-b border-white/10">
                                <Logo color="light" height={40} />
                                <button onClick={onClose} className="p-2 text-white/60 hover:text-white transition-colors">
                                    <X size={24} />
                                </button>
                            </div>

                            <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-8 scroll-smooth scrollbar-hide">
                                {items.map((group) => (
                                    <div key={group.key} className="space-y-3">
                                        {group.title && (
                                            <h3 className="px-4 text-xs font-bold text-neutral-500 uppercase tracking-wider">
                                                {group.title}
                                            </h3>
                                        )}
                                        <ul className="space-y-1">
                                            {group.items?.map((item) => (
                                                <NavItem
                                                    key={item.key}
                                                    item={item}
                                                    pathname={pathname}
                                                    onClose={onClose}
                                                    depth={0}
                                                />
                                            ))}
                                        </ul>
                                    </div>
                                ))}
                            </nav>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </Portal>
    );
}

function NavItem({
    item,
    pathname,
    onClose,
    depth
}: {
    item: NavItemConfig;
    pathname: string;
    onClose: () => void;
    depth: number;
}) {
    const hasChildren = item.items && item.items.length > 0;

    // Automatically expand if a child item is active
    const forceOpen = hasChildren
        ? item.items?.some(child => isNavItemActive({ ...child, pathname }))
        : false;

    const [isOpen, setIsOpen] = useState(forceOpen);
    const active = isNavItemActive({ ...item, pathname });
    const Icon = item.icon ? icons[item.icon] : null;

    const content = (
        <div className={cn(
            "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group relative",
            active
                ? "bg-green-600 text-white font-semibold shadow-lg shadow-green-600/20"
                : "text-neutral-400 hover:text-white hover:bg-white/5",
            item.disabled && "opacity-50 cursor-not-allowed"
        )}>
            {Icon && (
                <div className={cn(
                    "shrink-0 transition-transform duration-200",
                    active ? "scale-110" : "group-hover:scale-110"
                )}>
                    <Icon size={20} strokeWidth={active ? 2.5 : 2} />
                </div>
            )}
            <span className="grow text-sm">{item.title}</span>
            {item.external && <ExternalLink size={14} className="opacity-50" />}
            {hasChildren && (
                <div className={cn("transition-transform duration-200", isOpen && "rotate-180")}>
                    <ChevronDown size={14} className="opacity-50" />
                </div>
            )}
        </div>
    );

    if (hasChildren) {
        return (
            <li className="space-y-1">
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="w-full text-left outline-none"
                    disabled={item.disabled}
                >
                    {content}
                </button>
                {isOpen && (
                    <ul className="ml-4 pl-4 border-l border-white/10 mt-1 space-y-1">
                        {item.items?.map((child) => (
                            <NavItem
                                key={child.key}
                                item={child}
                                pathname={pathname}
                                onClose={onClose}
                                depth={depth + 1}
                            />
                        ))}
                    </ul>
                )}
            </li>
        );
    }

    if (item.href) {
        return (
            <li>
                <Link
                    href={item.href}
                    onClick={onClose}
                    className={cn(item.disabled && "pointer-events-none")}
                    target={item.external ? "_blank" : undefined}
                >
                    {content}
                </Link>
            </li>
        );
    }

    return <li>{content}</li>;
}
