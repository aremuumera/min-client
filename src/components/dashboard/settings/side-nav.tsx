
"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import { UserCircle, Bell, ShieldCheck, Users, Scale, CreditCard } from 'lucide-react';
import { RootState } from '@/redux/store';
import { cn } from '@/utils/helper';
import { paths } from '@/config/paths';
import { usePermission } from '@/hooks/usePermission';
import { isNavItemActive } from '@/lib/is-nav-item-active';

const navItems = [
    { key: 'account', title: 'Account', href: paths.dashboard.settings.account, icon: UserCircle },
    { key: 'notifications', title: 'Notifications', href: paths.dashboard.settings.notifications, icon: Bell },
    { key: 'security', title: 'Security', href: paths.dashboard.settings.security, icon: ShieldCheck },
    { key: 'business', title: 'Business', href: paths.dashboard.settings.business, icon: Users },
    { key: 'team', title: 'Team', href: paths.dashboard.settings.team, icon: Users },
    { key: 'legal', title: 'Legals', href: paths.dashboard.settings.legals, icon: Scale },
];

export function SettingsSideNav() {
    const pathname = usePathname();
    const router = useRouter();
    const canManageTeam = usePermission('team_management');

    const filteredItems = navItems.filter(item => {
        //  if (item.key === 'business' && (userRole === 'admin' || userRole === 'buyer')) {
        //     return false;
        if (['business', 'team', 'legal'].includes(item.key)) {
            return canManageTeam;
        }
        return true;
    });

    return (
        <div className="w-full md:w-[280px] shrink-0 space-y-8">
            <div className="space-y-4">
                <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-6">Settings</h3>
                <nav className="space-y-1">
                    {filteredItems.map((item) => {
                        const active = isNavItemActive({
                            href: item.href,
                            pathname,
                            matcher: { type: 'startsWith', href: item.href }
                        });

                        return (
                            <Link
                                key={item.key}
                                href={item.href}
                                className={cn(
                                    "flex items-center gap-4 px-6 py-3 rounded-xl transition-all duration-200",
                                    active
                                        ? "bg-green-50 text-green-700 font-semibold border border-green-100"
                                        : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
                                )}
                            >
                                <item.icon size={18} strokeWidth={active ? 2.5 : 2} />
                                <span className="text-sm">{item.title}</span>
                            </Link>
                        );
                    })}
                </nav>
            </div>

            <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100 hidden md:block">
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-green-600 border border-[#EFEFEF] ">
                        <CreditCard size={18} />
                    </div>
                    <div>
                        <h4 className="text-sm font-bold text-gray-900">Subscription</h4>
                        {/* Placeholder for Subscription Status */}
                        <div className="flex items-center gap-1 mt-0.5">
                            <span className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse"></span>
                            <p className="text-[10px] font-semibold text-gray-500 uppercase">Pending / Free</p>
                        </div>
                    </div>
                </div>

                <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>Status</span>
                        <span className="font-medium text-yellow-600 bg-yellow-50 px-2 py-0.5 rounded-full">Pending</span>
                    </div>
                    <Button
                        // variant="outlined" 
                        onClick={() => router.push('/pricing')}
                        className="w-full text-xs font-bold rounded-xl py-3 h-auto bg-green-600 hover:text-white border border-gray-200 shadow-sm transition-all"
                    >
                        Upgrade Plan
                    </Button>
                </div>
            </div>
        </div>
    );
}

// Minimal Button internal to avoid circular deps if needed, but we have @/components/ui/button
import { Button } from '@/components/ui/button';
