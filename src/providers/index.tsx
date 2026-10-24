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
            {/* design.md toast: brand dark, white text, flat; red / amber edge only for errors / warnings */}
            <Toaster
              position="top-right"
              closeButton
              toastOptions={{
                classNames: {
                  toast: '!bg-brand-dark !text-on-dark !border !border-hairline-dark !rounded-md !font-sans',
                  description: '!text-on-dark-muted',
                  success: '!border-l-4 !border-l-primary',
                  error: '!border-l-4 !border-l-semantic-error',
                  warning: '!border-l-4 !border-l-semantic-warning',
                  closeButton: '!bg-brand-dark !text-on-dark !border-hairline-dark',
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
