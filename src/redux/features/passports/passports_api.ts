import { createApi } from '@reduxjs/toolkit/query/react';
import { idempotencyHeaders } from '@/lib/api/idempotency';
import type { Paged, PassportType, Single, Template, TemplateRequest } from '@/lib/passports';
import baseQueryWithReauth from '@/redux/api/baseApi';

/* Step 2.9: passports, compliance and certificates for companies (Groups 14 to 17). Creates send an Idempotency-Key. */
type Body = Record<string, unknown>;
type Query = Record<string, string | number | boolean | undefined>;
const params = (q: Query) => Object.fromEntries(Object.entries(q).filter(([, v]) => v !== '' && v !== undefined));

export const passportsApi = createApi({
  reducerPath: 'passportsApi',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['Requests', 'Templates'],
  endpoints: (builder) => ({
    // ---------- 2.9a: what companies read of the rules, and their template requests ----------
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
  useGetPassportTypesQuery,
  useGetTemplatesQuery,
  useGetTemplateRequestsQuery,
  useGetTemplateRequestQuery,
  useCreateTemplateRequestMutation,
  useAnswerTemplateRequestMutation,
  useCancelTemplateRequestMutation,
} = passportsApi;
