
"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
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
                    <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-green-600 border border-gray-100 shadow-sm">
                        <CreditCard size={18} />
                    </div>
                    <div>
                        <h4 className="text-sm font-bold text-gray-900">Billing Plan</h4>
                        <p className="text-[10px] font-semibold text-gray-400 uppercase">Free Tier</p>
                    </div>
                </div>
                <Button variant="outlined" className="w-full bg-white text-xs font-bold rounded-xl py-3 h-auto hover:bg-green-600 hover:text-white hover:border-green-600 transition-all">
                    Upgrade Now
                </Button>
            </div>
        </div>
    );
}

// Minimal Button internal to avoid circular deps if needed, but we have @/components/ui/button
import { Button } from '@/components/ui/button';
