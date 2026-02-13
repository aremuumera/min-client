
"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useDispatch } from 'react-redux';
import { LogOut, ChevronDown, ChevronRight, ExternalLink } from 'lucide-react';
import { cn } from '@/utils/helper';
import { Logo } from '@/utils/logo';
import { icons } from './nav-icons';
import { isNavItemActive } from '@/lib/is-nav-item-active';
import { logout } from '@/redux/features/AuthFeature/auth_slice';
import { resetProductState } from '@/redux/features/supplier-profile/supplier_profile_slice';
import { resetRFQState } from '@/redux/features/buyer-rfq/rfq-slice';

import { AppDispatch } from '@/redux/store';
import { Button } from '@/components/ui/button';
import { NavItemConfig } from '@/config/dashboard-config';

interface SideNavProps {
    items: NavItemConfig[];
    isCollapsed?: boolean;
    onToggle?: () => void;
}

export function SideNav({ items = [], isCollapsed, onToggle }: SideNavProps) {
    const pathname = usePathname();
    const dispatch = useDispatch<AppDispatch>();

    const handleLogout = () => {
        dispatch(logout());
        dispatch(resetProductState());
        dispatch(resetRFQState());
    };

    return (
        <aside className={cn(
            "fixed left-0 top-0 bottom-0 bg-black text-white hidden lg:flex flex-col z-110 border-r border-white/5 transition-all duration-300 ease-in-out",
            isCollapsed ? "w-[80px]" : "w-[280px]"
        )}>
            <div className={cn("p-8 transition-all duration-300", isCollapsed && "px-4 flex justify-center")}>
                {isCollapsed ? (
                    <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center font-bold text-xl">M</div>
                ) : (
                    <Logo color="light" height={45} />
                )}
            </div>

            {/* Toggle Button */}
            <button
                onClick={onToggle}
                className="absolute -right-3 top-24 w-6 h-6 bg-green-600 rounded-full flex items-center justify-center text-white border-2 border-black hover:bg-green-500 transition-colors z-50"
            >
                {isCollapsed ? <ChevronRight size={14} /> : <ChevronDown size={14} className="-rotate-90" />}
            </button>

            <nav className="flex-1 overflow-y-auto px-4 py-4 space-y-8 scrollbar-hide">
                {items.map((group) => (
                    <div key={group.key} className="space-y-3">
                        {group.title && !isCollapsed && (
                            <h3 className="px-4 text-[10px] font-bold text-neutral-500 uppercase tracking-[0.2em] whitespace-nowrap">
                                {group.title}
                            </h3>
                        )}
                        <ul className="space-y-1">
                            {group.items?.map((item) => (
                                <NavItem
                                    key={item.key}
                                    item={item}
                                    pathname={pathname}
                                    depth={0}
                                    isCollapsed={isCollapsed}
                                />
                            ))}
                        </ul>
                    </div>
                ))}
            </nav>

            <div className={cn("p-6 bg-black mt-auto transition-all", isCollapsed && "px-2")}>
                <Button
                    onClick={handleLogout}
                    className={cn(
                        "w-full flex items-center justify-center gap-2 py-6 rounded-xl font-bold bg-white/5 hover:bg-red-600 hover:text-white transition-all text-neutral-400 border border-white/5",
                        isCollapsed && "px-0"
                    )}
                >
                    <LogOut size={18} />
                    {!isCollapsed && <span>Sign Out</span>}
                </Button>
            </div>
        </aside>
    );
}

function NavItem({
    item,
    pathname,
    depth,
    isCollapsed
}: {
    item: NavItemConfig;
    pathname: string;
    depth: number;
    isCollapsed?: boolean;
}) {
    const [isOpen, setIsOpen] = useState(false);
    const active = isNavItemActive({ ...item, pathname });
    const hasChildren = item.items && item.items.length > 0;
    const Icon = item.icon ? icons[item.icon] : null;

    const content = (
        <div
            title={isCollapsed ? item.title : undefined}
            className={cn(
                "flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200 group relative",
                active
                    ? "bg-green-600 text-white font-semibold shadow-lg shadow-green-600/10"
                    : "text-neutral-500 hover:text-white hover:bg-white/3",
                item.disabled && "opacity-50 cursor-not-allowed",
                isCollapsed && "justify-center px-0"
            )}>
            {Icon && (
                <div className={cn(
                    "shrink-0 transition-transform duration-200",
                    active ? "scale-110" : "group-hover:scale-110 text-neutral-600 group-hover:text-white"
                )}>
                    <Icon size={18} strokeWidth={active ? 2.5 : 2} />
                </div>
            )}
            {!isCollapsed && <span className="grow text-xs font-medium tracking-wide truncate">{item.title}</span>}
            {!isCollapsed && item.external && <ExternalLink size={12} className="opacity-30 group-hover:opacity-100" />}
            {hasChildren && !isCollapsed && (
                <div className={cn("transition-transform duration-200 text-neutral-700 group-hover:text-white", isOpen && "rotate-180")}>
                    <ChevronDown size={14} />
                </div>
            )}

            {/* Tooltip for collapsed mode */}
            {isCollapsed && (
                <div className="absolute left-[calc(100%+12px)] top-1/2 -translate-y-1/2 bg-neutral-900 text-white text-[10px] py-1 px-2 rounded opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-[200] whitespace-nowrap font-bold border border-white/10 shadow-xl">
                    {item.title}
                </div>
            )}
        </div>
    );

    if (hasChildren) {
        return (
            <li className="space-y-1">
                <button
                    onClick={() => !isCollapsed && setIsOpen(!isOpen)}
                    className="w-full text-left outline-none"
                    disabled={item.disabled || isCollapsed}
                >
                    {content}
                </button>
                {isOpen && !isCollapsed && (
                    <ul className="ml-5 pl-4 border-l border-white/5 mt-1 space-y-1">
                        {item.items?.map((child) => (
                            <NavItem
                                key={child.key}
                                item={child}
                                pathname={pathname}
                                depth={depth + 1}
                                isCollapsed={isCollapsed}
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
