'use client';

import * as React from 'react';

type ColorScheme = 'light' | 'dark';

interface ThemeContextType {
  colorScheme: ColorScheme;
  setColorScheme: (scheme: ColorScheme) => void;
}

const ThemeContext = React.createContext<ThemeContextType | undefined>(undefined);

/*
 * MINMEG is light mode only (frontend decision F-02). The provider keeps its API for existing
 * callers, but always stays light and clears any dark preference saved earlier.
 */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const colorScheme: ColorScheme = 'light';

  React.useEffect(() => {
    try {
      localStorage.removeItem('theme');
    } catch {
      /* storage blocked: nothing to clear */
    }
    document.documentElement.classList.remove('dark');
  }, []);

  const changeColorScheme = () => {
    /* light only */
  };

  return (
    <ThemeContext.Provider value={{ colorScheme, setColorScheme: changeColorScheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => {
  const context = React.useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
