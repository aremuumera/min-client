'use client';

import * as React from 'react';

type ColorScheme = 'light' | 'dark';

interface ThemeContextType {
  colorScheme: ColorScheme;
  setColorScheme: (scheme: ColorScheme) => void;
}

const ThemeContext = React.createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [colorScheme, setColorScheme] = React.useState<ColorScheme>('light');

  React.useEffect(() => {
    // Handle system preference or persisted theme
    const savedTheme = localStorage.getItem('theme') as ColorScheme;
    if (savedTheme) {
      setColorScheme(savedTheme);
      document.documentElement.classList.toggle('dark', savedTheme === 'dark');
    }
  }, []);

  const changeColorScheme = (scheme: ColorScheme) => {
    setColorScheme(scheme);
    localStorage.setItem('theme', scheme);
    document.documentElement.classList.toggle('dark', scheme === 'dark');
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
