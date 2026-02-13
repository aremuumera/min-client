
import { paths } from '@/config/paths';
import { IconName } from '@/components/dashboard/layout/nav-icons';

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
                { key: 'analytics', title: 'Analytics', href: paths.dashboard.analytics, icon: 'chart-pie' },
                { key: 'invoice', title: 'Invoices', href: paths.dashboard.invoices, icon: 'receipt-long' },
                { key: 'marketplace', title: 'Marketplace', href: paths.marketplace.products, icon: 'credit-card' },
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
                    items: [
                        { key: 'products:create', title: 'Create product', href: paths.dashboard.products.create },
                        { key: 'supplier-list', title: 'Listed products', href: paths.dashboard.products.list },
                        { key: 'supplier-company-profile', title: 'Store profile', href: paths.dashboard.products.companyProfile },
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
                    items: [
                        { key: 'rfq:create', title: 'Create Rfq', href: paths.dashboard.rfqs.create },
                        { key: 'rfq', title: 'Listed RFQs', href: paths.dashboard.rfqs.list },
                    ],
                },
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
                    href: paths.dashboard.settings.account,
                    icon: 'gear',
                    matcher: { type: 'startsWith', href: '/dashboard/settings' },
                },
            ],
        },
    ],
};
