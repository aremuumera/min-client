import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQueryWithReauth } from '../../api/baseApi';

export const businessVerificationApiV1 = createApi({
    reducerPath: 'businessVerificationApiV1',
    baseQuery: baseQueryWithReauth,
    tagTypes: ['Verification', 'Directors'],
    endpoints: (builder) => ({
        getVerificationStatus: builder.query({
            query: (userId) => `/company/status/${userId}`,
            providesTags: ['Verification'],
        }),
        updateBusinessCategory: builder.mutation({
            query: ({ userId, data }) => ({
                url: `/company/business/verification/category/${userId}`,
                method: 'POST',
                body: data,
            }),
            invalidatesTags: ['Verification'],
        }),
        submitStep1: builder.mutation({
            query: ({ userId, data }) => ({
                url: `/company/business/verification/step-1/${userId}`,
                method: 'POST',
                body: data,
            }),
            invalidatesTags: ['Verification'],
        }),
        submitStep2: builder.mutation({
            query: ({ userId, formData }) => ({
                url: `/company/business/verification/step-2/${userId}`,
                method: 'POST',
                body: formData,
            }),
            invalidatesTags: ['Verification'],
        }),
        submitStep3: builder.mutation({
            query: ({ userId, formData }) => ({
                url: `/company/business/verification/step-3/${userId}`,
                method: 'POST',
                body: formData,
            }),
            invalidatesTags: ['Verification'],
        }),
        submitStep4: builder.mutation({
            query: ({ userId, formData }) => ({
                url: `/company/business/verification/step-4/${userId}`,
                method: 'POST',
                body: formData,
            }),
            invalidatesTags: ['Verification'],
        }),
        submitStep5: builder.mutation({
            query: ({ userId }) => ({
                url: `/company/business/verification/step5/${userId}`,
                method: 'POST',
            }),
            invalidatesTags: ['Verification'],
        }),
        getDirectors: builder.query({
            query: (userId) => `/company/directors/${userId}`,
            providesTags: ['Directors'],
        }),
        addDirector: builder.mutation({
            query: ({ userId, formData }) => ({
                url: `/company/business/verification/directors/${userId}`,
                method: 'POST',
                body: formData,
            }),
            invalidatesTags: ['Directors', 'Verification'],
        }),
        updateDirector: builder.mutation({
            query: ({ userId, directorId, formData }) => ({
                url: `/company/business/verification/directors/${userId}/${directorId}`,
                method: 'PUT',
                body: formData,
            }),
            invalidatesTags: ['Directors'],
        }),
        deleteDirector: builder.mutation({
            query: ({ userId, directorId }) => ({
                url: `/company/business/verification/directors/${userId}/${directorId}`,
                method: 'DELETE',
            }),
            invalidatesTags: ['Directors', 'Verification'],
        }),
        getVerificationDetails: builder.query({
            query: (userId) => `/company/business/verification/details/${userId}`,
            providesTags: ['Verification'],
        }),
    }),
});

export const {
    useGetVerificationStatusQuery,
    useUpdateBusinessCategoryMutation,
    useSubmitStep1Mutation,
    useSubmitStep2Mutation,
    useSubmitStep3Mutation,
    useSubmitStep4Mutation,
    useSubmitStep5Mutation,
    useGetDirectorsQuery,
    useAddDirectorMutation,
    useUpdateDirectorMutation,
    useDeleteDirectorMutation,
    useGetVerificationDetailsQuery,
} = businessVerificationApiV1;

export default businessVerificationApiV1;
