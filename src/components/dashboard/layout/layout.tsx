
"use client";

import React from 'react';
import { MainNav } from './main-nav';
import { SideNav } from './side-nav';
import { dashboardConfig } from '@/config/dashboard-config';
import { useAppSelector } from '@/redux';
import { cn } from '@/utils/helper';
import { usePathname } from '@/hooks/use-pathname';

interface VerticalLayoutProps {
    children: React.ReactNode;
}

export function DynamicLayout({ children }: VerticalLayoutProps) {
    const { user, appData, isTeamMember, permissions } = useAppSelector((state) => state.auth);
    const [isCollapsed, setIsCollapsed] = React.useState(false);
    const [isMounted, setIsMounted] = React.useState(false);
    const pathname = usePathname()

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

    // for supplier: sidebar is blocked until store profile is created
    const finalRelease = isBusinessVerified && (userRole !== 'supplier' || isSupplierProfileCreated);

    // for buyer and other roles
    const finalReleaseBuyer = isBusinessVerified && userRole === 'buyer';

    const totalFinalRelease = userRole === 'buyer' ? finalReleaseBuyer : finalRelease;

    // Helper to check if a user has permission
    const hasPermission = React.useCallback((permission?: string) => {
        if (!permission) return true;
        if (!isTeamMember) return true; // Owner has all permissions
        return permissions.includes(permission);
    }, [isTeamMember, permissions]);

    // Recursive filtering function
    const filterNavItems = React.useCallback((items: any[]) => {
        return items.reduce((acc: any[], item: any) => {
            // 1. Check item's own permission
            if (!hasPermission(item.permission)) {
                return acc;
            }

            // 2. If item has children, filter them
            if (item.items) {
                const filteredChildren = filterNavItems(item.items);

                // If children were filtered out completely, and it was a specific group 
                // that depends on children (like "Supplier" group), maybe hide it?
                // But for now, just update the items.
                // If this is a Section (top level), we want to keep it even if empty or handle it in UI?
                // userRole logic below handles top level sections somewhat.

                // For now, simple recursion:
                if (filteredChildren.length > 0 || !item.items.length) { // keep if it had no items originally or has remaining items
                    acc.push({ ...item, items: filteredChildren });
                } else {
                    // If all children removed, should we remove parent? 
                    // Case: "Supplier" -> "Create", "List". If both denied, "Supplier" parent should probably go.
                    // Let's assume yes for non-top-level items (sections).
                    // Top level items in dashboardConfig are "Sections" (DASHBOARD, PRODUCT, etc)
                    // They usually verify permission on the section itself implicitly.
                    // But dashboard-config structure: navItems = [Section1, Section2...]
                    // Section1 has `items: [...]`. 
                    // So we are filtering the Section's items.

                    // Actually, let's just assign filteredChildren.
                    acc.push({ ...item, items: filteredChildren });
                }
            } else {
                acc.push(item);
            }
            return acc;
        }, []);
    }, [hasPermission]);

    const finalItems = React.useMemo(() => {
        let items = dashboardConfig.navItems;

        // 1. Existing role-based filtering
        if (userRole === 'admin' || userRole === 'supplier') {
            items = items.map((item) => {
                if (item.key !== 'general') return item;
                // Filter specifically 'becomeasupplier' for suppliers
                return {
                    ...item,
                    items: item.items?.filter((subItem) => subItem.key !== 'becomeasupplier'),
                };
            });
        }

        // 1b. Role-based isolation for Inspectors
        if (userRole === 'inspector') {
            // Keep only: Dashboard Overview, Inspections, and Settings:Account
            return items.filter(section => ['dashboards', 'inspections', 'general'].includes(section.key))
                .map(section => {
                    if (section.key === 'dashboards') {
                        return {
                            ...section,
                            items: section.items?.filter(item => item.key === 'overview')
                        };
                    }
                    if (section.key === 'general') {
                        return {
                            ...section,
                            items: section.items?.filter(item => item.key === 'settings')
                                .map(settings => ({
                                    ...settings,
                                    items: settings.items?.filter(item => item.key === 'settings:account')
                                }))
                        };
                    }
                    return section;
                });
        }

        // 2. Filter sections based on items and role isolation
        return items
            .map(section => ({
                ...section,
                items: filterNavItems(section.items || [])
            }))
            .filter(section => {
                // Remove the section if it has no items
                if (section.items.length === 0) return false;

                // Explicitly block Inspections for non-inspectors/admin
                if (section.key === 'inspections' && userRole !== 'inspector' && userRole !== 'admin') {
                    return false;
                }

                return true;
            });

    }, [userRole, filterNavItems]);

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
                    <div className={cn(
                        "p-6 lg:p-10 max-w-[1600px] mx-auto",
                        pathname?.includes('/dashboard/products') || pathname?.includes('/dashboard/rfqs') || pathname?.includes('/dashboard/chat') ? "p-0 max-w-none" : "",
                        pathname?.includes('/dashboard/chat') ? "h-[calc(100vh-80px)]" : ""
                    )}>
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}
