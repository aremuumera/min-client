import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQueryWithReauth } from '../../api/baseApi';

export const supplierProfileApi = createApi({
    reducerPath: 'supplierProfileApi',
    baseQuery: baseQueryWithReauth,
    tagTypes: ['StoreProfile'],
    endpoints: (builder) => ({
        // Create Store Profile
        createStoreProfile: builder.mutation({
            query: ({ supplierId, profileData }) => ({
                url: `/suppliers/store/${supplierId}/profile/create`,
                method: 'POST',
                body: profileData,
            }),
            transformResponse: (response: any) => {
                return response;
            },
        }),

        // Update Store Profile
        updateStoreProfile: builder.mutation({
            query: ({ supplierId, profileData, profileId }) => ({
                url: `/suppliers/store/${supplierId}/profile/${profileId}/update`,
                method: 'PUT',
                body: profileData,
            }),
            invalidatesTags: ['StoreProfile'],
        }),

        // Update Store media images and Banner
        updateStoreMedia: builder.mutation({
            query: ({ supplierId, bannerData, profileId }) => ({
                url: `/suppliers/store/${supplierId}/profile/${profileId}/media/update`,
                method: 'PUT',
                body: bannerData,
            }),
            invalidatesTags: ['StoreProfile'],
        }),

        // Get Store Profile
        getStoreProfile: builder.query({
            query: ({ supplierId, profileId }) => `/suppliers/store/${supplierId}/profile/${profileId}/detail`,
            providesTags: (result, error, { profileId }) => [{ type: 'StoreProfile', id: profileId }],
            transformResponse: (response: any) => {
                return response?.data || response;
            },
        }),

        // Get Store Profile by name for web
        getStoreProfileWeb: builder.query({
            query: ({ supplierName }) => `/suppliers/detail/${supplierName}`,
            providesTags: () => [{ type: 'StoreProfile' }],
            transformResponse: (response: any) => {
                return response?.data || response;
            },
        }),
    }),
});

export const {
    useCreateStoreProfileMutation,
    useUpdateStoreProfileMutation,
    useUpdateStoreMediaMutation,
    useGetStoreProfileQuery,
    useGetStoreProfileWebQuery,
} = supplierProfileApi;

export default supplierProfileApi;
