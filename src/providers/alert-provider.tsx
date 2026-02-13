'use client';

import * as React from 'react';
import { Alert, Portal } from '@/components/ui';

interface AlertContextType {
  openAlert: boolean;
  alertMessage: string;
  alertSeverity: 'success' | 'warning' | 'error' | 'info';
  showAlert: (message: string, severity: 'success' | 'warning' | 'error' | 'info') => void;
  closeAlert: () => void;
}

const AlertContext = React.createContext<AlertContextType | undefined>(undefined);

export const useAlert = () => {
  const context = React.useContext(AlertContext);
  if (!context) {
    throw new Error('useAlert must be used within an AlertProvider');
  }
  return context;
};

export const AlertProvider = ({ children }: { children: React.ReactNode }) => {
  const [openAlert, setOpenAlert] = React.useState(false);
  const [alertMessage, setAlertMessage] = React.useState('');
  const [alertSeverity, setAlertSeverity] = React.useState<'success' | 'warning' | 'error' | 'info'>('error');

  const showAlert = (message: string, severity: 'success' | 'warning' | 'error' | 'info') => {
    setAlertMessage(message);
    setAlertSeverity(severity);
    setOpenAlert(true);
  };

  const closeAlert = () => setOpenAlert(false);

  React.useEffect(() => {
    if (openAlert) {
      const timer = setTimeout(() => {
        closeAlert();
      }, 5000); // Auto-dismiss after 5 seconds

      return () => clearTimeout(timer);
    }
  }, [openAlert]);

  return (
    <AlertContext.Provider value={{ openAlert, alertMessage, alertSeverity, showAlert, closeAlert }}>
      {children}
      {openAlert && (
        <Portal>
          <div className="fixed top-4 right-4 z-[9999] min-w-[300px] animate-in fade-in slide-in-from-right-4">
            <Alert
              severity={alertSeverity}
              onClose={closeAlert}
              className="shadow-lg"
              dismissible
            >
              {alertMessage}
            </Alert>
          </div>
        </Portal>
      )}
    </AlertContext.Provider>
  );
};
