
import { paths } from '@/config/paths';
import { IconName } from '@/components/dashboard/layout/nav-icons';
import { PermissionKey } from '@/hooks/usePermission';
import { permission } from 'process';

export interface NavItemConfig {
    key: string;
    title: string;
    href?: string;
    icon?: IconName;
    disabled?: boolean;
    external?: boolean;
    label?: string;
    matcher?: { type: 'startsWith' | 'equals'; href: string };
    items?: NavItemConfig[];
    permission?: PermissionKey;
}

export interface DashboardConfig {
    navItems: NavItemConfig[];
}

export const dashboardConfig: DashboardConfig = {
    navItems: [
        // section a (Dashboard)
        {
            key: 'dashboards',
            title: 'DASHBOARD',
            items: [
                { key: 'overview', title: 'Overview', href: paths.dashboard.overview, icon: 'house' },
                { key: 'my-trade-inquiries', title: 'My Trade Inquiries', href: '/dashboard/my-trade-inquiries', icon: 'receipt-long' },
                { key: 'analytics', title: 'Analytics', href: paths.dashboard.analytics, icon: 'chart-pie', permission: 'analytics' },
                { key: 'invoice', title: 'Invoices', href: paths.dashboard.invoices, icon: 'receipt-long', permission: 'invoices' },
                { key: 'marketplace', title: 'Marketplace', href: paths.marketplace.products, icon: 'credit-card', permission: 'products' },
            ],
        },

        // section c (Marketplace)
        {
            key: 'product',
            title: 'PRODUCT',
            items: [
                {
                    key: 'supplier',
                    title: 'Supplier',
                    icon: 'shopping-bag-open',
                    permission: 'products',
                    items: [
                        { key: 'products:create', title: 'Create product', href: paths.dashboard.products.create, permission: 'products' },
                        { key: 'supplier-list', title: 'Listed products', href: paths.dashboard.products.list, permission: 'products' },
                        { key: 'supplier-trade-inquiries', title: 'Order Inquiries', href: '/dashboard/received-inquiries', permission: 'products' },
                        { key: 'supplier-company-profile', title: 'Store profile', href: paths.dashboard.products.companyProfile, permission: 'settings' },
                    ],
                },
            ],
        },

        {
            key: 'rfq',
            title: 'RFQ',
            items: [
                {
                    key: 'buyer',
                    title: 'Buyer',
                    icon: 'shopping-bag-open',
                    permission: 'rfq',
                    items: [
                        { key: 'rfq:create', title: 'Create Rfq', href: paths.dashboard.rfqs.create, permission: 'rfq' },
                        { key: 'rfq', title: 'Listed RFQs', href: paths.dashboard.rfqs.list, permission: 'rfq' },
                        { key: 'rfq-offers', title: 'Offer Board', href: '/dashboard/rfq/offers', permission: 'rfq' },
                        { key: 'buyer-trade-inquiries', title: 'Order Inquiries', href: '/dashboard/my-trade-inquiries', permission: 'rfq' },
                    ],
                },
            ],
        },

        // section inspections (Inspector)
        {
            key: 'inspections',
            title: 'INSPECTIONS',
            items: [
                { key: 'inspections:list', title: 'Assignments', href: paths.dashboard.inspections.list, icon: 'receipt-long', permission: 'inspectors' },
                { key: 'inspections:analytics', title: 'Analytics', href: paths.dashboard.inspections.analytics, icon: 'chart-pie', permission: 'inspectors' },
            ],
        },

        // section services (Inspector Specific)
        {
            key: 'services',
            title: 'SERVICES',
            items: [
                {
                    key: 'inspector-services',
                    title: 'My Services',
                    icon: 'shopping-bag-open',
                    permission: 'inspectors',
                    items: [
                        { key: 'services:matrix', title: 'Capability Matrix', href: paths.dashboard.inspections.services.matrix, permission: 'inspectors' },
                        { key: 'services:pricing', title: 'Pricing & Addons', href: paths.dashboard.inspections.services.pricing, permission: 'inspectors' },
                        { key: 'services:limits', title: 'Operational Limits', href: paths.dashboard.inspections.services.limits, permission: 'inspectors' },
                    ],
                },
                { key: 'inspector-profile', title: 'Company Profile', href: paths.dashboard.inspections.profile, icon: 'users', permission: 'inspectors' },
            ],
        },

        // section d (Dashboard)
        {
            key: 'general',
            title: 'GENERAL',
            items: [
                {
                    key: 'chat',
                    title: 'Chat',
                    href: paths.dashboard.chat.base,
                    icon: 'chats-circle',
                    matcher: { type: 'startsWith', href: '/dashboard/chat' },
                    permission: 'chat',
                },
                {
                    key: 'becomeasupplier',
                    title: 'Become a supplier',
                    href: paths.dashboard.becomeASupplier,
                    icon: 'credit-card',
                },
                { key: 'Wishlist', title: 'Wishlist', href: paths.dashboard.savedProducts, icon: 'star-border' },
                {
                    key: 'settings',
                    title: 'Settings',
                    icon: 'gear',
                    matcher: { type: 'startsWith', href: '/dashboard/settings' },
                    items: [
                        { key: 'settings:account', title: 'Account', href: paths.dashboard.settings.account, permission: 'settings' },
                        { key: 'settings:team', title: 'Team', href: paths.dashboard.settings.team, permission: 'team_management' },
                    ]
                },
            ],
        },
    ],
};
