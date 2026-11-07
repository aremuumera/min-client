import { createApi } from '@reduxjs/toolkit/query/react';
import { idempotencyHeaders } from '@/lib/api/idempotency';
import type { CarbonAssessment, CarbonInput, EsgAssessment, EsgInput, Paged, Single, UnitOption } from '@/lib/esg';
import type { TradeStockRecord } from '@/lib/trade-stock';
import baseQueryWithReauth from '@/redux/api/baseApi';

/* Step 2.10: ESG and carbon for companies (Group 18, decision #77). Creates send an Idempotency-Key. */
type Body = Record<string, unknown>;
type Query = Record<string, string | number | boolean | undefined>;
const params = (q: Query) => Object.fromEntries(Object.entries(q).filter(([, v]) => v !== '' && v !== undefined));

export const esgApi = createApi({
  reducerPath: 'esgApi',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['Carbon', 'Esg'],
  endpoints: (builder) => ({
    // ---------- 2.10a carbon ----------
    getCarbonAssessments: builder.query<Paged<CarbonAssessment>, Query>({ query: (q) => ({ url: '/carbon-assessments', params: params(q) }), providesTags: ['Carbon'] }),
    getCarbonAssessment: builder.query<Single<CarbonAssessment>, string>({ query: (id) => `/carbon-assessments/${id}`, providesTags: ['Carbon'] }),
    createCarbonAssessment: builder.mutation<Single<CarbonAssessment>, { idempotencyKey: string } & Body>({
      query: ({ idempotencyKey, ...body }) => ({ url: '/carbon-assessments', method: 'POST', body, headers: idempotencyHeaders(idempotencyKey) }),
      invalidatesTags: ['Carbon'],
    }),
    addCarbonInput: builder.mutation<Single<CarbonInput>, { id: string; idempotencyKey: string } & Body>({
      query: ({ id, idempotencyKey, ...body }) => ({ url: `/carbon-assessments/${id}/inputs`, method: 'POST', body, headers: idempotencyHeaders(idempotencyKey) }),
      invalidatesTags: ['Carbon'],
    }),
    addCarbonInputFromReading: builder.mutation<Single<CarbonInput>, { idempotencyKey: string } & Body>({
      query: ({ idempotencyKey, ...body }) => ({ url: '/carbon-inputs/from-measurement', method: 'POST', body, headers: idempotencyHeaders(idempotencyKey) }),
      invalidatesTags: ['Carbon'],
    }),
    removeCarbonInput: builder.mutation<unknown, { id: string; inputId: string }>({
      query: ({ id, inputId }) => ({ url: `/carbon-assessments/${id}/inputs/${inputId}`, method: 'DELETE' }),
      invalidatesTags: ['Carbon'],
    }),
    carbonAction: builder.mutation<Single<CarbonAssessment>, { id: string; action: 'calculate' | 'submit' | 'invalidate' } & Body>({
      query: ({ id, action, ...body }) => ({ url: `/carbon-assessments/${id}/${action}`, method: 'POST', body }),
      invalidatesTags: ['Carbon'],
    }),
    reviseCarbon: builder.mutation<Single<CarbonAssessment>, { id: string; idempotencyKey: string; changeReason: string; methodologyVersion?: string }>({
      query: ({ id, idempotencyKey, ...body }) => ({ url: `/carbon-assessments/${id}/revise`, method: 'POST', body, headers: idempotencyHeaders(idempotencyKey) }),
      invalidatesTags: ['Carbon'],
    }),
    // ---------- 2.10b ESG ----------
    getEsgAssessments: builder.query<Paged<EsgAssessment>, Query>({ query: (q) => ({ url: '/esg-assessments', params: params(q) }), providesTags: ['Esg'] }),
    getEsgAssessment: builder.query<Single<EsgAssessment>, string>({ query: (id) => `/esg-assessments/${id}`, providesTags: ['Esg'] }),
    createEsgAssessment: builder.mutation<Single<EsgAssessment>, { idempotencyKey: string } & Body>({
      query: ({ idempotencyKey, ...body }) => ({ url: '/esg-assessments', method: 'POST', body, headers: idempotencyHeaders(idempotencyKey) }),
      invalidatesTags: ['Esg'],
    }),
    addEsgInput: builder.mutation<Single<EsgInput>, { id: string; idempotencyKey: string } & Body>({
      query: ({ id, idempotencyKey, ...body }) => ({ url: `/esg-assessments/${id}/inputs`, method: 'POST', body, headers: idempotencyHeaders(idempotencyKey) }),
      invalidatesTags: ['Esg'],
    }),
    addEsgInputFromReading: builder.mutation<Single<EsgInput>, { idempotencyKey: string } & Body>({
      query: ({ idempotencyKey, ...body }) => ({ url: '/esg-inputs/from-measurement', method: 'POST', body, headers: idempotencyHeaders(idempotencyKey) }),
      invalidatesTags: ['Esg'],
    }),
    removeEsgInput: builder.mutation<unknown, { id: string; inputId: string }>({
      query: ({ id, inputId }) => ({ url: `/esg-assessments/${id}/inputs/${inputId}`, method: 'DELETE' }),
      invalidatesTags: ['Esg'],
    }),
    esgAction: builder.mutation<Single<EsgAssessment>, { id: string; action: 'assess' | 'submit' | 'invalidate' } & Body>({
      query: ({ id, action, ...body }) => ({ url: `/esg-assessments/${id}/${action}`, method: 'POST', body }),
      invalidatesTags: ['Esg'],
    }),
    reviseEsg: builder.mutation<Single<EsgAssessment>, { id: string; idempotencyKey: string; changeReason: string; frameworkVersion?: string }>({
      query: ({ id, idempotencyKey, ...body }) => ({ url: `/esg-assessments/${id}/revise`, method: 'POST', body, headers: idempotencyHeaders(idempotencyKey) }),
      invalidatesTags: ['Esg'],
    }),
    // ---------- pickers ----------
    getUnitOptions: builder.query<Paged<UnitOption>, void>({ query: () => ({ url: '/measurement-units', params: { active: true, limit: 100 } }) }),
    getBuyerTrades: builder.query<{ data: TradeStockRecord[] }, void>({ query: () => ({ url: '/trades', params: { role: 'buyer', limit: 100 } }) }),
  }),
});

export const {
  useGetCarbonAssessmentsQuery,
  useGetCarbonAssessmentQuery,
  useCreateCarbonAssessmentMutation,
  useAddCarbonInputMutation,
  useAddCarbonInputFromReadingMutation,
  useRemoveCarbonInputMutation,
  useCarbonActionMutation,
  useReviseCarbonMutation,
  useGetEsgAssessmentsQuery,
  useGetEsgAssessmentQuery,
  useCreateEsgAssessmentMutation,
  useAddEsgInputMutation,
  useAddEsgInputFromReadingMutation,
  useRemoveEsgInputMutation,
  useEsgActionMutation,
  useReviseEsgMutation,
  useGetUnitOptionsQuery,
  useGetBuyerTradesQuery,
} = esgApi;
