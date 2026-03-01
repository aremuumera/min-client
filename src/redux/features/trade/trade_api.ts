import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQueryWithReauth } from "../../api/baseApi";

export const tradeApi = createApi({
  reducerPath: "tradeApi",
  baseQuery: baseQueryWithReauth,
  tagTypes: ["TradeInquiry", "TradeChat", "RfqOffer"],

  endpoints: (builder) => ({
    getTradeInquiry: builder.query<any, string>({
      query: (id) => `/trade/inquiries/${id}`,
      providesTags: (result, error, id) => [{ type: "TradeInquiry", id }],
    }),
    getMyTradeInquiries: builder.query<any, void>({
      query: () => "/trade/my-inquiries",
      providesTags: ["TradeInquiry"],
    }),
    getReceivedInquiries: builder.query<any, void>({
      query: () => "/trade/received-inquiries",
      providesTags: ["TradeInquiry"],
    }),
    acknowledgeInquiry: builder.mutation<any, string>({
      query: (id) => ({
        url: `/trade/inquiry/${id}/acknowledge`,
        method: "POST",
      }),
      invalidatesTags: (result, error, id) => [
        "TradeInquiry",
        { type: "TradeInquiry", id },
      ],
    }),
    rejectInquiry: builder.mutation<any, { id: string; reason: string }>({
      query: ({ id, reason }) => ({
        url: `/trade/inquiry/${id}/reject`,
        method: "POST",
        body: { reason },
      }),
      invalidatesTags: (result, error, { id }) => [
        "TradeInquiry",
        { type: "TradeInquiry", id },
      ],
    }),

    createProductInquiry: builder.mutation<any, any>({
      query: (body) => ({
        url: "/trade/inquiriess/create",
        method: "POST",
        body,
      }),
      invalidatesTags: ["TradeInquiry"],
    }),

    resolveTradeChat: builder.mutation<
      any,
      { inquiryId: string; type: string }
    >({
      query: ({ inquiryId, type }) => ({
        url: `/trade/inquiry/${inquiryId}/chat-resolve`,
        method: "POST",
        body: { type },
      }),
      invalidatesTags: ["TradeChat"],
    }),
    getRoomTrades: builder.query<any, string>({
      query: (roomId) => `/trade/room/${roomId}/trades`,
      providesTags: ["TradeInquiry"],
    }),
    getOffersByRfq: builder.query<any, string>({
      query: (rfqId) => `/trade/rfq/${rfqId}/offers`,
      providesTags: ["TradeInquiry"],
    }),
    shortlistOffer: builder.mutation<
      any,
      { inquiryId: string; is_shortlisted: boolean }
    >({
      query: ({ inquiryId, is_shortlisted }) => ({
        url: `/trade/inquiry/${inquiryId}/shortlist`,
        method: "PUT",
        body: { is_shortlisted },
      }),
      invalidatesTags: (result, error, { inquiryId }) => [
        "TradeInquiry",
        { type: "TradeInquiry", id: inquiryId },
      ],
    }),

    // ==================== RFQ OFFER ENDPOINTS ====================
    submitRfqOffer: builder.mutation<any, { rfqId: string; body: any }>({
      query: ({ rfqId, body }) => ({
        url: `/rfq/${rfqId}/offers`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["RfqOffer", "TradeInquiry"],
    }),
    getRfqOffers: builder.query<any, string>({
      query: (rfqId) => `/rfq/${rfqId}/offers`,
      providesTags: ["RfqOffer"],
    }),
    getOfferDetail: builder.query<any, string>({
      query: (offerId) => `/rfq/offers/${offerId}`,
      providesTags: (result, error, id) => [{ type: "RfqOffer", id }],
    }),
    getMyRfqOffers: builder.query<any, void>({
      query: () => "/rfq/offers/my-offers",
      providesTags: ["RfqOffer"],
    }),
    shortlistRfqOffer: builder.mutation<
      any,
      { offerId: string; is_shortlisted: boolean }
    >({
      query: ({ offerId, is_shortlisted }) => ({
        url: `/rfq/offers/${offerId}/shortlist`,
        method: "PUT",
        body: { is_shortlisted },
      }),
      invalidatesTags: ["RfqOffer"],
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
  useGetRoomTradesQuery,
  useGetOffersByRfqQuery,
  useShortlistOfferMutation,
  // RFQ Offer hooks
  useSubmitRfqOfferMutation,
  useGetRfqOffersQuery,
  useGetOfferDetailQuery,
  useGetMyRfqOffersQuery,
  useShortlistRfqOfferMutation,
} = tradeApi;

export default tradeApi;
