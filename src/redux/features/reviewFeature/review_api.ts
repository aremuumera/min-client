import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQueryWithReauth } from '@/redux/api/baseApi';

export const reviewApi = createApi({
    reducerPath: 'reviewApi',
    baseQuery: baseQueryWithReauth,
    tagTypes: ['review'],
    endpoints: (builder) => ({
        // Get reviews for an entity (product, supplier, etc.)
        getEntityReviews: builder.query<any, { entityId: string; entityType: string }>({
            query: ({ entityId, entityType }) => `/review/${entityId}/${entityType}`,
            providesTags: ['review'],
        }),

        // Get store/supplier reviews
        getStoreReviews: builder.query<any, { storeProfileId: string; entityType: string }>({
            query: ({ storeProfileId, entityType }) => `/reviews/${storeProfileId}/${entityType}`,
            providesTags: ['review'],
        }),

        // Submit a review for an entity
        submitReview: builder.mutation({
            query: ({ entityId, entityType, userId, revieweeId, reviewData }) => ({
                url: `/review/${entityId}/${entityType}/${userId}/${revieweeId}/submit`,
                method: 'POST',
                body: reviewData,
            }),
            invalidatesTags: ['review'],
        }),

        // Submit a review for a store/supplier
        submitStoreReview: builder.mutation({
            query: ({ userId, storeProfileId, reviewData }) => ({
                url: `/review/${userId}/${storeProfileId}/submit`,
                method: 'POST',
                body: reviewData,
            }),
            invalidatesTags: ['review'],
        }),
    }),
});

export const {
    useGetEntityReviewsQuery,
    useGetStoreReviewsQuery,
    useSubmitReviewMutation,
    useSubmitStoreReviewMutation,
} = reviewApi;

export default reviewApi;
