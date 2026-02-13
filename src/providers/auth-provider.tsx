'use client';

import * as React from 'react';
import axios, { AxiosInstance } from 'axios';
import { config as appConfig } from '@/lib/config';

export interface AuthContextType {
  token: string | null;
  setToken: React.Dispatch<React.SetStateAction<string | null>>;
  isAuthenticated: boolean;
  authLoading: boolean;
  AxiosInstance: AxiosInstance;
}

export const AuthContext = React.createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = React.useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = React.useState(false);
  const [authLoading, setAuthLoading] = React.useState(true);

  // Creating an Axios instance (Ported from original auth-context.jsx)
  const AxiosInstance = React.useMemo(() => axios.create({
    baseURL: appConfig.api.baseUrl,
    withCredentials: true,
  }), []);

  React.useEffect(() => {
    const verifyAccessToken = async () => {
      try {
        const response = await AxiosInstance.get('/auth/umera/check_refresh_token');
        if (response.data.valid) {
          setToken(response.data?.ac);
          setIsAuthenticated(true);
        } else {
          setToken(null);
          setIsAuthenticated(false);
        }
      } catch (err) {
        setToken(null);
        setIsAuthenticated(false);
        console.error('Error checking access token', err);
      } finally {
        setAuthLoading(false);
      }
    };

    verifyAccessToken();
  }, [AxiosInstance]);

  // Handle request interceptor (Ported from original)
  React.useEffect(() => {
    const authInterceptor = AxiosInstance.interceptors.request.use(
      (config) => {
        if (!config.headers.Authorization && token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    return () => {
      AxiosInstance.interceptors.request.eject(authInterceptor);
    };
  }, [token, AxiosInstance]);

  // Handle response interceptor (Ported from original)
  React.useEffect(() => {
    const refreshTokenInterceptor = AxiosInstance.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error.response?.status === 401 || error.response?.status === 403) {
          console.log('Session expired or unauthorized');
          // Original logic only logged this to console
        }
        return Promise.reject(error);
      }
    );

    return () => {
      AxiosInstance.interceptors.response.eject(refreshTokenInterceptor);
    };
  }, [AxiosInstance]);

  return (
    <AuthContext.Provider value={{ token, setToken, isAuthenticated, authLoading, AxiosInstance }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = React.useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
