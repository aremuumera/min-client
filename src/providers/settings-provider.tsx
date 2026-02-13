'use client';

import * as React from 'react';
import { applyDefaultSettings, Settings } from '@/lib/settings/apply-default-settings';

interface SettingsContextType {
  settings: Settings;
  setSettings: (newSettings: Settings) => void;
}

export const SettingsContext = React.createContext<SettingsContextType>({
  settings: applyDefaultSettings({}),
  setSettings: () => {
    // noop
  },
});

export function SettingsProvider({
  children,
  settings: initialSettings
}: {
  children: React.ReactNode;
  settings?: Settings;
}) {
  const effectiveSettings = React.useMemo(
    () => initialSettings ?? applyDefaultSettings({}),
    [initialSettings]
  );
  const [state, setState] = React.useState<Settings>(effectiveSettings);

  React.useEffect(() => {
    setState(effectiveSettings);
  }, [effectiveSettings]);

  return (
    <SettingsContext.Provider
      value={{
        settings: state,
        setSettings: (newSettings) => {
          setState(newSettings);
        },
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
}

export const useSettings = () => React.useContext(SettingsContext);
