
import React, { createContext, useContext, useState } from 'react';

interface ViewModeContextType {
  isGridView: boolean;
  setIsGridView: (value: boolean) => void;
}

const ViewModeContext = createContext<ViewModeContextType | null>(null);

export const ViewModeProvider = ({ children }: { children: React.ReactNode }) => {
  const [isGridView, setIsGridView] = useState(true);

  return (
    <ViewModeContext.Provider value={{ isGridView, setIsGridView }}>
      {children}
    </ViewModeContext.Provider>
  );
};

// the custom hook to use the context
export const useViewMode = () => {
  const context = useContext(ViewModeContext);
  if (!context) {
    throw new Error('useViewMode must be used within a ViewModeProvider');
  }
  return context;
};
