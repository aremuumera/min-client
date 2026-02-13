'use client';

import * as React from 'react';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { makeStore, createPersistor, type AppStore } from '@/redux/store';

interface StoreProviderProps {
  children: React.ReactNode;
}

/**
 * Redux Store Provider
 * Wraps the app with Redux Provider and PersistGate for state persistence
 */
export function StoreProvider({ children }: StoreProviderProps) {
  const storeRef = React.useRef<AppStore | null>(null);
  const persistorRef = React.useRef<ReturnType<typeof createPersistor> | null>(null);

  if (!storeRef.current) {
    storeRef.current = makeStore();
    persistorRef.current = createPersistor(storeRef.current);
  }

  if (!storeRef.current || !persistorRef.current) return null;

  return (
    <Provider store={storeRef.current}>
      <PersistGate loading={null} persistor={persistorRef.current!}>
        {children}
      </PersistGate>
    </Provider>
  );
}
