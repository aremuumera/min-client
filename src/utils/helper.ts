import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Validates a social media URL for specific platforms.
 */
export function validateSocialURL(url: string, platform: 'linkedin' | 'facebook' | 'instagram' | 'twitter' | 'x' | string): boolean {
    if (!url) return true; // Skip validation if empty

    try {
        const parsedUrl = new URL(url);

        // Basic validation
        if (!parsedUrl.protocol || !parsedUrl.hostname) {
            return false;
        }

        // Platform-specific validation
        switch (platform) {
            case 'linkedin':
                return parsedUrl.hostname.includes('linkedin.com');
            case 'facebook':
                return parsedUrl.hostname.includes('facebook.com') ||
                    parsedUrl.hostname.includes('fb.com');
            case 'instagram':
                return parsedUrl.hostname.includes('instagram.com');
            case 'twitter':
            case 'x':
                return parsedUrl.hostname.includes('twitter.com') ||
                    parsedUrl.hostname.includes('x.com');
            default:
                return true;
        }
    } catch (err) {
        return false;
    }
}

export default validateSocialURL;

/**
 * Formats an ISO date string into a human-readable format.
 */
export function formatDate(isoDate: string | Date, formatStyle: 'short' | 'medium' | 'long' | 'full' | 'time' | 'custom' = 'medium', utc = false): string {
    const date = new Date(isoDate);

    if (isNaN(date.getTime())) return 'Invalid Date';

    // Get day suffix (e.g., 1 → "st", 2 → "nd")
    const getDaySuffix = (day: number) => {
        if (day > 3 && day < 21) return 'th';
        switch (day % 10) {
            case 1: return 'st';
            case 2: return 'nd';
            case 3: return 'rd';
            default: return 'th';
        }
    };

    // Format based on style
    switch (formatStyle.toLowerCase()) {
        case "short":
            return date.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'numeric',
                day: 'numeric',
                timeZone: utc ? 'UTC' : undefined
            });

        case "medium":
            return date.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                timeZone: utc ? 'UTC' : undefined
            });

        case "long":
            return date.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                timeZone: utc ? 'UTC' : undefined
            });

        case "full":
            return date.toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                timeZone: utc ? 'UTC' : undefined
            });

        case "time":
            return date.toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit',
                timeZone: utc ? 'UTC' : undefined
            });

        case "custom":
            const day = utc ? date.getUTCDate() : date.getDate();
            const monthName = date.toLocaleString('en-US', { month: 'long', timeZone: utc ? 'UTC' : undefined });
            const year = utc ? date.getUTCFullYear() : date.getFullYear();
            return `${day}${getDaySuffix(day)} ${monthName} ${year}`;

        default:
            return date.toISOString();
    }
}

/**
 * Formats file size in bytes to human-readable format.
 */
export function formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}





// new 

/**
 * Utility function to merge Tailwind CSS classes
 * Combines clsx for conditional classes and tailwind-merge for deduplication
 */
export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

/**
 * Format a number as currency
 */
export function formatCurrency(
    amount: number,
    currency: string = 'USD',
    locale: string = 'en-US'
): string {
    return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency,
    }).format(amount);
}

/**
 * Format a date string
 */
export function formatDateNew(
    date: string | Date,
    options?: Intl.DateTimeFormatOptions
): string {
    const defaultOptions: Intl.DateTimeFormatOptions = {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        ...options,
    };
    return new Intl.DateTimeFormat('en-US', defaultOptions).format(
        typeof date === 'string' ? new Date(date) : date
    );
}

/**
 * Truncate a string to a specified length
 */
export function truncate(str: string, length: number): string {
    if (str.length <= length) return str;
    return str.slice(0, length) + '...';
}

/**
 * Delay execution for a specified time
 */
export function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Check if we're running on the client side
 */
export function isClient(): boolean {
    return typeof window !== 'undefined';
}

/**
 * Check if we're running on the server side
 */
export function isServer(): boolean {
    return typeof window === 'undefined';
}

/**
 * Generate a random ID
 */
export function generateId(): string {
    return Math.random().toString(36).substring(2, 15);
}

/**
 * Capitalize the first letter of a string
 */
export function capitalize(str: string): string {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Convert a file to base64
 */
export function fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = (error) => reject(error);
    });
}
