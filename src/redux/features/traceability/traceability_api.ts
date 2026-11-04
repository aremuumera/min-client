import { createApi } from '@reduxjs/toolkit/query/react';
import { idempotencyHeaders } from '@/lib/api/idempotency';
import type { BatchUnits, Code, CustodyRow, FieldWindow, PrintJob, ScanResult } from '@/lib/traceability';
import baseQueryWithReauth from '@/redux/api/baseApi';

/* Group 11 units, codes and custody (step 2.7c). Creates send an Idempotency-Key. */
type Body = Record<string, unknown>;
type Single<T> = { data: T };
type Paged<T> = { data: T[]; meta: { currentPage: number; totalPages: number; totalItems: number } };
const CHANGES = ['Units', 'Custody'] as const;

export const traceabilityApi = createApi({
  reducerPath: 'traceabilityApi',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['Units', 'Custody', 'Window'],
  endpoints: (builder) => ({
    getBatchUnits: builder.query<Single<BatchUnits>, { batchId: string; includeRetired?: boolean }>({
      query: ({ batchId, includeRetired }) => ({ url: '/handling-units', params: { batchId, ...(includeRetired ? { includeRetired: 'true' } : {}) } }),
      providesTags: ['Units'],
    }),
    createUnit: builder.mutation<unknown, Body & { idempotencyKey: string }>({
      query: ({ idempotencyKey, ...body }) => ({ url: '/handling-units', method: 'POST', body, headers: idempotencyHeaders(idempotencyKey) }),
      invalidatesTags: [...CHANGES],
    }),
    unitAction: builder.mutation<unknown, { id: string; action: 'children' | 'pack' | 'open' | 'empty' | 'retire'; body?: Body }>({
      query: ({ id, action, body }) => ({ url: `/handling-units/${id}/${action}`, method: 'POST', body: body ?? {} }),
      invalidatesTags: [...CHANGES],
    }),
    codeAction: builder.mutation<unknown, { id: string; action: 'report-lost' | 'report-damaged'; body: Body }>({
      query: ({ id, action, body }) => ({ url: `/identifiers/${id}/${action}`, method: 'POST', body }),
      invalidatesTags: [...CHANGES],
    }),
    getCodes: builder.query<Single<Code[]>, { subjectType: 'BATCH' | 'HANDLING_UNIT' | 'SHIPMENT'; subjectId: string }>({
      query: (params) => ({ url: '/identifiers', params }),
      providesTags: ['Units'],
    }),
    getTransfers: builder.query<Paged<CustodyRow>, { direction: 'incoming' | 'outgoing'; status?: string; page?: number; limit?: number }>({
      query: (params) => ({ url: '/custody/transfers', params }),
      providesTags: ['Custody'],
    }),
    getCustodyHistory: builder.query<Single<{ ownerOrganizationId: string | null; records: CustodyRow[] }>, { subjectType: string; subjectId: string }>({
      query: (params) => ({ url: '/custody/history', params }),
      providesTags: ['Custody'],
    }),
    transferCustody: builder.mutation<unknown, Body & { idempotencyKey: string }>({
      query: ({ idempotencyKey, ...body }) => ({ url: '/custody/transfers', method: 'POST', body, headers: idempotencyHeaders(idempotencyKey) }),
      invalidatesTags: [...CHANGES],
    }),
    custodyAction: builder.mutation<unknown, { id: string; action: 'accept' | 'reject' | 'cancel' | 'dispute'; body?: Body }>({
      query: ({ id, action, body }) => ({ url: `/custody/${id}/${action}`, method: 'POST', body: body ?? {} }),
      invalidatesTags: [...CHANGES],
    }),
    /** What a scanned code is: genuine or not, its status, and only what the viewer may know of the goods */
    resolveCode: builder.query<Single<ScanResult>, { value: string; latitude?: number; longitude?: number; accuracyMeters?: number }>({
      query: ({ value, ...params }) => ({ url: `/identifiers/resolve/${encodeURIComponent(value)}`, params }),
    }),
    // ---- the inspector's label work (decision #69: only the assigned inspector, or staff with a reason) ----
    getWindow: builder.query<Single<FieldWindow>, string>({ query: (assignmentId) => `/inspector-assignments/${assignmentId}/field-work-window`, providesTags: ['Window'] }),
    extendWindow: builder.mutation<unknown, { assignmentId: string; closesAt: string; reason: string; progress: string; remaining?: string }>({
      query: ({ assignmentId, ...body }) => ({ url: `/inspector-assignments/${assignmentId}/field-work-window/extend`, method: 'POST', body }),
      invalidatesTags: ['Window'],
    }),
    makeCodes: builder.mutation<Single<{ count: number; items: Code[] }>, { items: { subjectType: string; subjectId: string }[]; idempotencyKey: string } & Body>({
      query: ({ idempotencyKey, ...body }) => ({ url: '/identifiers/bulk', method: 'POST', body, headers: idempotencyHeaders(idempotencyKey) }),
      invalidatesTags: ['Units', 'Window'],
    }),
    createPrintJob: builder.mutation<Single<PrintJob>, { identifierIds: string[]; idempotencyKey: string } & Body>({
      query: ({ idempotencyKey, ...body }) => ({ url: '/identifier-print-jobs', method: 'POST', body, headers: idempotencyHeaders(idempotencyKey) }),
      invalidatesTags: ['Units'],
    }),
    printJobAction: builder.mutation<Single<PrintJob>, { id: string; action: 'start' | 'complete'; body?: Body }>({
      query: ({ id, action, body }) => ({ url: `/identifier-print-jobs/${id}/${action}`, method: 'POST', body: body ?? {} }),
      invalidatesTags: ['Units', 'Window'],
    }),
    getPrintJob: builder.query<Single<PrintJob>, string>({ query: (id) => `/identifier-print-jobs/${id}`, providesTags: ['Units'] }),
    /** The label as SVG text, so it can be shown and printed in the page */
    getLabel: builder.query<string, string>({
      query: (id) => ({ url: `/identifiers/${id}/label`, params: { format: 'svg' }, responseHandler: (r: Response) => r.text() }),
    }),
    applyCode: builder.mutation<unknown, { id: string; scannedValue: string } & Body>({
      query: ({ id, ...body }) => ({ url: `/identifiers/${id}/activate`, method: 'POST', body }),
      invalidatesTags: ['Units', 'Window'],
    }),
    replaceCode: builder.mutation<unknown, { id: string; reason: string } & Body>({
      query: ({ id, ...body }) => ({ url: `/identifiers/${id}/replace`, method: 'POST', body }),
      invalidatesTags: ['Units', 'Window'],
    }),
  }),
});

export const {
  useGetBatchUnitsQuery,
  useCreateUnitMutation,
  useUnitActionMutation,
  useCodeActionMutation,
  useGetCodesQuery,
  useGetTransfersQuery,
  useGetCustodyHistoryQuery,
  useTransferCustodyMutation,
  useCustodyActionMutation,
  useLazyResolveCodeQuery,
  useGetWindowQuery,
  useExtendWindowMutation,
  useMakeCodesMutation,
  useCreatePrintJobMutation,
  usePrintJobActionMutation,
  useLazyGetPrintJobQuery,
  useLazyGetLabelQuery,
  useApplyCodeMutation,
  useReplaceCodeMutation,
} = traceabilityApi;
