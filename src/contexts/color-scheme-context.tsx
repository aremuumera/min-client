import React, { createContext, useContext, useState } from 'react';

const ColorSchemeContext = createContext<any>(null);

export const useColorScheme = () => useContext(ColorSchemeContext);

export function ColorSchemeProvider({ children }: { children: React.ReactNode }) {
  const [colorScheme, setColorScheme] = useState('light');

  const changeColorScheme = (scheme: string) => {
    setColorScheme(scheme);
    // Persist the scheme if needed
  };

  return (
    <ColorSchemeContext.Provider value={{ colorScheme, changeColorScheme }}>
      {children}
    </ColorSchemeContext.Provider>
  );
}
