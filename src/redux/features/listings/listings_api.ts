import { createApi } from '@reduxjs/toolkit/query/react';
import { idempotencyHeaders } from '@/lib/api/idempotency';
import type { AvailabilityRow, Listing, ListingAction, ListingBatchRow } from '@/lib/listings';
import { listParams, type NamedRecord, type Paged } from '@/lib/batches';
import baseQueryWithReauth from '@/redux/api/baseApi';

/* Group 06 listings (step 2.6). A create sends an Idempotency-Key; nothing here deletes a listing. */
type Body = Record<string, unknown>;
type Query = Record<string, string | number | boolean | null | undefined>;
type Single<T> = { data: T; message?: string };
const CHANGES = ['Listings', 'ListingBatches'] as const;

export const listingsApi = createApi({
  reducerPath: 'listingsApi',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['Listings', 'ListingBatches'],
  endpoints: (builder) => ({
    getListings: builder.query<Paged<Listing>, Query>({ query: (q) => `/listings${listParams(q)}`, providesTags: ['Listings'] }),
    getListing: builder.query<Single<Listing>, string>({ query: (id) => `/listings/${id}`, providesTags: ['Listings'] }),
    createListing: builder.mutation<Single<Listing>, Body & { idempotencyKey: string }>({
      query: ({ idempotencyKey, ...body }) => ({ url: '/listings', method: 'POST', body, headers: idempotencyHeaders(idempotencyKey) }),
      invalidatesTags: [...CHANGES],
    }),
    updateListing: builder.mutation<Single<Listing>, Body & { id: string }>({
      query: ({ id, ...body }) => ({ url: `/listings/${id}`, method: 'PATCH', body }),
      invalidatesTags: [...CHANGES],
    }),
    changeListingStatus: builder.mutation<Single<Listing>, { id: string; action: ListingAction; reason?: string }>({
      query: ({ id, action, reason }) => ({ url: `/listings/${id}/${action}`, method: 'POST', body: reason ? { reason } : {} }),
      invalidatesTags: [...CHANGES],
    }),
    getListingBatches: builder.query<Single<ListingBatchRow[]>, string>({ query: (id) => `/listings/${id}/batches?includeRemoved=true`, providesTags: ['ListingBatches'] }),
    getListingAvailability: builder.query<Single<{ availableQuantity: string; batches: AvailabilityRow[] }>, string>({ query: (id) => `/listings/${id}/availability`, providesTags: ['ListingBatches'] }),
    addListingBatch: builder.mutation<Single<unknown>, { id: string; batchId: string; idempotencyKey?: string }>({
      query: ({ id, batchId }) => ({ url: `/listings/${id}/batches`, method: 'POST', body: { batchId } }),
      invalidatesTags: [...CHANGES],
    }),
    setListingBatchStatus: builder.mutation<Single<unknown>, { id: string; status: 'ACTIVE' | 'SUSPENDED'; reason?: string }>({
      query: ({ id, ...body }) => ({ url: `/listing-batches/${id}`, method: 'PATCH', body }),
      invalidatesTags: [...CHANGES],
    }),
    removeListingBatch: builder.mutation<Single<unknown>, { id: string; batchId: string; reason?: string }>({
      query: ({ id, batchId, reason }) => ({ url: `/listings/${id}/batches/${batchId}`, method: 'DELETE', body: reason ? { reason } : {} }),
      invalidatesTags: [...CHANGES],
    }),
    /** Pictures and attachments stay on the existing media route */
    addListingMedia: builder.mutation<Single<unknown>, { supplierId: string; id: string; kind: 'images' | 'attachments'; files: File[] }>({
      query: ({ supplierId, id, kind, files }) => {
        const form = new FormData();
        for (const f of files) form.append(kind === 'images' ? 'productImages' : 'productAttachments', f);
        return { url: `/suppliers/${supplierId}/products/${id}/media/${kind}`, method: 'PUT', body: form };
      },
      invalidatesTags: ['Listings'],
    }),
    removeListingMedia: builder.mutation<Single<unknown>, { supplierId: string; id: string; kind: 'images' | 'attachments'; mediaId: string }>({
      query: ({ supplierId, id, kind, mediaId }) => ({ url: `/suppliers/${supplierId}/products/${id}/media/${kind}`, method: 'DELETE', body: { mediaUuid: mediaId } }),
      invalidatesTags: ['Listings'],
    }),
    getMarketplaceMaterials: builder.query<Paged<NamedRecord>, void>({ query: () => '/materials?marketplaceEnabled=true&active=true&limit=100' }),
  }),
});

export const {
  useGetListingsQuery,
  useGetListingQuery,
  useCreateListingMutation,
  useUpdateListingMutation,
  useChangeListingStatusMutation,
  useGetListingBatchesQuery,
  useGetListingAvailabilityQuery,
  useAddListingBatchMutation,
  useSetListingBatchStatusMutation,
  useRemoveListingBatchMutation,
  useAddListingMediaMutation,
  useRemoveListingMediaMutation,
  useGetMarketplaceMaterialsQuery,
} = listingsApi;
