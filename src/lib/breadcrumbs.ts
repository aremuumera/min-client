export interface Breadcrumb {
    title: string;
    href: string;
}

export const generateMarketplaceBreadcrumbs = (
    pathname: string,
    params?: {
        mainCategoryId?: string;
        mineralCategoryId?: string;
        subMineralCategoryId?: string;
        rfqCategoryId?: string;
        rfqName?: string;
    }
): Breadcrumb[] => {
    const segments = pathname.split('/').filter(Boolean);

    // Remove 'dashboard' and 'products' segments if present at start
    if (segments[0] === 'dashboard') {
        segments.shift();
    }
    if (segments[0] === 'products') {
        segments.shift();
    }

    const breadcrumbs: Breadcrumb[] = [];
    let url = '';

    breadcrumbs.push({ title: 'Home', href: '/' });

    for (let i = 0; i < segments.length; i++) {
        const segment = segments[i];
        url += `/${segment}`;

        let title = segment;

        // Handle special route segments
        switch (segment) {
            case 'all-mineral-cp':
                title = 'All Products';
                break;
            case 'rfq-products':
                title = 'RFQs';
                break;
            case 'all-cp':
                title = 'All Products';
                break;
            default:
                // Handle dynamic segments with route params
                if (i > 0) {
                    const prevSegment = segments[i - 1];
                    if (prevSegment === 'all-mineral-cp' && i === 1) {
                        title = params?.mainCategoryId || title;
                    } else if (prevSegment === 'all-mineral-cp' && i === 2) {
                        title = params?.mineralCategoryId || title;
                    } else if (prevSegment === 'all-mineral-cp' && i === 3) {
                        title = params?.subMineralCategoryId || title;
                    } else if (prevSegment === 'rfq-products' && i === 1) {
                        title = params?.rfqCategoryId || title;
                    } else if (prevSegment === 'rfq-products' && i === 2 && segment.includes('rfq')) {
                        title = params?.rfqName || title;
                    }
                }
                // Format the title: Replace hyphens with spaces and capitalize
                title = title.replace(/-/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
        }

        breadcrumbs.push({ title, href: `/dashboard/products${url}` });
    }

    return breadcrumbs;
};
