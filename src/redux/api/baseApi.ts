import { fetchBaseQuery, BaseQueryFn, FetchArgs, FetchBaseQueryError } from '@reduxjs/toolkit/query/react';
import { config } from '@/lib/config';
import { loginRefresh, logout, setToken } from '../features/AuthFeature/auth_slice';

export interface ApiResponse<T = any> {
    data: T;
    message?: string;
    success?: boolean;
}

// Base query configuration matching original bv_v1_api.js
const baseQuery = fetchBaseQuery({
    baseUrl: config.api.baseUrl,
    credentials: 'include',
    prepareHeaders: (headers, { getState }) => {
        // Get token from Redux state (exact parity)
        const state: any = getState();
        const token = state.auth.token;

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
 * Ported from original bv_v1_api.js logic
 */
export const baseQueryWithReauth: BaseQueryFn<
    string | FetchArgs,
    unknown,
    FetchBaseQueryError
> = async (args, api, extraOptions) => {
    let result = await baseQuery(args, api, extraOptions);

    // If token expired or unauthorized (401)
    if (result.error && result.error.status === 401) {
        const localToken = typeof window !== 'undefined' ? localStorage.getItem('chimpstate') : null;
        const state: any = api.getState();
        const refreshToken = state.auth.token || localToken;

        if (!refreshToken) {
            console.log('called-1')
            api.dispatch(logout());
            return result;
        }

        // Attempt token refresh
        const refreshResult: any = await baseQuery(
            {
                url: `/auth/umera/check_refresh_token`,
                method: 'GET',
                credentials: 'include',
            },
            api,
            extraOptions
        );

        if (refreshResult.data?.ac || refreshResult.data?.data?.ac) {
            const newRefresh = refreshResult.data || refreshResult.data?.data
            const newAccessToken = refreshResult.data?.ac || refreshResult.data?.data?.ac;

            // Save new token
            api.dispatch(setToken(newAccessToken));
            api.dispatch(loginRefresh(newRefresh))

            // Retry the original query with new token
            result = await baseQuery(args, api, extraOptions);
        } else {
            console.log('called-2')
            // Refresh failed — log user out
            api.dispatch(logout());
        }
    }

    return result;
};

// Exporting as 'api' as well to match consumer expectations
export const api = {
    baseQueryWithReauth
};

export default baseQueryWithReauth;
