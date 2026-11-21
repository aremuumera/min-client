import { createApi } from '@reduxjs/toolkit/query/react';
import { idempotencyHeaders } from '@/lib/api/idempotency';
import type { ApplicabilityRule, Assessment, BulkResult, Certificate, CertificateType, ComplianceProfile, ComplianceSummary, Paged, Passport, PassportType, PassportVerification, PassportVersion, RecordHistory, RelationshipTree, Single, Standard, Template, TemplateRequest, VisibilityPolicy } from '@/lib/passports';
import type { DataRequestDetail, DataRequestRow } from '@/lib/data-requests';
import type { EuHeader, EuHeaderInput } from '@/lib/eu-header';
import type { PassportBackups, RecoveryLink } from '@/lib/passport-backups';
import baseQueryWithReauth from '@/redux/api/baseApi';

/* Step 2.9: passports, compliance and certificates for companies (Groups 14 to 17). Creates send an Idempotency-Key. */
type Body = Record<string, unknown>;
type Query = Record<string, string | number | boolean | undefined>;
const params = (q: Query) => Object.fromEntries(Object.entries(q).filter(([, v]) => v !== '' && v !== undefined));

export const passportsApi = createApi({
  reducerPath: 'passportsApi',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['Requests', 'Templates', 'Passports', 'Compliance', 'Certificates', 'DataRequests', 'EuHeader'],
  endpoints: (builder) => ({
    // ---------- decision #140: the independent copy of each published version ----------
    getPassportBackups: builder.query<Single<PassportBackups>, string>({ query: (id) => `/certificates/${id}/backups`, keepUnusedDataFor: 0 }),
    createRecoveryLink: builder.mutation<Single<RecoveryLink>, { id: string; versionId: string; idempotencyKey: string }>({ query: ({ id, versionId, idempotencyKey }) => ({ url: `/certificates/${id}/backups/${versionId}/recovery-link`, method: 'POST', headers: idempotencyHeaders(idempotencyKey) }) }),
    // ---------- decisions #138, #139: the EU header of a passport (public by the owner's choice) ----------
    getEuHeader: builder.query<Single<EuHeader>, string>({ query: (id) => `/certificates/${id}/eu-header`, providesTags: ['EuHeader'] }),
    setEuHeader: builder.mutation<Single<EuHeader>, { id: string } & EuHeaderInput>({ query: ({ id, ...body }) => ({ url: `/certificates/${id}/eu-header`, method: 'PUT', body }), invalidatesTags: ['EuHeader'] }),
    // ---------- decision #137: requests for a passport's data from people without an account ----------
    getDataRequests: builder.query<Paged<DataRequestRow>, Query>({ query: (q) => ({ url: '/merchant/data-requests', params: params(q) }), providesTags: ['DataRequests'] }),
    getDataRequest: builder.query<Single<DataRequestDetail>, string>({ query: (id) => `/merchant/data-requests/${id}`, providesTags: ['DataRequests'] }),
    approveDataRequest: builder.mutation<Single<DataRequestDetail>, { id: string; scope: string; expiresAt: string; note?: string | null; idempotencyKey: string }>({
      query: ({ id, idempotencyKey, ...body }) => ({ url: `/merchant/data-requests/${id}/approve`, method: 'POST', body, headers: idempotencyHeaders(idempotencyKey) }),
      invalidatesTags: ['DataRequests'],
    }),
    endDataRequest: builder.mutation<Single<DataRequestDetail>, { id: string; step: 'decline' | 'revoke'; reason: string }>({
      query: ({ id, step, reason }) => ({ url: `/merchant/data-requests/${id}/${step}`, method: 'POST', body: { reason } }),
      invalidatesTags: ['DataRequests'],
    }),
    // ---------- 2.9d certificates (the non-passport kind of /certificates) ----------
    getCertificates: builder.query<Paged<Certificate>, Query>({ query: (q) => ({ url: '/certificates', params: params({ certificateKind: 'NON_PASSPORT', ...q }) }), providesTags: ['Certificates'] }),
    getCertificate: builder.query<Single<Certificate>, string>({ query: (id) => `/certificates/${id}`, providesTags: ['Certificates'] }),
    getCertificateTypes: builder.query<Paged<CertificateType>, Query>({ query: (q) => ({ url: '/non-passport-certificate-types', params: params({ limit: 100, ...q }) }), providesTags: ['Certificates'] }),
    // ---------- 2.9c compliance ----------
    getComplianceSummary: builder.query<Single<ComplianceSummary>, string>({ query: (id) => `/certificates/${id}/compliance-summary`, providesTags: ['Compliance'] }),
    getAssessments: builder.query<Paged<Assessment>, Query>({ query: (q) => ({ url: '/compliance-assessments', params: params(q) }), providesTags: ['Compliance'] }),
    getAssessment: builder.query<Single<Assessment>, string>({ query: (id) => `/compliance-assessments/${id}`, providesTags: ['Compliance'] }),
    runAssessment: builder.mutation<Single<Assessment | Assessment[] | { assessments: Assessment[] }>, { idempotencyKey: string } & Body>({
      query: ({ idempotencyKey, ...body }) => ({ url: '/compliance-assessments', method: 'POST', body, headers: idempotencyHeaders(idempotencyKey) }),
      invalidatesTags: ['Compliance'],
    }),
    reassess: builder.mutation<Single<Assessment>, { id: string; idempotencyKey: string } & Body>({
      query: ({ id, idempotencyKey, ...body }) => ({ url: `/compliance-assessments/${id}/reassess`, method: 'POST', body, headers: idempotencyHeaders(idempotencyKey) }),
      invalidatesTags: ['Compliance'],
    }),
    invalidateAssessment: builder.mutation<Single<Assessment>, { id: string; reason: string }>({
      query: ({ id, reason }) => ({ url: `/compliance-assessments/${id}/invalidate`, method: 'POST', body: { reason } }),
      invalidatesTags: ['Compliance'],
    }),
    getComplianceProfiles: builder.query<Paged<ComplianceProfile>, Query>({ query: (q) => ({ url: '/compliance-profiles', params: params(q) }), providesTags: ['Compliance'] }),
    getActiveStandards: builder.query<Paged<Standard>, void>({ query: () => ({ url: '/passport-standards', params: { status: 'ACTIVE', limit: 100 } }) }),
    // ---------- 2.9b passports (the passport kind of /certificates) ----------
    getPassports: builder.query<Paged<Passport>, Query>({ query: (q) => ({ url: '/certificates', params: params({ certificateKind: 'PASSPORT', ...q }) }), providesTags: ['Passports'] }),
    getPassport: builder.query<Single<Passport>, string>({ query: (id) => `/certificates/${id}`, providesTags: ['Passports'] }),
    getPassportVersion: builder.query<Single<PassportVersion>, { id: string; versionId: string }>({ query: ({ id, versionId }) => `/certificates/${id}/versions/${versionId}`, providesTags: ['Passports'] }),
    getPassportVersions: builder.query<Paged<PassportVersion>, string>({ query: (id) => ({ url: `/certificates/${id}/versions`, params: { limit: 100 } }), providesTags: ['Passports'] }),
    getRecordHistory: builder.query<Single<RecordHistory>, string>({ query: (id) => `/certificates/${id}/history`, providesTags: ['Passports', 'Certificates'] }),
    getRelationshipTree: builder.query<Single<RelationshipTree>, string>({ query: (id) => `/certificates/${id}/relationship-tree`, providesTags: ['Passports', 'Certificates'] }),
    getPassportVerification: builder.query<Single<PassportVerification>, string>({ query: (id) => `/certificates/${id}/verification`, providesTags: ['Passports'] }),
    getPassportMaterialChoices: builder.query<Paged<{ id: string; code: string; name: string }>, void>({ query: () => '/materials?active=true&limit=100' }),
    getTemplate: builder.query<Single<Template>, string>({ query: (id) => `/passport-templates/${id}`, providesTags: ['Templates'] }),
    getBatchResults: builder.query<Single<{ batchId: string; inspectionResults: { id: string; quantityVerified: string | null; summary: string | null; status: string; createdAt: string }[]; assayResults: { id: string; laboratoryName: string; sampleReference: string | null; grade: { parameter: string; value: string | number; unit: string } | null; status: string; testedAt: string | null }[] }>, string>({
      query: (batchId) => `/batches/${batchId}/inspection-results`,
    }),
    createPassport: builder.mutation<Single<Passport>, { idempotencyKey: string; certificateType: string; subjectId: string; templateId?: string; changeReason?: string }>({
      query: ({ idempotencyKey, ...body }) => ({ url: '/certificates', method: 'POST', body: { certificateKind: 'PASSPORT', ...body }, headers: idempotencyHeaders(idempotencyKey) }),
      invalidatesTags: ['Passports'],
    }),
    newPassportVersion: builder.mutation<Single<PassportVersion>, { id: string; changeReason: string; templateId?: string; idempotencyKey: string }>({
      query: ({ id, idempotencyKey, ...body }) => ({ url: `/certificates/${id}/versions`, method: 'POST', body, headers: idempotencyHeaders(idempotencyKey) }),
      invalidatesTags: ['Passports'],
    }),
    checkPassportVersion: builder.mutation<Single<PassportVersion>, { id: string; versionId: string }>({
      query: ({ id, versionId }) => ({ url: `/certificates/${id}/versions/${versionId}/validate`, method: 'POST' }),
      invalidatesTags: ['Passports'],
    }),
    discardPassportVersion: builder.mutation<unknown, { id: string; versionId: string }>({
      query: ({ id, versionId }) => ({ url: `/certificates/${id}/versions/${versionId}/discard`, method: 'POST' }),
      invalidatesTags: ['Passports'],
    }),
    passportAction: builder.mutation<Single<Passport>, { id: string; action: 'publish' | 'invalidate' | 'archive' | 'suspend' | 'reinstate' | 'revoke'; reason?: string }>({
      query: ({ id, action, reason }) => ({ url: `/certificates/${id}/${action}`, method: 'POST', body: reason ? { reason } : {} }),
      invalidatesTags: ['Passports'],
    }),
    // decision #132: a company's own key for its name on supply chains (the screens keep it hidden for now)
    getCompanySupplyChainSetting: builder.query<Single<{ nameOnSupplyChains: boolean }>, void>({ query: () => '/organizations/me/supply-chain-settings', providesTags: ['Passports'] }),
    setCompanySupplyChainSetting: builder.mutation<Single<{ nameOnSupplyChains: boolean }>, { nameOnSupplyChains: boolean }>({
      query: (body) => ({ url: '/organizations/me/supply-chain-settings', method: 'PUT', body }),
      invalidatesTags: ['Passports'],
    }),
    // decisions #129, #132: the owner's supply chain switches
    setSupplyChain: builder.mutation<Single<{ showSupplyChain: boolean; showCompanyNames: boolean }>, { id: string; showSupplyChain?: boolean; showCompanyNames?: boolean }>({
      query: ({ id, ...body }) => ({ url: `/certificates/${id}/supply-chain`, method: 'PATCH', body }),
      invalidatesTags: ['Passports'],
    }),
    setPassportValue: builder.mutation<unknown, { versionId: string; fieldId: string } & Body>({
      query: ({ versionId, fieldId, ...body }) => ({ url: `/passport-versions/${versionId}/fields/${fieldId}`, method: 'PUT', body }),
      invalidatesTags: ['Passports'],
    }),
    clearPassportValue: builder.mutation<unknown, { versionId: string; fieldId: string }>({
      query: ({ versionId, fieldId }) => ({ url: `/passport-versions/${versionId}/fields/${fieldId}`, method: 'DELETE' }),
      invalidatesTags: ['Passports'],
    }),
    addPassportMaterial: builder.mutation<unknown, { versionId: string; idempotencyKey: string } & Body>({
      query: ({ versionId, idempotencyKey, ...body }) => ({ url: `/passport-versions/${versionId}/materials`, method: 'POST', body, headers: idempotencyHeaders(idempotencyKey) }),
      invalidatesTags: ['Passports'],
    }),
    removePassportMaterial: builder.mutation<unknown, string>({ query: (id) => ({ url: `/passport-materials/${id}`, method: 'DELETE' }), invalidatesTags: ['Passports'] }),
    setPassportMetadata: builder.mutation<unknown, { versionId: string; entries: Body[] }>({
      query: ({ versionId, entries }) => ({ url: `/passport-versions/${versionId}/metadata`, method: 'PUT', body: { entries } }),
      invalidatesTags: ['Passports'],
    }),
    setPassportValuesBulk: builder.mutation<Single<BulkResult>, { versionId: string; items: Body[]; idempotencyKey: string }>({
      query: ({ versionId, items, idempotencyKey }) => ({ url: `/passport-versions/${versionId}/fields/bulk`, method: 'POST', body: { items }, headers: idempotencyHeaders(idempotencyKey) }),
      invalidatesTags: ['Passports'],
    }),
    // ---------- 2.9a: what companies read of the rules, and their template requests ----------
    getVisibilityPolicies: builder.query<Paged<VisibilityPolicy>, void>({ query: () => ({ url: '/visibility-policies', params: { limit: 100 } }) }),
    getPassportTypes: builder.query<Paged<PassportType>, void>({ query: () => ({ url: '/passport-types', params: { limit: 100 } }) }),
    getTemplates: builder.query<Paged<Template>, Query>({ query: (q) => ({ url: '/passport-templates', params: params(q) }), providesTags: ['Templates'] }),
    getTemplateRequests: builder.query<Paged<TemplateRequest>, Query>({ query: (q) => ({ url: '/passport-template-requests', params: params(q) }), providesTags: ['Requests'] }),
    getTemplateRequest: builder.query<Single<TemplateRequest>, string>({ query: (id) => `/passport-template-requests/${id}`, providesTags: ['Requests'] }),
    createTemplateRequest: builder.mutation<Single<TemplateRequest>, { idempotencyKey: string } & Body>({
      query: ({ idempotencyKey, ...body }) => ({ url: '/passport-template-requests', method: 'POST', body, headers: idempotencyHeaders(idempotencyKey) }),
      invalidatesTags: ['Requests'],
    }),
    answerTemplateRequest: builder.mutation<Single<TemplateRequest>, { id: string; message: string }>({
      query: ({ id, message }) => ({ url: `/passport-template-requests/${id}/respond`, method: 'POST', body: { message } }),
      invalidatesTags: ['Requests'],
    }),
    cancelTemplateRequest: builder.mutation<Single<TemplateRequest>, { id: string; reason?: string }>({
      query: ({ id, reason }) => ({ url: `/passport-template-requests/${id}/cancel`, method: 'POST', body: reason ? { reason } : {} }),
      invalidatesTags: ['Requests'],
    }),
  }),
});

