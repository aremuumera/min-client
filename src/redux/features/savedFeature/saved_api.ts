import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQueryWithReauth } from '@/redux/api/baseApi';

export const savedItemsApi = createApi({
    reducerPath: 'savedItemsApi',
    baseQuery: baseQueryWithReauth,
    tagTypes: ['SavedItem', 'Saved'],
    endpoints: (builder) => ({
        // Get all saved items for a user
        getSavedItems: builder.query<any, { userId: string; limit?: number; page?: number; sort?: string; itemType?: string }>({
            query: (params) => {
                const { userId, limit, page, sort, itemType } = params;
                const queryParams = new URLSearchParams();
                if (limit) queryParams.append('limit', limit.toString());
                if (page) queryParams.append('page', page.toString());
                if (sort) queryParams.append('sort', sort);
                if (itemType) queryParams.append('itemType', itemType);

                return `/saved/${userId}?${queryParams.toString()}`;
            },
            providesTags: ['SavedItem'],
        }),

        // Toggle saved item (add or remove)
        toggleSavedItem: builder.mutation({
            query: ({ itemId, itemType, userId }) => ({
                url: `/toggle/${itemId}/${itemType}/${userId}/saved`,
                method: 'POST',
            }),
            invalidatesTags: ['SavedItem', 'Saved'],
        }),

        checkSavedStatus: builder.query<any, { userId: string; itemId: string; itemType: string }>({
            query: ({ userId, itemId, itemType }) => `/check-status/${userId}/${itemId}/${itemType}`,
            providesTags: ['Saved'],
        }),

        // Delete saved item
        deleteSavedItem: builder.mutation({
            query: ({ userId, itemType, itemId }) => ({
                url: `/saved/${userId}/${itemType}/${itemId}/delete`,
                method: 'DELETE',
            }),
            invalidatesTags: ['SavedItem', 'Saved'],
        }),
    }),
});

export const {
    useGetSavedItemsQuery,
    useToggleSavedItemMutation,
    useCheckSavedStatusQuery,
    useDeleteSavedItemMutation,
} = savedItemsApi;

export default savedItemsApi;
