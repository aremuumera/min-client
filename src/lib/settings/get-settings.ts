export function getSettings() {
    if (typeof window === 'undefined') return {};

    const settingsStr = window.localStorage.getItem('app.settings');
    let settings;

    if (settingsStr) {
        try {
            settings = JSON.parse(settingsStr);
        } catch {
            console.error('Unable to parse the settings');
        }
    }

    settings ||= {};

    return settings;
}
