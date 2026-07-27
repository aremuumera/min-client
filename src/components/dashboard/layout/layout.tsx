
"use client";

import React from 'react';
import { MainNav } from './main-nav';
import { SideNav } from './side-nav';
import { dashboardConfig } from '@/config/dashboard-config';
import { useAuthIdentity } from '@/hooks/use-auth-identity';
import { cn } from '@/utils/helper';
import { usePathname } from '@/hooks/use-pathname';

interface VerticalLayoutProps {
    children: React.ReactNode;
}

export function DynamicLayout({ children }: VerticalLayoutProps) {
    const { user, appData, isTeamMember, permissions, isBusinessVerified, isProfileCreated, isBuyer, isSupplier, isDualRole, isInspector, isAdmin, hasInspectorAccess, normalizedRole } = useAuthIdentity();
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

    // Sidebar navigation release state: ensure desktop and mobile share identical release logic
    const finalRelease = isBusinessVerified && (!isSupplier || isProfileCreated);

    // Helper to check if a user has permission
    const hasPermission = React.useCallback((permission?: string) => {
        if (!permission) return true;
        if (isTeamMember) return permissions.includes(permission);
        switch (permission) {
            case 'products':
                return isSupplier || isDualRole || isAdmin;
            case 'rfq':
                return isBuyer || isDualRole || isAdmin;
            case 'inspectors':
                return isInspector || isAdmin;
            default:
                return true;
        }
    }, [isTeamMember, permissions, isSupplier, isBuyer, isDualRole, isInspector, isAdmin]);

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

        const isSupplierOnly = isSupplier;
        const isBuyerOnly = isBuyer;
        const isInspectorRole = hasInspectorAccess;

        // 1. Role-based sub-item filtering
        items = items.map((section) => {
            // Role upgrade CTA customization in 'general' section
            if (section.key === 'general') {
                if (isDualRole) {
                    // Hide role upgrade CTA for dual-role users who already have both capabilities
                    return {
                        ...section,
                        items: section.items?.filter((subItem) => subItem.key !== 'becomeasupplier'),
                    };
                }
                return {
                    ...section,
                    items: section.items?.map((subItem) => {
                        if (subItem.key === 'becomeasupplier') {
                            return {
                                ...subItem,
                                title: isSupplierOnly ? 'Become a Buyer' : 'Become a Supplier',
                            };
                        }
                        return subItem;
                    }),
                };
            }

            // For pure buyers: Hide the 'supplier' sub-group (Create product, Listed products, Order inquiries, Store profile)
            if (section.key === 'product' && isBuyerOnly) {
                return {
                    ...section,
                    items: section.items?.filter((subItem) => subItem.key !== 'supplier'),
                };
            }

            // For pure suppliers: Hide 'my-trade-inquiries' (buyer-only feature)
            if (section.key === 'product' && isSupplierOnly) {
                return {
                    ...section,
                    items: section.items?.filter((subItem) => subItem.key !== 'my-trade-inquiries'),
                };
            }

            // For pure buyers: Hide 'rfq-submitted-offers' (supplier-only feature for bidding on RFQs)
            if (section.key === 'rfq' && isBuyerOnly) {
                return {
                    ...section,
                    items: section.items?.filter((subItem) => subItem.key !== 'rfq-submitted-offers'),
                };
            }

            // For pure suppliers: Hide the 'buyer' sub-group (Create RFQ, Listed RFQs, Offer Board)
            if (section.key === 'rfq' && isSupplierOnly) {
                return {
                    ...section,
                    items: section.items?.filter((subItem) => subItem.key !== 'buyer'),
                };
            }

            return section;
        });

        // 1b. Role-based isolation for Inspectors
        if (normalizedRole === 'inspector') {
            return items.filter(section => ['dashboards', 'inspections', 'services', 'general'].includes(section.key))
                .map(section => {
                    if (section.key === 'dashboards') {
                        return {
                            ...section,
                            items: section.items?.filter(item => ['overview'].includes(item.key))
                        };
                    }
                    if (section.key === 'general') {
                        return {
                            ...section,
                            items: section.items?.filter(item => ['chat', 'settings'].includes(item.key))
                        };
                    }
                    return section;
                });
        }

        // 2. Filter sections based on items and role permissions
        return items
            .map(section => ({
                ...section,
                items: filterNavItems(section.items || [])
            }))
            .filter(section => {
                // Remove section if it has no items
                if (section.items.length === 0) return false;

                // Explicitly block Inspections for non-inspectors/admin
                if (section.key === 'inspections' && !isInspectorRole) {
                    return false;
                }

                // Explicitly block Services for non-inspectors/admin
                if (section.key === 'services' && !isInspectorRole) {
                    return false;
                }

                //  if (section.key === 'product' && !isSupplierRole && !isBuyerRole) {
                //     return false;
                // }

                // // Explicitly block Buyer/RFQ section for non-buyers/non-suppliers/admin
                // if (section.key === 'rfq' && !isBuyerRole && !isSupplierRole) {
                //     return false;
                // }

                return true;
            });

    }, [normalizedRole, isBuyer, isSupplier, isDualRole, hasInspectorAccess, filterNavItems]);

    if (!isMounted) {
        return null;
    }

    return (
        <div className="min-h-screen bg-gray-50/50">
            {finalRelease && (
                <SideNav
                    items={finalItems}
                    isCollapsed={isCollapsed}
                    onToggle={handleToggleCollapse}
                />
            )}

            <div
                className={cn(
                    "flex flex-col min-h-screen transition-all duration-300 ease-in-out",
                    finalRelease && (isCollapsed ? "lg:pl-[80px]" : "lg:pl-[280px]")
                )}
            >
                <MainNav items={finalItems} isCollapsed={isCollapsed} />

                <main className="grow w-full">
                    <div className={cn(
                        "p-4 sm:p-6 lg:p-10 max-w-[1600px] mx-auto",
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
