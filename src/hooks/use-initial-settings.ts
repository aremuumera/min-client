'use client';

import * as React from 'react';
import { applyDefaultSettings, Settings } from '@/lib/settings/apply-default-settings';
import { getSettings as getPersistedSettings } from '@/lib/settings/get-settings';

export function useInitialSettings() {
    const [state, setState] = React.useState<Partial<Settings>>({});

    React.useEffect(() => {
        const settings = getPersistedSettings();
        setState(settings);
    }, []);

    return applyDefaultSettings(state);
}
