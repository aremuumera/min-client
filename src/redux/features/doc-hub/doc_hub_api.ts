import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQueryWithReauth } from "../../api/baseApi";

export const docHubApi = createApi({
  reducerPath: "docHubApi",
  baseQuery: baseQueryWithReauth,
  tagTypes: ["TradeDocument", "DocumentTemplate", "SignatureSettings"],

  endpoints: (builder) => ({
    // ... preexisting endpoints ...
    getSignatureSettings: builder.query<any, void>({
      query: () => "/trade/documents/signature-settings",
      providesTags: ["SignatureSettings"],
    }),

    // Get visibility-filtered stages for a specific inquiry
    getClientStages: builder.query<any, { inquiryId: string }>({
      query: ({ inquiryId }) => `/trade/inquiry/${inquiryId}/stages`,
      providesTags: (result, error, { inquiryId }) => [
        { type: "TradeDocument", id: `stages-${inquiryId}` },
      ],
    }),

    // Get documents for a specific trade (inquiry or RFQ)
    getDocumentsByInquiry: builder.query<
      any,
      {
        inquiryId: string;
        status?: string;
        stage_slug?: string;
        itemType?: string;
      }
    >({
      query: ({ inquiryId, ...params }) => ({
        url: `/trade/documents/vault/${inquiryId}`,
        params,
      }),
      providesTags: (result, error, { inquiryId }) => [
        { type: "TradeDocument", id: inquiryId },
        ...(Array.isArray(result?.data)
          ? result.data.map((doc: any) => ({
              type: "TradeDocument" as const,
              id: doc.id,
            }))
          : []),
      ],
    }),

    // Sign, Flag or Reject a document
    signDocument: builder.mutation<
      any,
      {
        documentId: string;
        action: string;
        signature_type?: "typed_name" | "svg_drawing" | "ip_timestamp";
        signature_data?: string;
        flag_reason?: string;
      }
    >({
      query: ({ documentId, ...body }) => ({
        url: `/trade/documents/${documentId}/sign`,
        method: "POST",
        body,
      }),
      invalidatesTags: (result, error, { documentId }) => [
        { type: "TradeDocument", id: documentId },
        "TradeDocument", // Invalidate list to update stats
      ],
    }),

    // Update user signature preference
    updateSignaturePreference: builder.mutation<
      any,
      {
        save_signature_enabled: boolean;
      }
    >({
      query: (body) => ({
        url: `/trade/documents/update-signature-preference`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["SignatureSettings"],
    }),
  }),
});

export const {
  useGetDocumentsByInquiryQuery,
  useSignDocumentMutation,
  useUpdateSignaturePreferenceMutation,
  useGetSignatureSettingsQuery,
  useGetClientStagesQuery,
} = docHubApi;

export default docHubApi;
