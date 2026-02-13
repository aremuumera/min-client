/**
 * Utility to format/decode names for URL usage
 */

export const formatCompanyNameForUrl = (companyName?: string): string => {
    if (!companyName) return '';
    return companyName.replace(/\s+/g, '-');
};

export const decodeCompanyNameFromUrl = (companyName?: string): string => {
    if (!companyName) return '';
    return companyName.replace(/-/g, ' ');
};
