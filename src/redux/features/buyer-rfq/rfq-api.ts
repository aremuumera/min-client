import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQueryWithReauth } from '../../api/baseApi';

export const rfqApi = createApi({
    reducerPath: 'rfqApi',
    baseQuery: baseQueryWithReauth,
    tagTypes: ['Rfq'],
    endpoints: (builder) => ({
        createRFQ: builder.mutation({
            query: ({ rfqData, buyerId }) => ({
                url: `/buyers/${buyerId}/rfqs`,
                method: 'POST',
                body: rfqData,
            }),
            invalidatesTags: ['Rfq'],
        }),
        editRFQ: builder.mutation({
            query: ({ rfqData, buyerId, rfqId }) => ({
                url: `/buyers/${buyerId}/rfqs/${rfqId}`,
                method: 'PUT',
                body: rfqData,
            }),
            invalidatesTags: ['Rfq'],
        }),
        deleteRFQ: builder.mutation({
            query: ({ buyerId, rfqId }) => ({
                url: `/buyers/${buyerId}/rfqs/${rfqId}/delete`,
                method: 'DELETE',
            }),
            invalidatesTags: ['Rfq'],
        }),
        getAllRfq: builder.query({
            query: (params) => {
                const { materialId, limit, page, sort, search, category, mainCategory, subCategory, measure, quantity, status } = params;
                const queryParams = new URLSearchParams();
                if (limit) queryParams.append('limit', limit.toString());
                if (page) queryParams.append('page', page.toString());
                if (sort) queryParams.append('sort', sort);
                if (category) queryParams.append('category', category);
                if (mainCategory) queryParams.append('mainCategory', mainCategory);
                if (subCategory) queryParams.append('subCategory', subCategory);
                if (search) queryParams.append('q', search);
                if (materialId) queryParams.append('materialId', materialId);
                if (measure) queryParams.append('measure', measure);
                if (quantity) queryParams.append('minQuantity', quantity);
                if (status) queryParams.append('status', status);

                return `/rfqs/all?${queryParams.toString()}`;
            },
            providesTags: ['Rfq'],
        }),
        getAllRfqByBuyerId: builder.query({
            query: (params) => {
                const { limit, page, sort, q, category, buyerId, measure, quantity, status } = params;
                const queryParams = new URLSearchParams();
                if (limit) queryParams.append('limit', limit.toString());
                if (page) queryParams.append('page', page.toString());
                if (sort) queryParams.append('sort', sort);
                if (category) queryParams.append('category', category);
                if (measure) queryParams.append('measure', measure);
                if (quantity) queryParams.append('minQuantity', quantity);
                if (status) queryParams.append('status', status);
                if (q) queryParams.append('q', q);

                return `/rfqs/${buyerId}/buyer?${queryParams.toString()}`;
            },
            providesTags: ['Rfq'],
        }),
        getBuyerRfqSummary: builder.query<{ data: Record<string, number> }, string>({
            query: (buyerId) => `/rfqs/${buyerId}/buyer/summary`,
            providesTags: ['Rfq'],
        }),
        changeRfqStatus: builder.mutation<unknown, { buyerId: string; rfqId: string; status: 'published' | 'cancelled'; reason?: string }>({
            query: ({ buyerId, rfqId, ...body }) => ({ url: `/buyers/${buyerId}/rfqs/${rfqId}/status`, method: 'PUT', body }),
            invalidatesTags: ['Rfq'],
        }),
        getDetailFfq: builder.query({
            query: ({ rfqId }) => `/rfqs/${rfqId}/detail`,
            providesTags: ['Rfq'],
        }),
        getRfqDetailsForbuy: builder.query({
            query: ({ rfqId }) => `/rfqs/${rfqId}/for-buy`,
            providesTags: ['Rfq'],
        }),
        updateRfqMedia: builder.mutation({
            query: ({ buyerId, rfqId, rfqData }) => ({
                url: `/buyer/${buyerId}/rfq/${rfqId}/media`,
                method: 'PUT',
                body: rfqData,
            }),
            invalidatesTags: ['Rfq'],
        }),
        deleteRfqMedia: builder.mutation({
            query: ({ buyerId, rfqId, publicId }) => ({
                url: `/buyer/${buyerId}/rfq/${rfqId}/media/?publicId=${publicId}`,
                method: 'DELETE',
            }),
            invalidatesTags: ['Rfq'],
        }),
    }),
});

export const {
    useCreateRFQMutation,
    useEditRFQMutation,
    useGetAllRfqQuery,
    useGetAllRfqByBuyerIdQuery,
    useUpdateRfqMediaMutation,
    useGetRfqDetailsForbuyQuery,
    useGetBuyerRfqSummaryQuery,
    useChangeRfqStatusMutation,
    useGetDetailFfqQuery,
    useDeleteRfqMediaMutation,
    useDeleteRFQMutation,
} = rfqApi;

export default rfqApi;
