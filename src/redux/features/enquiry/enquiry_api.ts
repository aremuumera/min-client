import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { config } from '@/lib/config';

export const enquiryApi = createApi({
    reducerPath: 'enquiryApi',
    baseQuery: fetchBaseQuery({
        baseUrl: config.api.baseUrl,
        credentials: 'include',
        prepareHeaders: (headers, { getState }) => {
            const state: any = getState();
            const { token } = state.auth;
            if (token) {
                headers.set('authorization', `Bearer ${token}`);
            }
            return headers;
        },
    }),
    tagTypes: ['enquiries'],
    endpoints: (builder) => ({
        submitEnquiryForm: builder.mutation({
            query: (data) => ({
                url: `/enquiry-information/add`,
                method: 'POST',
                body: data,
            }),
            invalidatesTags: ['enquiries'],
        }),
    }),
});

export const { useSubmitEnquiryFormMutation } = enquiryApi;

export default enquiryApi;
