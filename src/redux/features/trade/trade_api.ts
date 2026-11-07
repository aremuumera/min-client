import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQueryWithReauth } from "../../api/baseApi";
import { idempotencyHeaders } from "@/lib/api/idempotency";
import type { TradeAllocation, TradeStockRecord } from "@/lib/trade-stock";

type InquiryListQuery = { state?: string; status?: string; search?: string; page?: number; limit?: number };

const inquiryListParams = (params: InquiryListQuery | void) => {
  const searchParams = new URLSearchParams();
  for (const [key, value] of Object.entries(params ?? {})) {
    if (value) searchParams.append(key, String(value));
  }
  const q = searchParams.toString();
  return q ? `?${q}` : "";
};

export const tradeApi = createApi({
  reducerPath: "tradeApi",
  baseQuery: baseQueryWithReauth,
  tagTypes: ["TradeInquiry", "TradeChat", "RfqOffer", "TradeStock"],

  endpoints: (builder) => ({
    /* The stock behind a trade (step 2.6c). The trade room stays the authority for its status. */
    getTradeStock: builder.query<{ data: TradeStockRecord[] }, { productInquiryId?: string; rfqOfferId?: string }>({
      query: (params) => ({ url: "/trades", params }),
      providesTags: ["TradeStock"],
    }),
    /** The company's trades as seller, for planning a shipment */
    getSellerTrades: builder.query<{ data: TradeStockRecord[] }, void>({
      query: () => ({ url: "/trades", params: { role: "seller", limit: 100 } }),
      providesTags: ["TradeStock"],
    }),
    getTradeRecord: builder.query<{ data: TradeStockRecord }, string>({
      query: (id) => `/trades/${id}`,
      providesTags: ["TradeStock"],
    }),
    getTradeAllocations: builder.query<{ data: TradeAllocation[] }, string>({
      query: (id) => `/trades/${id}/allocations`,
      providesTags: ["TradeStock"],
    }),
    holdBatch: builder.mutation<unknown, { tradeId: string; batchId: string; quantity: string; idempotencyKey: string }>({
      query: ({ tradeId, idempotencyKey, ...body }) => ({ url: `/trades/${tradeId}/allocations`, method: "POST", body, headers: idempotencyHeaders(idempotencyKey) }),
      invalidatesTags: ["TradeStock"],
    }),
    releaseHold: builder.mutation<unknown, { id: string; reason: string }>({
      query: ({ id, reason }) => ({ url: `/allocations/${id}/release`, method: "POST", body: { reason } }),
      invalidatesTags: ["TradeStock"],
    }),

    getTradeInquiry: builder.query<any, string>({
      query: (id) => `/trade/inquiries/${id}`,
      providesTags: (result, error, id) => [{ type: "TradeInquiry", id }],
    }),

    getMyTradeInquiries: builder.query<any, InquiryListQuery | void>({
      query: (params) => `/trade/my-inquiries${inquiryListParams(params)}`,
      providesTags: ["TradeInquiry"],
    }),

    getMyTradeInquiriesSummary: builder.query<{ data: Record<string, number> }, void>({
      query: () => "/trade/my-inquiries/summary",
      providesTags: ["TradeInquiry"],
    }),

    getReceivedInquiries: builder.query<any, InquiryListQuery | void>({
      query: (params) => `/trade/received-inquiries${inquiryListParams(params)}`,
      providesTags: ["TradeInquiry"],
    }),

    getReceivedInquiriesSummary: builder.query<{ data: Record<string, number> }, void>({
      query: () => "/trade/received-inquiries/summary",
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
        url: "/trade/inquiries/create",
        method: "POST",
        body,
      }),
      invalidatesTags: ["TradeInquiry"],
    }),

    createBusinessInquiry: builder.mutation<any, any>({
      query: (body) => ({
        url: "/trade/business-inquiries",
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
    getOffersByRfq: builder.query<any, string>({
      query: (rfqId) => `/trade/rfq/${rfqId}/offers`,
      providesTags: ["TradeInquiry"],
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
    getMyRfqOffers: builder.query<any, { page?: number; limit?: number; status?: string; search?: string; state?: string }>({
      query: (params) => {
        const q = new URLSearchParams();
        for (const [k, v] of Object.entries(params)) if (v) q.append(k, String(v));
        return `/rfq/offers/my-offers?${q.toString()}`;
      },
      providesTags: ["RfqOffer"],
    }),
    getMyRfqOfferSummary: builder.query<any, void>({
      query: () => "/rfq/offers/my-offers/summary",
      providesTags: ["RfqOffer"],
    }),
    getOfferHistory: builder.query<any, string>({
      query: (offerId) => `/rfq/offers/${offerId}/history`,
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

    // ============ REQUEST RE-INSPECTION ============
    requestReinspection: builder.mutation<any, { tradeId: string; itemType?: string; reason: string }>({
      query: ({ tradeId, itemType = 'product', reason }) => ({
        url: `/inspector/trades/${tradeId}/re-inspection-request`,
        method: "POST",
        params: { itemType },
        body: { reason },
      }),
      invalidatesTags: ["TradeInquiry", "RfqOffer"],
    }),

    // ============ APPROVE INSPECTION & PROCEED ============
    approveInspectionAndProceed: builder.mutation<any, { tradeId: string; itemType?: string }>({
      query: ({ tradeId, itemType = 'product' }) => ({
        url: `/inspector/trades/${tradeId}/approve-and-proceed`,
        method: "POST",
        params: { itemType },
      }),
      invalidatesTags: ["TradeInquiry", "RfqOffer"],
    }),


    // ============ GET TRADE ASSIGNMENTS HISTORY ============
    getTradeAssignmentsHistory: builder.query<any, { tradeId: string; itemType?: string }>({
      query: ({ tradeId, itemType = 'product' }) => ({
        url: `/inspector/trades/${tradeId}/history`,
        params: { itemType },
      }),
      transformResponse: (res: any) => (Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : [])),
      providesTags: ["TradeInquiry"],
    }),



    // ============ GET RELEASED INSPECTION REPORT ============
    getReleasedReport: builder.query<any, string>({
      query: (assignmentId) => `/inspector/assignments/${assignmentId}/released-report`,
      providesTags: ["TradeInquiry"],
    }),



  }),
});



export const {
  useGetTradeInquiryQuery,
  useGetMyTradeInquiriesQuery,
  useGetReceivedInquiriesQuery,
  useGetMyTradeInquiriesSummaryQuery,
  useGetReceivedInquiriesSummaryQuery,
  useGetTradeStockQuery,
  useGetTradeRecordQuery,
  useGetTradeAllocationsQuery,
  useGetSellerTradesQuery,
  useHoldBatchMutation,
  useReleaseHoldMutation,
  useCreateProductInquiryMutation,
  useCreateBusinessInquiryMutation,
  useResolveTradeChatMutation,
  useAcknowledgeInquiryMutation,
  useRejectInquiryMutation,
  useGetOffersByRfqQuery,
  useGetMyRfqOfferSummaryQuery,
  useGetOfferHistoryQuery,
  // RFQ Offer hooks
  useSubmitRfqOfferMutation,
  useGetRfqOffersQuery,
  useGetOfferDetailQuery,
  useGetMyRfqOffersQuery,
  useShortlistRfqOfferMutation,
  useRequestReinspectionMutation,
  useApproveInspectionAndProceedMutation,
  useGetTradeAssignmentsHistoryQuery,
  useGetReleasedReportQuery,
} = tradeApi;

export default tradeApi;

