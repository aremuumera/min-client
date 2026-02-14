'use client';

import * as React from 'react';
import { StoreProvider } from './store-provider';
// import { AuthProvider } from './auth-provider'; 
import { AlertProvider } from './alert-provider';
import { SettingsProvider } from './settings-provider';
import { ThemeProvider } from './theme-provider';

import { Toaster } from '@/components/core/toaster';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <StoreProvider>
      <ThemeProvider>
        <SettingsProvider>
          <AlertProvider>
            {children}
            <Toaster
              position="top-right"
              richColors
              closeButton
              toastOptions={{
                style: {
                  borderRadius: '12px',
                },
              }}
            />
          </AlertProvider>
        </SettingsProvider>
      </ThemeProvider>
    </StoreProvider>
  );
}

export * from './store-provider';
// export * from './auth-provider';
export * from './auth-guard';
export * from './alert-provider';
export * from './settings-provider';
export * from './theme-provider';
