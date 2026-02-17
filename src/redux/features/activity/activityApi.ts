import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQueryWithReauth } from '../../api/baseApi';

export const activityApi = createApi({
    reducerPath: 'activityApi',
    baseQuery: baseQueryWithReauth,
    tagTypes: ['Activity'],
    endpoints: (builder) => ({
        getActivities: builder.query<any, { page?: number; limit?: number; type?: string; entityType?: string }>({
            query: (params) => ({
                url: '/activity',
                method: 'GET',
                params: params,
            }),
            providesTags: ['Activity'],
        }),
    }),
});

export const {
    useGetActivitiesQuery,
} = activityApi;

export default activityApi;
