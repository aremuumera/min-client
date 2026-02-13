import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQueryWithReauth } from '@/redux/api/baseApi';

export const invoiceApi = createApi({
    reducerPath: 'invoiceApi',
    baseQuery: baseQueryWithReauth,
    tagTypes: ['InvoiceAgreement', 'InvoiceApproval', 'AdminInvoice'],
    endpoints: (builder) => ({
        // ============ INVOICE AGREEMENT ENDPOINTS ============
        createInvoiceAgreement: builder.mutation({
            query: (data) => ({
                url: '/invoice-new',
                method: 'POST',
                body: data,
            }),
            invalidatesTags: ['InvoiceAgreement'],
        }),

        getUserInvoiceAgreements: builder.query<any, { page?: number; limit?: number; status?: string; tradeType?: string }>({
            query: ({ page = 1, limit = 10, status, tradeType }) => ({
                url: '/invoice/my-agreement',
                params: {
                    page,
                    limit,
                    ...(status && { status }),
                    ...(tradeType && { tradeType }),
                },
            }),
            providesTags: ['InvoiceAgreement'],
        }),

        getInvoiceAgreementById: builder.query<any, string>({
            query: (userId) => `/invoice/my-agreement/${userId}`,
            providesTags: (result, error, userId) => [{ type: 'InvoiceAgreement', id: userId }],
        }),

        updateInvoiceAgreement: builder.mutation({
            query: ({ userId, ...data }) => ({
                url: `/invoice/agreement/${userId}/edit`,
                method: 'PUT',
                body: data,
            }),
            invalidatesTags: (result, error, { userId }) => [{ type: 'InvoiceAgreement', id: userId }, 'InvoiceAgreement'],
        }),

        submitForApproval: builder.mutation({
            query: (userId) => ({
                url: `/invoice/submit-approval/${userId}`,
                method: 'POST',
            }),
            invalidatesTags: (result, error, userId) => [{ type: 'InvoiceAgreement', id: userId as string }, 'InvoiceApproval'],
        }),

        submitForInspection: builder.mutation({
            query: (userId) => ({
                url: `/invoice/submit-inspection/${userId}`,
                method: 'POST',
            }),
            invalidatesTags: (result, error, userId) => [{ type: 'InvoiceAgreement', id: userId as string }],
        }),

        cancelInvoice: builder.mutation({
            query: ({ id, reason }) => ({
                url: `/invoice/cancel-inspection/${id}`,
                method: 'POST',
                body: { reason },
            }),
            invalidatesTags: (result, error, { id }) => [{ type: 'InvoiceAgreement', id }, 'InvoiceAgreement'],
        }),

        // ============ INVOICE APPROVAL ENDPOINTS ============
        updateApproval: builder.mutation({
            query: ({ id, approvalData }) => ({
                url: `/invoice/${id}/approve`,
                method: 'PUT',
                body: approvalData,
            }),
            invalidatesTags: (result, error, { id }) => [
                { type: 'InvoiceAgreement', id },
                { type: 'InvoiceApproval', id },
            ],
        }),

        getApprovalStatus: builder.query<any, string>({
            query: (id) => `/invoice/${id}/approval-status`,
            providesTags: (result, error, id) => [{ type: 'InvoiceApproval', id }],
        }),

        // ============ ADMIN ENDPOINTS ============
        getAdminInvoiceAgreements: builder.query<any, void>({
            query: () => '/admin/neel-agreement/all',
            providesTags: ['AdminInvoice'],
        }),

        // ============ UTILITY ENDPOINTS ============
        searchInvoiceAgreements: builder.query<any, any>({
            query: (params) => ({
                url: '/invoice/my-agreement',
                params,
            }),
            providesTags: ['InvoiceAgreement'],
        }),

        exportInvoice: builder.query<Blob, string>({
            query: (userId) => ({
                url: `/invoice/export/${userId}`,
                responseHandler: (response) => response.blob(),
            }),
            providesTags: (result, error, userId) => [{ type: 'InvoiceAgreement', id: userId }],
        }),
    }),
});

export const {
    useCreateInvoiceAgreementMutation,
    useGetUserInvoiceAgreementsQuery,
    useGetInvoiceAgreementByIdQuery,
    useUpdateInvoiceAgreementMutation,
    useSubmitForApprovalMutation,
    useSubmitForInspectionMutation,
    useCancelInvoiceMutation,
    useUpdateApprovalMutation,
    useGetApprovalStatusQuery,
    useGetAdminInvoiceAgreementsQuery,
    useSearchInvoiceAgreementsQuery,
    useLazyExportInvoiceQuery,
} = invoiceApi;

export default invoiceApi;
