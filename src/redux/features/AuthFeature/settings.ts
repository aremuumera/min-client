import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { API_HOSTNAME } from '@/lib/legacy-config';
import { config } from '@/lib/config';
import baseQueryWithReauth from '@/redux/api/baseApi';

export const settingsApi = createApi({
    reducerPath: 'settingsApi',
    baseQuery: baseQueryWithReauth,
    endpoints: (builder) => ({


        // Change Password
        changePassword: builder.mutation({
            query: (data: any) => ({
                url: '/auth/current/change-password',
                method: 'POST',
                body: data,
            }),
        }),

        UpdateUserPreferences: builder.mutation({
            query: (data: any) => ({
                url: '/auth/current/preferences',
                method: 'PUT',
                body: data,
            }),
        }),

        deactivateAccount: builder.mutation({
            query: () => ({
                url: '/auth/current/deactivate',
                method: 'POST',
            }),
        }),


    }),
});

// Export hooks for usage in functional components
export const {
    useChangePasswordMutation,
    useUpdateUserPreferencesMutation,
    useDeactivateAccountMutation,

} = settingsApi;
