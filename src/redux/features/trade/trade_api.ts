import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQueryWithReauth } from '../../api/baseApi';

export const tradeApi = createApi({
    reducerPath: 'tradeApi',
    baseQuery: baseQueryWithReauth,
    tagTypes: ['TradeInquiry', 'TradeChat'],

    endpoints: (builder) => ({
        getTradeInquiry: builder.query<any, string>({
            query: (id) => `/trade/inquiries/${id}`,
            providesTags: (result, error, id) => [{ type: 'TradeInquiry', id }],
        }),
        getMyTradeInquiries: builder.query<any, void>({
            query: () => '/trade/my-inquiries',
            providesTags: ['TradeInquiry'],
        }),
        getReceivedInquiries: builder.query<any, void>({
            query: () => '/trade/received-inquiries',
            providesTags: ['TradeInquiry'],
        }),
        acknowledgeInquiry: builder.mutation<any, string>({
            query: (id) => ({
                url: `/trade/inquiry/${id}/acknowledge`,
                method: 'POST',
            }),
            invalidatesTags: (result, error, id) => ['TradeInquiry', { type: 'TradeInquiry', id }],
        }),
        rejectInquiry: builder.mutation<any, { id: string; reason: string }>({
            query: ({ id, reason }) => ({
                url: `/trade/inquiry/${id}/reject`,
                method: 'POST',
                body: { reason },
            }),
            invalidatesTags: (result, error, { id }) => ['TradeInquiry', { type: 'TradeInquiry', id }],
        }),
        createProductInquiry: builder.mutation<any, any>({
            query: (body) => ({
                url: '/trade/inquiries',
                method: 'POST',
                body,
            }),
            invalidatesTags: ['TradeInquiry'],
        }),
        resolveTradeChat: builder.mutation<any, { inquiryId: string; type: string }>({
            query: ({ inquiryId, type }) => ({
                url: `/trade/inquiry/${inquiryId}/chat-resolve`,
                method: 'POST',
                body: { type },
            }),
            invalidatesTags: ['TradeChat'],
        }),
    }),
});

export const {
    useGetTradeInquiryQuery,
    useGetMyTradeInquiriesQuery,
    useGetReceivedInquiriesQuery,
    useCreateProductInquiryMutation,
    useResolveTradeChatMutation,
    useAcknowledgeInquiryMutation,
    useRejectInquiryMutation,
} = tradeApi;

export default tradeApi;
