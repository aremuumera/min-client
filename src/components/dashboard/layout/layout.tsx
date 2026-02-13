
"use client";

import React from 'react';
import { MainNav } from './main-nav';
import { SideNav } from './side-nav';
import { dashboardConfig } from '@/config/dashboard-config';
import { useAppSelector } from '@/redux';
import { cn } from '@/utils/helper';

interface VerticalLayoutProps {
    children: React.ReactNode;
}

export function DynamicLayout({ children }: VerticalLayoutProps) {
    const { user, appData } = useAppSelector((state) => state.auth);
    const [isCollapsed, setIsCollapsed] = React.useState(false);
    const [isMounted, setIsMounted] = React.useState(false);

    React.useEffect(() => {
        setIsMounted(true);
        const saved = localStorage.getItem('dashboard-sidebar-collapsed');
        if (saved !== null) {
            setIsCollapsed(saved === 'true');
        }
    }, []);

    const handleToggleCollapse = () => {
        const newState = !isCollapsed;
        setIsCollapsed(newState);
        localStorage.setItem('dashboard-sidebar-collapsed', String(newState));
    };

    const isBusinessVerified = appData?.businessVerification?.isVerified;
    const userRole = user?.role;
    const isSupplierProfileCreated = appData?.isProfileCreated;

    const allRoles = ['supplier', 'buyer_supplier'];

    // for supplier
    const finalRelease = isBusinessVerified && (allRoles.includes(userRole || '') || isSupplierProfileCreated);

    // for buyer and other roles
    const finalReleaseBuyer = isBusinessVerified && userRole === 'buyer';

    const totalFinalRelease = userRole === 'buyer' ? finalReleaseBuyer : finalRelease;

    const finalItems = React.useMemo(() => {
        if (userRole === 'admin' || userRole === 'supplier') {
            return dashboardConfig.navItems.map((item) => {
                if (item.key !== 'general') return item;
                return {
                    ...item,
                    items: item.items?.filter((subItem) => subItem.key !== 'becomeasupplier'),
                };
            });
        }
        return dashboardConfig.navItems;
    }, [userRole]);

    return (
        <div className="min-h-screen bg-gray-50/50">
            {totalFinalRelease && (
                <SideNav
                    items={finalItems}
                    isCollapsed={isCollapsed}
                    onToggle={handleToggleCollapse}
                />
            )}

            <div
                className={cn(
                    "flex flex-col min-h-screen transition-all duration-300 ease-in-out",
                    totalFinalRelease && (isCollapsed ? "lg:pl-[80px]" : "lg:pl-[280px]")
                )}
            >
                <MainNav items={finalItems} isCollapsed={isCollapsed} />

                <main className="grow w-full">
                    <div className="p-6 lg:p-10 max-w-[1600px] mx-auto">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}
