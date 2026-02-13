import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { config } from '@/lib/config';

export const businessVerificationApi = createApi({
    reducerPath: 'businessVerificationApi',
    baseQuery: fetchBaseQuery({ baseUrl: config.api.baseUrl, credentials: 'include' }),
    tagTypes: ['business_verification_type', 'business_verification_sub'],
    endpoints: (builder) => ({
        getBusinessVerificationCat: builder.query({
            query: () => `/bv-type/categories`,
            providesTags: ['business_verification_type'],
        }),
        getBusinessVerificationCatDoc: builder.query({
            query: ({ tag }) => `/bv-type/categories/${tag}/docuemnts`,
            providesTags: ['business_verification_type'],
        }),
        getBusinessVerificationStatus: builder.query({
            query: ({ id }) => `/business-verify-status/${id}`,
            providesTags: ['business_verification_type'],
        }),
        getSubmittedInfo: builder.query<any, { id: string }>({
            query: ({ id }) => `/business-submitted-details/${id}`,
            providesTags: ['business_verification_type'],
        }),
        getSubmittedDocument: builder.query({
            query: ({ id }) => `/business-submitted-document/${id}`,
            providesTags: ['business_verification_type'],
        }),
        submitCompanyInfo: builder.mutation({
            query: ({ id, data }) => ({
                url: `/business-step-verify/${id}`,
                method: 'POST',
                body: data,
            }),
            invalidatesTags: ['business_verification_type'],
        }),
        completeUploadedFiles: builder.mutation({
            query: ({ id, step }) => ({
                url: `/business-document-upload-completed/${id}/${step}`,
                method: 'POST',
            }),
            invalidatesTags: ['business_verification_type'],
        }),
        uploadCompanyFiles: builder.mutation({
            query: ({ id, data }) => ({
                url: `/business-verify-document/${id}`,
                method: 'POST',
                body: data,
                // The original logic had formData: true, but fetchBaseQuery handles FormData automatically
            }),
            invalidatesTags: ['business_verification_type'],
        }),
        updateCompanyInfo: builder.mutation({
            query: ({ id, data }) => ({
                url: `/update-business-info/${id}`,
                method: 'PUT',
                body: data,
            }),
            invalidatesTags: ['business_verification_type'],
        }),
    }),
});

export const {
    useGetBusinessVerificationCatQuery,
    useGetBusinessVerificationCatDocQuery,
    useGetBusinessVerificationStatusQuery,
    useSubmitCompanyInfoMutation,
    useGetSubmittedInfoQuery,
    useUpdateCompanyInfoMutation,
    useUploadCompanyFilesMutation,
    useGetSubmittedDocumentQuery,
    useCompleteUploadedFilesMutation,
} = businessVerificationApi;

export default businessVerificationApi;
