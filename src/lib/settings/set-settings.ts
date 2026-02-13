import { Settings } from './apply-default-settings';

export function setSettings(settings: Settings): void {
    if (typeof window === 'undefined') return;

    window.localStorage.setItem('app.settings', JSON.stringify(settings));
}
