'use client';

import * as React from 'react';

interface ViewModeContextType {
  isGridView: boolean;
  setIsGridView: (isGrid: boolean) => void;
}

const ViewModeContext = React.createContext<ViewModeContextType | undefined>(undefined);

export function ViewModeProvider({ children }: { children: React.ReactNode }) {
  const [isGridView, setIsGridView] = React.useState(true);

  const value = React.useMemo(() => ({
    isGridView,
    setIsGridView,
  }), [isGridView]);

  return (
    <ViewModeContext.Provider value={value}>
      {children}
    </ViewModeContext.Provider>
  );
}

export function useViewMode() {
  const context = React.useContext(ViewModeContext);
  if (!context) {
    throw new Error('useViewMode must be used within a ViewModeProvider');
  }
  return context;
}
