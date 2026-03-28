'use client';

import * as React from 'react';

import { applyDefaultSettings } from '@/lib/settings/apply-default-settings';

export const SettingsContext = React.createContext({
  settings: applyDefaultSettings({}),
  setSettings: (_newSettings: any) => {
    // noop
  },
});

export function SettingsProvider({ children, settings: initialSettings }: any) {
  const [state, setState] = React.useState(initialSettings);

  React.useEffect(() => {
    setState(initialSettings);
  }, [initialSettings]);

  return (
    <SettingsContext.Provider
      value={{
        settings: state,
        setSettings: (newSettings: any) => {
          setState(newSettings);
        },
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
}

export const SettingsConsumer = SettingsContext.Consumer;
