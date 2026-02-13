import { logout } from '@/redux/features/AuthFeature/auth_slice';
import axios from 'axios';
import { config } from '@/lib/config';

// Create an Axios instance
const AxiosInstance = axios.create({
    baseURL: config.api.baseUrl,
    withCredentials: true,
});

/**
 * Setup Axios Interceptors
 * This needs to be called in a provider where the store is available
 */
export const setupAxiosInterceptors = (store: any) => {
    // Request Interceptor
    AxiosInstance.interceptors.request.use((config) => {
        // Check for token in localStorage (exact parity with original)
        if (typeof window !== 'undefined') {
            const token = localStorage.getItem('chimpstate');
            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            }
        }
        return config;
    });

    // Response Interceptor
    AxiosInstance.interceptors.response.use(
        (response) => response,
        async (error) => {
            // 401 or 403 triggers logout (exact parity with original)
            if (error.response?.status === 401 || error.response?.status === 403) {
                store.dispatch(logout());
            }
            return Promise.reject(error);
        }
    );
};

export default AxiosInstance;
