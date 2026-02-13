
"use client";

import React, { createContext, useContext, useState, ReactNode } from 'react';

interface ViewModeContextType {
  isGridView: boolean;
  setIsGridView: (isGrid: boolean) => void;
}

const ViewModeContext = createContext<ViewModeContextType | undefined>(undefined);

export const ViewModeProvider = ({ children }: { children: ReactNode }) => {
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