export const {
  useGetPassportBackupsQuery,
  useCreateRecoveryLinkMutation,
  useGetEuHeaderQuery,
  useSetEuHeaderMutation,
  useGetDataRequestsQuery,
  useGetDataRequestQuery,
  useApproveDataRequestMutation,
  useEndDataRequestMutation,
  useGetCertificatesQuery,
  useGetCertificateQuery,
  useGetCertificateTypesQuery,
  useGetComplianceSummaryQuery,
  useGetAssessmentsQuery,
  useGetAssessmentQuery,
  useRunAssessmentMutation,
  useReassessMutation,
  useInvalidateAssessmentMutation,
  useGetComplianceProfilesQuery,
  useGetActiveStandardsQuery,
  useGetVisibilityPoliciesQuery,
  useGetPassportsQuery,
  useLazyGetPassportsQuery,
  useGetPassportQuery,
  useGetPassportVersionQuery,
  useGetPassportVersionsQuery,
  useGetRecordHistoryQuery,
  useGetRelationshipTreeQuery,
  useGetPassportVerificationQuery,
  useGetBatchResultsQuery,
  useCreatePassportMutation,
  useNewPassportVersionMutation,
  useCheckPassportVersionMutation,
  useDiscardPassportVersionMutation,
  usePassportActionMutation,
  useSetSupplyChainMutation,
  useGetCompanySupplyChainSettingQuery,
  useSetCompanySupplyChainSettingMutation,
  useSetPassportValueMutation,
  useClearPassportValueMutation,
  useAddPassportMaterialMutation,
  useRemovePassportMaterialMutation,
  useSetPassportMetadataMutation,
  useSetPassportValuesBulkMutation,
  useGetTemplateQuery,
  useGetPassportMaterialChoicesQuery,
  useGetPassportTypesQuery,
  useGetTemplatesQuery,
  useGetTemplateRequestsQuery,
  useGetTemplateRequestQuery,
  useCreateTemplateRequestMutation,
  useAnswerTemplateRequestMutation,
  useCancelTemplateRequestMutation,
} = passportsApi;
