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
        getPricingDefs: builder.query<any, void>({
            query: () => '/definitions/pricing',
            providesTags: ['PricingDefinitions'],
        }),
    }),
});

export const {
    useGetCapabilitiesQuery,
    useGetPricingDefsQuery,
} = definitionApi;

export default definitionApi;
