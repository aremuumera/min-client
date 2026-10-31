import { createApi } from '@reduxjs/toolkit/query/react';
import { idempotencyHeaders } from '@/lib/api/idempotency';
import { listParams, type Batch, type BatchAttachment, type BatchTree, type HistoryItem, type LedgerEntry, type NamedRecord, type Paged, type ReviewEntry, type UnitChoice } from '@/lib/batches';
import baseQueryWithReauth from '@/redux/api/baseApi';

/* Group 05 batches and the quantity ledger (step 2.5). Anything that moves quantity sends an Idempotency-Key; nothing here deletes. */
type Body = Record<string, unknown>;
type Query = Record<string, string | number | boolean | null | undefined>;
type Single<T> = { data: T; message?: string };
type Create = Body & { idempotencyKey: string };
type OnBatch = Create & { id: string };
const CHANGES = ['Batches', 'Ledger', 'Tree', 'History'] as const;

export const batchesApi = createApi({
  reducerPath: 'batchesApi',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['Batches', 'Ledger', 'Tree', 'History', 'Attachments'],
  endpoints: (builder) => ({
    getBatches: builder.query<Paged<Batch>, Query>({ query: (q) => `/batches${listParams(q)}`, providesTags: ['Batches'] }),
    getBatch: builder.query<Single<Batch>, string>({ query: (id) => `/batches/${id}`, providesTags: ['Batches'] }),
    createBatch: builder.mutation<Single<Batch>, Create>({
      query: ({ idempotencyKey, ...body }) => ({ url: '/batches', method: 'POST', body, headers: idempotencyHeaders(idempotencyKey) }),
      invalidatesTags: [...CHANGES],
    }),
    updateBatch: builder.mutation<Single<Batch>, Body & { id: string }>({
      query: ({ id, ...body }) => ({ url: `/batches/${id}`, method: 'PATCH', body }),
      invalidatesTags: [...CHANGES],
    }),
    splitBatch: builder.mutation<Single<{ children: Batch[] }>, OnBatch>({
      query: ({ id, idempotencyKey, ...body }) => ({ url: `/batches/${id}/split`, method: 'POST', body, headers: idempotencyHeaders(idempotencyKey) }),
      invalidatesTags: [...CHANGES],
    }),
    mergeBatches: builder.mutation<Single<{ merged: Batch }>, Create>({
      query: ({ idempotencyKey, ...body }) => ({ url: '/batches/merge', method: 'POST', body, headers: idempotencyHeaders(idempotencyKey) }),
      invalidatesTags: [...CHANGES],
    }),
    transformBatch: builder.mutation<Single<{ outputs: Batch[] }>, OnBatch>({
      query: ({ id, idempotencyKey, ...body }) => ({ url: `/batches/${id}/transform`, method: 'POST', body, headers: idempotencyHeaders(idempotencyKey) }),
      invalidatesTags: [...CHANGES],
    }),
    getLedger: builder.query<Paged<LedgerEntry>, Query & { id: string }>({ query: ({ id, ...q }) => `/batches/${id}/ledger${listParams(q)}`, providesTags: ['Ledger'] }),
    adjustBatch: builder.mutation<Single<{ approvalRequired: boolean }>, OnBatch>({
      query: ({ id, idempotencyKey, ...body }) => ({ url: `/batches/${id}/ledger/adjustments`, method: 'POST', body, headers: idempotencyHeaders(idempotencyKey) }),
      invalidatesTags: [...CHANGES],
    }),
    reconcileBatch: builder.mutation<Single<{ status: 'MATCHED' | 'ADJUSTED' | 'PENDING_APPROVAL' }>, OnBatch>({
      query: ({ id, idempotencyKey, ...body }) => ({ url: `/batches/${id}/reconcile`, method: 'POST', body, headers: idempotencyHeaders(idempotencyKey) }),
      invalidatesTags: [...CHANGES],
    }),
    getBatchTree: builder.query<Single<BatchTree>, string>({ query: (id) => `/batches/${id}/traceability-tree?depth=25`, providesTags: ['Tree'] }),
    getBatchHistory: builder.query<Single<{ items: HistoryItem[] }>, string>({ query: (id) => `/batches/${id}/history?limit=100`, providesTags: ['History'] }),
    quarantineBatch: builder.mutation<Single<Batch>, { id: string; reason: string }>({
      query: ({ id, reason }) => ({ url: `/batches/${id}/quarantine`, method: 'POST', body: { reason } }),
      invalidatesTags: [...CHANGES],
    }),
    releaseBatch: builder.mutation<Single<Batch>, { id: string; note: string }>({
      query: ({ id, note }) => ({ url: `/batches/${id}/release-quarantine`, method: 'POST', body: { note } }),
      invalidatesTags: [...CHANGES],
    }),
    retireBatch: builder.mutation<Single<Batch>, { id: string; reason: 'DEPLETED' | 'OTHER'; note: string }>({
      query: ({ id, ...body }) => ({ url: `/batches/${id}/retire`, method: 'POST', body }),
      invalidatesTags: [...CHANGES],
    }),
    getBatchAttachments: builder.query<Single<BatchAttachment[]>, string>({ query: (id) => `/resources/BATCH/${id}/attachments`, providesTags: ['Attachments'] }),
    attachToBatch: builder.mutation<Single<BatchAttachment>, { resourceId: string; fileAssetId: string; attachmentType: string; title?: string; idempotencyKey: string }>({
      query: ({ idempotencyKey, ...body }) => ({ url: '/resource-attachments', method: 'POST', body: { ...body, resourceType: 'BATCH' }, headers: idempotencyHeaders(idempotencyKey) }),
      invalidatesTags: ['Attachments'],
    }),
    unlinkFromBatch: builder.mutation<Single<BatchAttachment>, { id: string; reason: string }>({
      query: ({ id, reason }) => ({ url: `/resource-attachments/${id}`, method: 'DELETE', body: { reason } }),
      invalidatesTags: ['Attachments'],
    }),
    /** Choices for the forms: materials that can have batches, and units */
    getMaterialChoices: builder.query<Paged<NamedRecord>, void>({ query: () => '/materials?batchEnabled=true&active=true&limit=100' }),
    getUnitChoices: builder.query<Paged<UnitChoice>, void>({ query: () => '/measurement-units?active=true&limit=100' }),
    /** Staff only: the changes waiting for review, and reversing an entry */
    getLedgerReview: builder.query<Paged<ReviewEntry>, Query>({ query: (q) => `/quantity-ledger${listParams(q)}`, providesTags: ['Ledger'] }),
    approveEntry: builder.mutation<Single<unknown>, { id: string; note?: string }>({
      query: ({ id, note }) => ({ url: `/quantity-ledger/${id}/approve`, method: 'POST', body: note ? { note } : {} }),
      invalidatesTags: [...CHANGES],
    }),
    rejectEntry: builder.mutation<Single<unknown>, { id: string; note: string }>({
      query: ({ id, note }) => ({ url: `/quantity-ledger/${id}/reject`, method: 'POST', body: { note } }),
      invalidatesTags: [...CHANGES],
    }),
    reverseEntry: builder.mutation<Single<unknown>, { id: string; reason: string; idempotencyKey: string }>({
      query: ({ id, reason, idempotencyKey }) => ({ url: `/quantity-ledger/${id}/reverse`, method: 'POST', body: { reason }, headers: idempotencyHeaders(idempotencyKey) }),
      invalidatesTags: [...CHANGES],
    }),
  }),
});

export const {
  useGetBatchesQuery,
  useGetBatchQuery,
  useCreateBatchMutation,
  useUpdateBatchMutation,
  useSplitBatchMutation,
  useMergeBatchesMutation,
  useTransformBatchMutation,
  useGetLedgerQuery,
  useAdjustBatchMutation,
  useReconcileBatchMutation,
  useGetBatchTreeQuery,
  useGetBatchHistoryQuery,
  useQuarantineBatchMutation,
  useReleaseBatchMutation,
  useRetireBatchMutation,
  useGetBatchAttachmentsQuery,
  useAttachToBatchMutation,
  useUnlinkFromBatchMutation,
  useGetMaterialChoicesQuery,
  useGetUnitChoicesQuery,
  useGetLedgerReviewQuery,
  useApproveEntryMutation,
  useRejectEntryMutation,
  useReverseEntryMutation,
} = batchesApi;
