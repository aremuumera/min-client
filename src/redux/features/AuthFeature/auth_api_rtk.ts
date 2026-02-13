import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { API_HOSTNAME } from '@/lib/legacy-config';
import { config } from '@/lib/config';

export const authApi = createApi({
    reducerPath: 'authApi',
    baseQuery: fetchBaseQuery({
        baseUrl: config.api.baseUrl,
        credentials: 'include',
        // timeout: config.api.timeout,
        prepareHeaders: (headers) => {
            // By default, if we have a token in the store, let's use that for authenticated requests
            const token = typeof window !== 'undefined' ? localStorage.getItem('chimpstate') : null;
            if (token && token !== 'undefined') {
                headers.set('authorization', `Bearer ${token}`);
            }
            return headers;
        },
    }),
    endpoints: (builder) => ({
        // Query to check/refresh token - replicates AppCheck
        appCheck: builder.query({
            query: () => ({
                url: '/auth/umera/check_refresh_token',
                credentials: 'include',
            }),
            transformResponse: (response: any) => {
                const newToken = response?.ac;
                const firebaseToken = response?.fc;
                const userData = response?.user;
                const data = response?.data;

                // Side effect: Update local storage with new token
                if (typeof window !== 'undefined' && newToken) {
                    localStorage.setItem('chimpstate', newToken);
                }

                return {
                    ac: newToken,
                    userData,
                    user: userData,
                    data: data,
                    fc: firebaseToken,
                };
            },
            // AppCheck shouldn't cache for too long
            keepUnusedDataFor: 0,
        }),

        // Login Mutation
        login: builder.mutation({
            query: (credentials: any) => ({
                url: '/auth/umera/login',
                method: 'POST',
                body: credentials,
            }),
        }),

        // Signup Mutation
        signup: builder.mutation({
            query: (userData: any) => ({
                url: '/auth/umera/register',
                method: 'POST',
                body: userData,
            }),
        }),

        // Verify OTP Mutation
        verifyOTP: builder.mutation({
            query: (data: { identifier: string; otp: string; verificationType: string }) => ({
                url: '/auth/umera/verify_otp_check',
                method: 'POST',
                body: data,
            }),
        }),

        // Resend OTP Mutation
        resendOTP: builder.mutation({
            query: (data: { email: string; verificationType: string }) => ({
                url: '/auth/umera/resend_otp_check',
                method: 'POST',
                body: data,
            }),
        }),

        // Forgot Password
        forgotPassword: builder.mutation({
            query: (data: any) => ({
                // relaxed type from { identifier: string; type: string } to any to allow country/countryCode
                url: '/auth/umera/forgot_password',
                method: 'POST',
                body: data,
            }),
        }),

        // Reset Password
        resetPassword: builder.mutation({
            query: (data: any) => ({
                url: '/auth/umera/reset_password',
                method: 'POST',
                body: data,
            }),
        }),

        // Change Password
        changePassword: builder.mutation({
            query: (data: any) => ({
                url: '/auth/current/change-password',
                method: 'POST',
                body: data,
            }),
        }),
    }),
});

// Export hooks for usage in functional components
export const {
    useAppCheckQuery,
    useLazyAppCheckQuery,
    useLoginMutation,
    useSignupMutation,
    useVerifyOTPMutation,
    useResendOTPMutation,
    useForgotPasswordMutation,
    useResetPasswordMutation,
    useChangePasswordMutation,
} = authApi;
