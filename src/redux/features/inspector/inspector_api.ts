import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQueryWithReauth } from '@/redux/api/baseApi';

export const inspectorApi = createApi({
    reducerPath: 'inspectorApi',
    baseQuery: baseQueryWithReauth,
    tagTypes: [
        'InspectorCompanies',
        'InspectorCompany',
        'InspectorAssignments',
        'InspectorAssignment',
        'AvailableInspectors',
        'AdminInspectors',
    ],

    endpoints: (builder) => ({
        // ============ INSPECTOR COMPANY ENDPOINTS ============
        getAllInspectors: builder.query<any, void>({
            query: () => '/admin/neel-inspectors/all',
            providesTags: ['AdminInspectors'],
        }),
        createInspectorCompany: builder.mutation({
            query: (data) => ({
                url: '/inspector-new',
                method: 'POST',
                body: data,
            }),
            invalidatesTags: ['InspectorCompanies', 'AdminInspectors', 'AvailableInspectors'],
        }),
        getAvailableInspectors: builder.query<any, void>({
            query: () => '/inspector/all-neel-inspectors',
            providesTags: ['AvailableInspectors'],
        }),
        updateInspectorCompany: builder.mutation({
            query: ({ userId, ...data }) => ({
                url: `/inspector/${userId}/edit`,
                method: 'PUT',
                body: data,
            }),
            invalidatesTags: (result, error, { userId }) => [
                { type: 'InspectorCompany', id: userId },
                'InspectorCompanies',
                'AvailableInspectors',
                'AdminInspectors',
            ],
        }),
        toggleInspectorStatus: builder.mutation({
            query: (userId) => ({
                url: `/inspector/status/${userId}/edit`,
                method: 'PUT',
            }),
            invalidatesTags: (result, error, userId) => [
                { type: 'InspectorCompany', id: userId },
                'InspectorCompanies',
                'AvailableInspectors',
                'AdminInspectors',
            ],
        }),

        // ============ INSPECTOR ASSIGNMENT ENDPOINTS ============
        assignInspection: builder.mutation({
            query: ({ userId, assignmentData }) => ({
                url: `/inspector/assign-inspection/${userId}`,
                method: 'POST',
                body: assignmentData,
            }),
            invalidatesTags: ['InspectorAssignments', 'InspectorAssignment'],
        }),
        updateAssignmentStatus: builder.mutation({
            query: ({ userId, statusData }) => ({
                url: `/inspector/update-assignment-status/${userId}`,
                method: 'PUT',
                body: statusData,
            }),
            invalidatesTags: (result, error, { userId }) => [
                { type: 'InspectorAssignment', id: userId },
                'InspectorAssignments',
            ],
        }),
        getInspectorAssignments: builder.query<any, void>({
            query: () => '/inspector/my-assignments',
            providesTags: ['InspectorAssignments'],
        }),
        getAllInspectorAssignments: builder.query<any, void>({
            query: () => '/inspector/admin/all-inspector-assignment',
            providesTags: ['InspectorAssignments'],
        }),

        // ============ UTILITY ENDPOINTS ============
        getInspectorCompanyById: builder.query<any, string>({
            query: (userId) => `/inspector/${userId}`,
            providesTags: (result, error, userId) => [{ type: 'InspectorCompany', id: userId }],
        }),
        searchInspectors: builder.query<any, any>({
            query: (params) => ({
                url: '/inspector/search',
                params,
            }),
            providesTags: ['InspectorCompanies'],
        }),
        getInspectorStats: builder.query<any, void>({
            query: () => '/inspector/stats',
        }),
    }),
});

export const {
    useGetAllInspectorsQuery,
    useCreateInspectorCompanyMutation,
    useGetAvailableInspectorsQuery,
    useUpdateInspectorCompanyMutation,
    useToggleInspectorStatusMutation,
    useGetInspectorCompanyByIdQuery,
    useLazyGetInspectorCompanyByIdQuery,
    useAssignInspectionMutation,
    useUpdateAssignmentStatusMutation,
    useGetInspectorAssignmentsQuery,
    useGetAllInspectorAssignmentsQuery,
    useSearchInspectorsQuery,
    useLazySearchInspectorsQuery,
    useGetInspectorStatsQuery,
} = inspectorApi;

export default inspectorApi;
