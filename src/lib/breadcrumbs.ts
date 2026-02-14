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

    // Remove 'dashboard' segment if present at start for URL building prefix
    if (segments[0] === 'dashboard') {
        segments.shift();
    }

    const breadcrumbs: Breadcrumb[] = [];
    let url = '/dashboard';

    breadcrumbs.push({ title: 'Home', href: '/' });

    for (let i = 0; i < segments.length; i++) {
        const segment = segments[i];
        url += `/${segment}`;

        let title = segment;

        // Handle special route segments
        switch (segment) {
            case 'products':
                title = 'Marketplace';
                break;
            case 'rfqs':
                title = 'RFQs';
                break;
            case 'all-mineral-cp':
                title = 'All Products';
                break;
            case 'rfq-products':
                title = 'RFQ Listings';
                break;
            case 'details':
                continue; // Skip 'details' in breadcrumbs for cleaner look
            default:
                // Handle dynamic segments with route params
                if (i > 0) {
                    const prevSegment = segments[i - 1];
                    if (prevSegment === 'all-mineral-cp') {
                        title = params?.mainCategoryId || title;
                    } else if (prevSegment === 'details') {
                        // If previous was details, this is an ID or Name
                        // Try to get name from params if possible
                        title = params?.rfqName || title;
                    }
                }
                // Format the title: Replace hyphens with spaces and capitalize
                title = title.replace(/-/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
        }

        if (segment !== 'details') {
            breadcrumbs.push({ title, href: url });
        }
    }

    return breadcrumbs;
};
