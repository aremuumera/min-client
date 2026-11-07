import { createApi } from '@reduxjs/toolkit/query/react';
import { idempotencyHeaders } from '@/lib/api/idempotency';
import type { EventType, Reading, RecordSubject, ReleasedRecords, TraceEvent } from '@/lib/records';
import type { BatchUnits, Code, CustodyRow, FieldWindow, InspectionFile, PrintJob, RoundResults, ScanResult } from '@/lib/traceability';
import baseQueryWithReauth from '@/redux/api/baseApi';

/* Group 11 units, codes and custody (step 2.7c). Creates send an Idempotency-Key. */
type Body = Record<string, unknown>;
type Single<T> = { data: T };
type Paged<T> = { data: T[]; meta: { currentPage: number; totalPages: number; totalItems: number } };
const CHANGES = ['Units', 'Custody'] as const;

export const traceabilityApi = createApi({
  reducerPath: 'traceabilityApi',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['Units', 'Custody', 'Window', 'Results', 'Records'],
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
    // ---- readings and events (step 2.8b, decision #70): never edited; corrections are new records ----
    getReadings: builder.query<Paged<Reading>, { subjectType: RecordSubject; subjectId: string; includeHistory?: boolean }>({
      query: ({ subjectType, subjectId, includeHistory }) => ({ url: '/measurements', params: { [subjectType === 'SHIPMENT' ? 'shipmentId' : subjectType === 'BATCH' ? 'batchId' : 'subjectId']: subjectId, ...(subjectType === 'HANDLING_UNIT' ? { subjectType } : {}), limit: 100, ...(includeHistory ? { includeHistory: 'true' } : {}) } }),
      providesTags: ['Records'],
    }),
    getEvents: builder.query<Paged<TraceEvent>, { subjectType: RecordSubject; subjectId: string; includeHistory?: boolean }>({
      query: ({ subjectType, subjectId, includeHistory }) => ({ url: '/events', params: { [subjectType === 'SHIPMENT' ? 'shipmentId' : subjectType === 'BATCH' ? 'batchId' : 'subjectId']: subjectId, ...(subjectType === 'HANDLING_UNIT' ? { subjectType } : {}), limit: 100, ...(includeHistory ? { includeHistory: 'true' } : {}) } }),
      providesTags: ['Records'],
    }),
    getRecordableEventTypes: builder.query<Paged<EventType>, RecordSubject>({ query: (subjectType) => ({ url: '/event-types', params: { subjectType, recordable: 'true', active: 'true', limit: 100 } }) }),
    recordReading: builder.mutation<Single<Reading>, { idempotencyKey: string } & Body>({
      query: ({ idempotencyKey, ...body }) => ({ url: '/measurements', method: 'POST', body, headers: idempotencyHeaders(idempotencyKey) }),
      invalidatesTags: ['Records'],
    }),
    checkReading: builder.mutation<Single<Reading>, { id: string; outcome: 'VERIFIED' | 'REJECTED'; note?: string }>({
      query: ({ id, ...body }) => ({ url: `/measurements/${id}/verify`, method: 'POST', body }),
      invalidatesTags: ['Records'],
    }),
    correctReading: builder.mutation<Single<Reading>, { id: string; idempotencyKey: string; reason: string; value: string }>({
      query: ({ id, idempotencyKey, ...body }) => ({ url: `/measurements/${id}/correct`, method: 'POST', body, headers: idempotencyHeaders(idempotencyKey) }),
      invalidatesTags: ['Records'],
    }),
    recordEvent: builder.mutation<Single<TraceEvent>, { idempotencyKey: string } & Body>({
      query: ({ idempotencyKey, ...body }) => ({ url: '/events', method: 'POST', body, headers: idempotencyHeaders(idempotencyKey) }),
      invalidatesTags: ['Records'],
    }),
    checkEvent: builder.mutation<Single<TraceEvent>, { id: string; note?: string }>({
      query: ({ id, ...body }) => ({ url: `/events/${id}/verify`, method: 'POST', body }),
      invalidatesTags: ['Records'],
    }),
    withdrawEvent: builder.mutation<Single<TraceEvent>, { id: string; reason: string }>({
      query: ({ id, reason }) => ({ url: `/events/${id}/invalidate`, method: 'POST', body: { reason } }),
      invalidatesTags: ['Records'],
    }),
    /** Decision #107: readings and events MINMEG released on the trade to the caller's side, with their evidence */
    getReleasedRecords: builder.query<Single<ReleasedRecords>, string>({ query: (tradeId) => `/trades/${tradeId}/released-records`, providesTags: ['Records'] }),
    // ---- inspection results (step 2.8a): nothing reaches the buyer or supplier before MINMEG releases the round ----
    getRoundResults: builder.query<Single<RoundResults>, string>({ query: (assignmentId) => `/inspections/${assignmentId}/results`, providesTags: ['Results'] }),
    uploadInspectionFiles: builder.mutation<{ data: InspectionFile[] }, { assignmentId: string; form: FormData }>({
      query: ({ assignmentId, form }) => ({ url: `/inspector/assignments/${assignmentId}/photos`, method: 'POST', body: form }),
    }),
    submitFindings: builder.mutation<unknown, { assignmentId: string; idempotencyKey: string } & Body>({
      query: ({ assignmentId, idempotencyKey, ...body }) => ({ url: `/inspections/${assignmentId}/results`, method: 'POST', body, headers: idempotencyHeaders(idempotencyKey) }),
      invalidatesTags: ['Results'],
    }),
    submitLabResult: builder.mutation<unknown, { idempotencyKey: string } & Body>({
      query: ({ idempotencyKey, ...body }) => ({ url: '/assay-results', method: 'POST', body, headers: idempotencyHeaders(idempotencyKey) }),
      invalidatesTags: ['Results'],
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
  useGetRoundResultsQuery,
  useGetReadingsQuery,
  useGetEventsQuery,
  useGetRecordableEventTypesQuery,
  useRecordReadingMutation,
  useCheckReadingMutation,
  useCorrectReadingMutation,
  useRecordEventMutation,
  useCheckEventMutation,
  useWithdrawEventMutation,
  useGetReleasedRecordsQuery,
  useUploadInspectionFilesMutation,
  useSubmitFindingsMutation,
  useSubmitLabResultMutation,
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
