import React, { ReactNode } from 'react';
import { AuthProvider, useAuth } from './AuthContext';
import { UIProvider, useUI, ToastMessage, DeleteTarget } from './UIContext';
import { DataProvider, useData } from './DataContext';

export type { ToastMessage, DeleteTarget };

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  return (
    <AuthProvider>
      <UIProvider>
        <DataProvider>{children}</DataProvider>
      </UIProvider>
    </AuthProvider>
  );
};

export const useApp = () => {
  const auth = useAuth();
  const ui = useUI();
  const data = useData();

  return {
    ...auth,
    ...ui,
    ...data,
  };
};
