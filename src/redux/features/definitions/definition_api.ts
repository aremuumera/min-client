import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQueryWithReauth } from '../../api/baseApi';

export const definitionApi = createApi({
    reducerPath: 'definitionApi',
    baseQuery: baseQueryWithReauth,
    tagTypes: ['CapabilityDefinitions', 'PricingDefinitions'],

    endpoints: (builder) => ({
        getCapabilities: builder.query<any, { target_role?: string; category?: string } | undefined>({
            query: (params) => ({
                url: '/definitions/capabilities',
                params: params || {},
            }),
            providesTags: ['CapabilityDefinitions'],
        }),
        createCapability: builder.mutation<any, { category: string; display_name: string; tech_id: string; target_role?: string }>({
            query: (body) => ({
                url: '/definitions/capabilities',
                method: 'POST',
                body,
            }),
            invalidatesTags: ['CapabilityDefinitions'],
        }),
        getPricingDefs: builder.query<any, void>({
            query: () => '/definitions/pricing',
            providesTags: ['PricingDefinitions'],
        }),
    }),
});

export const {
    useGetCapabilitiesQuery,
    useCreateCapabilityMutation,
    useGetPricingDefsQuery,
} = definitionApi;

export default definitionApi;
