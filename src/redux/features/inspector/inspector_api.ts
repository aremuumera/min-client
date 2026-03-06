import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQueryWithReauth } from "@/redux/api/baseApi";

export const inspectorApi = createApi({
  reducerPath: "inspectorApi",
  baseQuery: baseQueryWithReauth,
  tagTypes: [
    "InspectorCompanies",
    "InspectorCompany",
    "InspectorAssignments",
    "InspectorAssignment",
    "AvailableInspectors",
    "AdminInspectors",
  ],

  endpoints: (builder) => ({
    // ============ INSPECTOR COMPANY ENDPOINTS ============
    getAllInspectors: builder.query<any, void>({
      query: () => "/admin/neel-inspectors/all",
      providesTags: ["AdminInspectors"],
    }),
    createInspectorCompany: builder.mutation({
      query: (data) => ({
        url: "/inspector-new",
        method: "POST",
        body: data,
      }),
      invalidatesTags: [
        "InspectorCompanies",
        "AdminInspectors",
        "AvailableInspectors",
      ],
    }),
    getAvailableInspectors: builder.query<any, void>({
      query: () => "/inspector/all-neel-inspectors",
      providesTags: ["AvailableInspectors"],
    }),
    updateInspectorCompany: builder.mutation({
      query: ({ userId, ...data }) => ({
        url: `/inspector/${userId}/edit`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: (result, error, { userId }) => [
        { type: "InspectorCompany", id: userId },
        "InspectorCompanies",
        "AvailableInspectors",
        "AdminInspectors",
      ],
    }),
    toggleInspectorStatus: builder.mutation({
      query: (userId) => ({
        url: `/inspector/status/${userId}/edit`,
        method: "PUT",
      }),
      invalidatesTags: (result, error, userId) => [
        { type: "InspectorCompany", id: userId },
        "InspectorCompanies",
        "AvailableInspectors",
        "AdminInspectors",
      ],
    }),

    // ============ INSPECTOR ASSIGNMENT ENDPOINTS ============
    assignInspection: builder.mutation({
      query: ({ userId, assignmentData }) => ({
        url: `/inspector/assign-inspection/${userId}`,
        method: "POST",
        body: assignmentData,
      }),
      invalidatesTags: ["InspectorAssignments", "InspectorAssignment"],
    }),
    updateAssignmentStatus: builder.mutation({
      query: ({ id, ...statusData }) => ({
        url: `/inspector/assignments/${id}/status`,
        method: "PUT",
        body: statusData,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "InspectorAssignment", id },
        "InspectorAssignments",
      ],
    }),
    getInspectorAssignments: builder.query<any, void>({
      query: () => "/inspector/assignments/me",
      providesTags: ["InspectorAssignments"],
    }),
    getWorkbenchDetail: builder.query<any, string>({
      query: (id) => `/inspector/workbench/${id}`,
      providesTags: (result, error, id) => [
        { type: "InspectorAssignment", id },
      ],
    }),

    // ============ UTILITY ENDPOINTS ============
    getInspectorCompanyById: builder.query<any, string>({
      query: (userId) => `/inspector/${userId}`,
      providesTags: (result, error, userId) => [
        { type: "InspectorCompany", id: userId },
      ],
    }),
    searchInspectors: builder.query<any, any>({
      query: (params) => ({
        url: "/inspector/search",
        params,
      }),
      providesTags: ["InspectorCompanies"],
    }),
    getInspectorStats: builder.query<any, void>({
      query: () => "/inspector/dashboard/stats",
    }),
    getInspectorAnalytics: builder.query<any, void>({
      query: () => "/inspector/analytics",
    }),

    // ============ INSPECTOR CONFIGURATION ENDPOINTS ============
    getInspectorCapabilities: builder.query<any, string>({
      query: (inspectorId) => `/inspector/profile/${inspectorId}/capabilities`,
      providesTags: (result, error, inspectorId) => [
        { type: "InspectorCompany", id: `CAPS_${inspectorId}` },
      ],
    }),
    updateInspectorCapabilities: builder.mutation({
      query: ({ inspectorId, ...data }) => ({
        url: `/inspector/profile/${inspectorId}/capabilities`,
        method: "POST",
        body: data,
      }),
      invalidatesTags: (result, error, { inspectorId }) => [
        { type: "InspectorCompany", id: `CAPS_${inspectorId}` },
      ],
    }),

    getInspectorLimits: builder.query<any, string>({
      query: (inspectorId) => `/inspector/profile/${inspectorId}/limits`,
      providesTags: (result, error, inspectorId) => [
        { type: "InspectorCompany", id: `LIMITS_${inspectorId}` },
      ],
    }),
    updateInspectorLimits: builder.mutation({
      query: ({ inspectorId, ...data }) => ({
        url: `/inspector/profile/${inspectorId}/limits`,
        method: "POST",
        body: data,
      }),
      invalidatesTags: (result, error, { inspectorId }) => [
        { type: "InspectorCompany", id: `LIMITS_${inspectorId}` },
      ],
    }),

    getInspectorPricing: builder.query<any, string>({
      query: (inspectorId) => `/inspector/profile/${inspectorId}/pricing`,
      providesTags: (result, error, inspectorId) => [
        { type: "InspectorCompany", id: `PRICING_${inspectorId}` },
      ],
    }),
    updateInspectorPricing: builder.mutation({
      query: ({ inspectorId, ...data }) => ({
        url: `/inspector/profile/${inspectorId}/pricing`,
        method: "POST",
        body: data,
      }),
      invalidatesTags: (result, error, { inspectorId }) => [
        { type: "InspectorCompany", id: `PRICING_${inspectorId}` },
      ],
    }),

    setPricingAddon: builder.mutation({
      query: ({ inspectorId, ...data }) => ({
        url: `/inspector/profile/${inspectorId}/pricing/addon`,
        method: "POST",
        body: data,
      }),
      invalidatesTags: (result, error, { inspectorId }) => [
        { type: "InspectorCompany", id: `PRICING_${inspectorId}` },
      ],
    }),

    deletePricingAddon: builder.mutation({
      query: (addonId) => ({
        url: `/inspector/profile/pricing/addon/${addonId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["InspectorCompany"],
    }),

    getCapabilityDefinitions: builder.query<any, string | void>({
      query: (role = "Inspector") =>
        `/definitions/capabilities?target_role=${role}`,
    }),

    getPricingDefinitions: builder.query<any, void>({
      query: () => "/definitions/pricing",
    }),

    getInspectorProfile: builder.query<any, string>({
      query: (id) => `/inspector/me/company-details/${id}`,
      providesTags: (result, error, id) => [
        { type: "InspectorCompany", id: `PROFILE_${id}` },
      ],
    }),
    updateInspectorProfile: builder.mutation({
      query: ({ companyId, ...data }) => ({
        url: `/inspector/me/company-details/${companyId}/edit`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: (result, error, { companyId }) => [
        { type: "InspectorCompany", id: `PROFILE_${companyId}` },
        "InspectorCompany",
      ],
    }),
    getMyCompanyDetails: builder.query<any, void>({
      query: () => `/inspector/me/company-details/my-account`,
      providesTags: ["InspectorCompany"],
    }),
    updateInspectorMedia: builder.mutation({
      query: ({ companyId, formData }) => ({
        url: `/inspector/me/company-details/${companyId}/media`,
        method: "PUT",
        body: formData,
      }),
      invalidatesTags: (result, error, { companyId }) => [
        { type: "InspectorCompany", id: `PROFILE_${companyId}` },
        "InspectorCompany",
      ],
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
  useGetWorkbenchDetailQuery,
  useSearchInspectorsQuery,
  useLazySearchInspectorsQuery,
  useGetInspectorStatsQuery,
  useGetInspectorCapabilitiesQuery,
  useUpdateInspectorCapabilitiesMutation,
  useGetInspectorLimitsQuery,
  useUpdateInspectorLimitsMutation,
  useGetInspectorPricingQuery,
  useUpdateInspectorPricingMutation,
  useSetPricingAddonMutation,
  useDeletePricingAddonMutation,
  useGetCapabilityDefinitionsQuery,
  useGetPricingDefinitionsQuery,
  useGetInspectorAnalyticsQuery,
  useGetInspectorProfileQuery,
  useUpdateInspectorProfileMutation,
  useGetMyCompanyDetailsQuery,
  useUpdateInspectorMediaMutation,
} = inspectorApi;

export default inspectorApi;
