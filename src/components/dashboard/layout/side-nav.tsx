
"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useDispatch } from 'react-redux';
import { LogOut, ChevronDown, ChevronRight, ExternalLink, Sparkles, ShieldAlert, ArrowRight } from 'lucide-react';
import { cn } from '@/utils/helper';
import { Logo } from '@/utils/logo';
import { icons } from './nav-icons';
import { isNavItemActive } from '@/lib/is-nav-item-active';
import { logoutAndCleanup } from '@/redux/features/AuthFeature/auth_slice';
import { useAuthIdentity } from '@/hooks/use-auth-identity';

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
    const { isProfileCreated, isBusinessVerified, isSupplier, isInspector, normalizedRole } = useAuthIdentity();

    const handleLogout = () => {
        dispatch(logoutAndCleanup() as any);
    };

    // Onboarding completion state per role:
    // - Pure Buyer: Only requires business verification (isBusinessVerified)
    // - Supplier / Dual Role / Inspector: Requires business verification AND profile setup
    const isRequiresProfile = normalizedRole === 'supplier' || normalizedRole === 'buyer_supplier' || normalizedRole === 'both' || normalizedRole === 'inspector';
    const isFullyOnboarded = isBusinessVerified && (!isRequiresProfile || isProfileCreated);

    // Determine target onboarding path per user role
    const onboardingPath = normalizedRole === 'inspector'
        ? '/dashboard/inspections/profile/setup'
        : (normalizedRole === 'supplier' || normalizedRole === 'buyer_supplier' || normalizedRole === 'both')
            ? '/dashboard/supplier-list/company-profile/create'
            : '/dashboard/company-info-verification';

    const isOnboardingActive = pathname?.startsWith(onboardingPath);

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

            <nav className="flex-1 overflow-y-auto px-4 py-4 space-y-6 scrollbar-hide">
                {/* 1. TOP ONBOARDING ITEM (Business Verification link; leaves sidebar when business is verified) */}
                {!isBusinessVerified && (
                    <div className="space-y-2">
                        {!isCollapsed && (
                            <h3 className="px-4 text-[10px] font-bold text-amber-400 uppercase tracking-[0.2em] whitespace-nowrap flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                                Onboarding
                            </h3>
                        )}
                        <Link
                            href="/dashboard/company-info-verification"
                            title={isCollapsed ? "Business Verification" : undefined}
                            className={cn(
                                "flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200 group relative",
                                pathname === "/dashboard/company-info-verification"
                                    ? "bg-green-600 text-white font-semibold"
                                    : "text-neutral-500 hover:text-white hover:bg-white/3",
                                isCollapsed && "justify-center px-0"
                            )}
                        >
                            <div className={cn(
                                "shrink-0 transition-transform duration-200",
                                pathname === "/dashboard/company-info-verification"
                                    ? "scale-110 text-white"
                                    : "group-hover:scale-110 text-neutral-600 group-hover:text-white"
                            )}>
                                <ShieldAlert size={18} strokeWidth={pathname === "/dashboard/company-info-verification" ? 2.5 : 2} />
                            </div>
                            {!isCollapsed && (
                                <span className="text-xs font-medium tracking-wide truncate">Business Verification</span>
                            )}
                            {isCollapsed && (
                                <div className="absolute left-[calc(100%+12px)] top-1/2 -translate-y-1/2 bg-neutral-900 text-white text-[10px] py-1 px-2 rounded opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-[200] whitespace-nowrap font-bold border border-white/10">
                                    Business Verification
                                </div>
                            )}
                        </Link>
                    </div>
                )}

                {/* 2. REGULAR NAVIGATION GROUPS */}
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

            {/* 3. BOTTOM KYC STATUS CARD & SIGN OUT (Positioned above Sign Out button) */}
            <div className={cn("p-4 bg-black mt-auto transition-all space-y-3", isCollapsed && "px-2")}>
                {!isBusinessVerified && (
                    <div className={cn(
                        "rounded-xl bg-neutral-950 border border-amber-500/30 p-3.5 transition-all space-y-2.5",
                        isCollapsed && "p-2 flex flex-col items-center justify-center text-center"
                    )}>
                        {!isCollapsed ? (
                            <>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <ShieldAlert size={16} className="text-amber-400 shrink-0" />
                                        <span className="text-xs font-bold text-white">KYC Status</span>
                                    </div>
                                    <span className="px-1.5 py-0.5 text-[9px] font-bold rounded bg-amber-500/20 text-amber-400 border border-amber-500/30 uppercase">
                                        Pending
                                    </span>
                                </div>
                                <p className="text-[11px] text-neutral-400 leading-tight">
                                    Your business verification is pending. Complete KYC to enable full trading features.
                                </p>
                                <Link
                                    href="/dashboard/company-info-verification"
                                    className="flex items-center justify-center gap-1.5 w-full py-2 px-3 bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold rounded-lg transition-colors"
                                >
                                    <span>Complete Verification</span>
                                    <ArrowRight size={12} />
                                </Link>
                            </>
                        ) : (
                            <Link
                                href="/dashboard/company-info-verification"
                                title="KYC Verification Pending - Click to complete"
                                className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 hover:bg-amber-500 hover:text-black transition-colors relative group"
                            >
                                <ShieldAlert size={18} />
                                <div className="absolute left-[calc(100%+12px)] top-1/2 -translate-y-1/2 bg-neutral-900 text-amber-300 text-[10px] py-1 px-2 rounded opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-[200] whitespace-nowrap font-bold border border-amber-500/30">
                                    KYC Pending - Complete Verification
                                </div>
                            </Link>
                        )}
                    </div>
                )}

                <Button
                    onClick={handleLogout}
                    className={cn(
                        "w-full flex items-center justify-center gap-2 py-5 rounded-xl font-bold bg-white/5 hover:bg-red-600 hover:text-white transition-all text-neutral-400 border border-white/5",
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
    const hasChildren = item.items && item.items.length > 0;

    // Automatically expand if a child item is active
    const forceOpen = hasChildren
        ? item.items?.some(child => isNavItemActive({ ...child, pathname }))
        : false;

    const [isOpen, setIsOpen] = useState(forceOpen);
    const active = isNavItemActive({ ...item, pathname });
    const Icon = item.icon ? icons[item.icon] : null;

    const content = (
        <div
            title={isCollapsed ? item.title : undefined}
            className={cn(
                "flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200 group relative",
                active
                    ? "bg-green-600 text-white font-semibold"
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
            {!isCollapsed && (
                <div className="grow flex items-center justify-between min-w-0 gap-1">
                    <span className="text-xs font-medium tracking-wide truncate">{item.title}</span>
                    {item.badge && (
                        <span className="shrink-0 px-1.5 py-0.5 text-[9px] font-semibold rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/30 uppercase tracking-wider">
                            {item.badge}
                        </span>
                    )}
                </div>
            )}
            {!isCollapsed && item.external && <ExternalLink size={12} className="opacity-30 group-hover:opacity-100" />}
            {hasChildren && !isCollapsed && (
                <div className={cn("transition-transform duration-200 text-neutral-700 group-hover:text-white", isOpen && "rotate-180")}>
                    <ChevronDown size={14} />
                </div>
            )}

            {/* Tooltip for collapsed mode */}
            {isCollapsed && (
                <div className="absolute left-[calc(100%+12px)] top-1/2 -translate-y-1/2 bg-neutral-900 text-white text-[10px] py-1 px-2 rounded opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-[200] whitespace-nowrap font-bold border border-white/10 flex items-center gap-1.5">
                    <span>{item.title}</span>
                    {item.badge && (
                        <span className="text-[8px] px-1 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 uppercase font-semibold">
                            {item.badge}
                        </span>
                    )}
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
