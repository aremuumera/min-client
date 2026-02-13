import { config } from '@/lib/config';

export interface Settings {
    colorScheme: 'light' | 'dark';
    primaryColor: string;
    direction: 'ltr' | 'rtl';
    navColor: 'discrete' | 'blend' | 'evident';
    layout: 'vertical' | 'horizontal';
    language: string;
    currency: string;
}

export function applyDefaultSettings(settings: Partial<Settings> = {}): Settings {
    return {
        colorScheme: (config.site.colorScheme as any) || 'light',
        primaryColor: config.site.primaryColor || '#16b364',
        direction: 'ltr',
        navColor: 'discrete',
        layout: 'vertical',
        language: '',
        currency: 'USD',
        ...settings,
    };
}
