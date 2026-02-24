import { fetchBaseQuery, BaseQueryFn, FetchArgs, FetchBaseQueryError } from '@reduxjs/toolkit/query/react';
import { config } from '@/lib/config';
import { loginRefresh, logout, setToken } from '../features/AuthFeature/auth_slice';

export interface ApiResponse<T = any> {
    data: T;
    message?: string;
    success?: boolean;
}

// Mutex to prevent multiple concurrent refresh calls
let isRefreshing = false;
let refreshSubscribers: ((token: string) => void)[] = [];

const onTokenRefreshed = (token: string) => {
    refreshSubscribers.map((callback) => callback(token));
    refreshSubscribers = [];
};

const addRefreshSubscriber = (callback: (token: string) => void) => {
    refreshSubscribers.push(callback);
};

// Base query configuration matching original bv_v1_api.js
const baseQuery = fetchBaseQuery({
    baseUrl: config.api.baseUrl,
    credentials: 'include',
    timeout: 60000,
    prepareHeaders: (headers, { getState }) => {
        // Skip adding the authorization header if 'x-skip-auth' is present
        // This is crucial for the refresh endpoint which relies on cookies
        if (headers.has('x-skip-auth')) {
            headers.delete('x-skip-auth');
            return headers;
        }

        // Get token from Redux state (exact parity)
        // We use any here to avoid circular dependency issues with RootState
        const state: any = getState();
        const token = state.auth?.token;

        // Fallback to localStorage if not in Redux state (exact parity)
        const localToken = typeof window !== 'undefined' ? localStorage.getItem('chimpstate') : null;
        const authToken = token || localToken;

        if (authToken) {
            headers.set('authorization', `Bearer ${authToken}`);
        }
        return headers;
    },
});

/**
 * Shared base query with re-authentication logic
 * Ported from original bv_v1_api.js logic with added Mutex protection
 */
export const baseQueryWithReauth: BaseQueryFn<
    string | FetchArgs,
    unknown,
    FetchBaseQueryError
> = async (args, api, extraOptions) => {
    let result = await baseQuery(args, api, extraOptions);

    // If token expired or unauthorized (401)
    if (result.error && result.error.status === 401) {
        // console.log('Unauthorized (401) detected - attempting to refresh token');

        if (!isRefreshing) {
            isRefreshing = true;
            // console.log('Starting refresh token call via check_refresh_token...');

            // Attempt token refresh
            const refreshResult: any = await baseQuery(
                {
                    url: `/auth/umera/check_refresh_token`,
                    method: 'GET',
                    credentials: 'include',
                    headers: { 'x-skip-auth': 'true' }
                },
                api,
                extraOptions
            );

            if (refreshResult.data?.ac || refreshResult.data?.data?.ac) {
                const newRefresh = refreshResult.data || refreshResult.data?.data
                const newAccessToken = refreshResult.data?.ac || refreshResult.data?.data?.ac;

                // console.log('Refresh successful, updating store and retrying original request...');
                api.dispatch(setToken(newAccessToken));
                api.dispatch(loginRefresh(newRefresh))

                // api.dispatch({ type: 'auth/setToken', payload: newAccessToken });
                // api.dispatch({ type: 'auth/loginRefresh', payload: newRefresh });

                isRefreshing = false;
                onTokenRefreshed(newAccessToken);

                // Retry original request
                result = await baseQuery(args, api, extraOptions);
            } else {
                // console.error('Refresh failed or session truly expired - logging out');
                isRefreshing = false;
                // Using string-based action types to break circular dependency with auth_slice
                api.dispatch(logout());
                //  api.dispatch({ type: 'auth/logout' });
            }
        } else {
            // Already refreshing, queue this request to wait for the new token
            return new Promise((resolve) => {
                addRefreshSubscriber((newToken) => {
                    // Retry original request with the new token
                    resolve(baseQuery(args, api, extraOptions));
                });
            });
        }
    }

    return result;
};

// Exporting as 'api' as well to match consumer expectations
export const api = {
    baseQueryWithReauth
};

export default baseQueryWithReauth;



