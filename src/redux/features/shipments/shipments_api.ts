import { createApi } from '@reduxjs/toolkit/query/react';
import { idempotencyHeaders } from '@/lib/api/idempotency';
import type { Readiness, Shipment } from '@/lib/shipments';
import baseQueryWithReauth from '@/redux/api/baseApi';

/* Group 09 shipments (step 2.7a). Anything that moves stock sends an Idempotency-Key where the backend takes one. */
type Body = Record<string, unknown>;
type Query = Record<string, string | number | undefined>;
type Single<T> = { data: T };
type Paged<T> = { data: T[]; meta: { currentPage: number; totalPages: number; totalItems: number } };
type Action = 'dispatch' | 'arrive' | 'deliver' | 'reject' | 'reconcile' | 'return' | 'cancel' | 'close';

export const shipmentsApi = createApi({
  reducerPath: 'shipmentsApi',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['Shipments'],
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
  }),
});

export const { useGetShipmentsQuery, useGetShipmentQuery, useGetReadinessQuery, useCreateShipmentMutation, useUpdateShipmentMutation, useRemoveLineMutation, useShipmentActionMutation } = shipmentsApi;
