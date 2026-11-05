import { createApi } from '@reduxjs/toolkit/query/react';
import { idempotencyHeaders } from '@/lib/api/idempotency';
import type { Readiness, Shipment } from '@/lib/shipments';
import type { Alert, Ping, PlanRow, TrackingView } from '@/lib/tracking';
import baseQueryWithReauth from '@/redux/api/baseApi';
import type { OperationalAlert } from '@/lib/alerts';

/* Group 09 shipments (step 2.7a). Anything that moves stock sends an Idempotency-Key where the backend takes one. */
type Body = Record<string, unknown>;
type Query = Record<string, string | number | undefined>;
type Single<T> = { data: T };
type Paged<T> = { data: T[]; meta: { currentPage: number; totalPages: number; totalItems: number } };
type Action = 'dispatch' | 'arrive' | 'deliver' | 'reject' | 'reconcile' | 'return' | 'cancel' | 'close';

export const shipmentsApi = createApi({
  reducerPath: 'shipmentsApi',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['Shipments', 'Tracking'],
  endpoints: (builder) => ({
    getShipments: builder.query<Paged<Shipment>, Query>({ query: (params) => ({ url: '/shipments', params }), providesTags: ['Shipments'] }),
    getShipment: builder.query<Single<Shipment>, string>({ query: (id) => `/shipments/${id}`, providesTags: ['Shipments'] }),
    getReadiness: builder.query<Single<Readiness>, string>({ query: (id) => `/shipments/${id}/dispatch-readiness`, providesTags: ['Shipments'] }),
    createShipment: builder.mutation<Single<Shipment>, Body & { idempotencyKey: string }>({
      query: ({ idempotencyKey, ...body }) => ({ url: '/shipments', method: 'POST', body, headers: idempotencyHeaders(idempotencyKey) }),
      invalidatesTags: ['Shipments'],
    }),
    updateShipment: builder.mutation<Single<Shipment>, Body & { id: string }>({
      query: ({ id, ...body }) => ({ url: `/shipments/${id}`, method: 'PATCH', body }),
      invalidatesTags: ['Shipments'],
    }),
    removeLine: builder.mutation<unknown, { id: string; lineId: string }>({
      query: ({ id, lineId }) => ({ url: `/shipments/${id}/allocations/${lineId}`, method: 'DELETE' }),
      invalidatesTags: ['Shipments'],
    }),
    shipmentAction: builder.mutation<Single<Shipment>, { id: string; action: Action; body?: Body; idempotencyKey?: string }>({
      query: ({ id, action, body, idempotencyKey }) => ({ url: `/shipments/${id}/${action}`, method: 'POST', body: body ?? {}, headers: idempotencyKey ? idempotencyHeaders(idempotencyKey) : undefined }),
      invalidatesTags: ['Shipments'],
    }),
    // ---- tracking (step 2.7b) ----
    getTracking: builder.query<Single<TrackingView>, string>({ query: (id) => `/shipments/${id}/tracking`, providesTags: ['Tracking'] }),
    getHistory: builder.query<Single<Ping[]>, string>({ query: (id) => `/shipments/${id}/location-history?limit=2000`, providesTags: ['Tracking'] }),
    setCheckpointPlan: builder.mutation<Single<PlanRow[]>, { id: string; checkpoints: { checkpointId: string; required: boolean; skipAllowed: boolean }[] }>({
      query: ({ id, checkpoints }) => ({ url: `/shipments/${id}/checkpoint-plan`, method: 'PUT', body: { checkpoints } }),
      invalidatesTags: ['Tracking'],
    }),
    skipCheckpoint: builder.mutation<unknown, { rowId: string; reason: string }>({
      query: ({ rowId, reason }) => ({ url: `/shipment-checkpoints/${rowId}/skip`, method: 'POST', body: { reason } }),
      invalidatesTags: ['Tracking'],
    }),
    scanCheckpoint: builder.mutation<unknown, { id: string; checkpointId: string; body: Body }>({
      query: ({ id, checkpointId, body }) => ({ url: `/shipments/${id}/checkpoints/${checkpointId}/scan`, method: 'POST', body }),
      invalidatesTags: ['Tracking', 'Shipments'],
    }),
    /** Step 2.13b: every alert on the company's shipments */
    getAlerts: builder.query<Paged<OperationalAlert>, Record<string, string | number | boolean | undefined>>({ query: (q) => ({ url: '/alerts', params: Object.fromEntries(Object.entries(q).filter(([, v]) => v !== '' && v !== undefined)) }), providesTags: ['Tracking'] }),
    getShipmentAlerts: builder.query<Paged<Alert>, string>({ query: (shipmentId) => ({ url: '/alerts', params: { shipmentId, limit: 50 } }), providesTags: ['Tracking'] }),
    getAlert: builder.query<{ success: boolean; data: OperationalAlert }, string>({ query: (id) => `/alerts/${id}`, providesTags: ['Tracking'] }),
    acknowledgeAlert: builder.mutation<unknown, { id: string; note?: string }>({
      query: ({ id, note }) => ({ url: `/alerts/${id}/acknowledge`, method: 'POST', body: note ? { note } : {} }),
      invalidatesTags: ['Tracking'],
    }),
  }),
});

export const { useGetShipmentsQuery, useGetShipmentQuery, useGetReadinessQuery, useCreateShipmentMutation, useUpdateShipmentMutation, useRemoveLineMutation, useShipmentActionMutation, useGetTrackingQuery, useGetHistoryQuery, useSetCheckpointPlanMutation, useSkipCheckpointMutation, useScanCheckpointMutation, useGetShipmentAlertsQuery, useAcknowledgeAlertMutation, useGetAlertsQuery, useGetAlertQuery } = shipmentsApi;
