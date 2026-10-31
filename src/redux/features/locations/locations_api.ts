import { createApi } from '@reduxjs/toolkit/query/react';
import { idempotencyHeaders } from '@/lib/api/idempotency';
import { listParams, type Checkpoint, type Location, type Paged } from '@/lib/locations';
import baseQueryWithReauth from '@/redux/api/baseApi';

/* Group 04 locations and checkpoints (step 2.4). Every create sends an Idempotency-Key; nothing here deletes. */
type Body = Record<string, unknown>;
type Query = Record<string, string | number | boolean | null | undefined>;
type Single<T> = { data: T; message?: string };
type Create = Body & { idempotencyKey: string };

export const locationsApi = createApi({
  reducerPath: 'locationsApi',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['Locations', 'Checkpoints'],
  endpoints: (builder) => ({
    getLocations: builder.query<Paged<Location>, Query>({ query: (q) => `/locations${listParams(q)}`, providesTags: ['Locations'] }),
    getLocation: builder.query<Single<Location>, string>({ query: (id) => `/locations/${id}`, providesTags: ['Locations'] }),
    createLocation: builder.mutation<Single<Location>, Create>({
      query: ({ idempotencyKey, ...body }) => ({ url: '/locations', method: 'POST', body, headers: idempotencyHeaders(idempotencyKey) }),
      invalidatesTags: ['Locations'],
    }),
    updateLocation: builder.mutation<Single<Location>, Body & { id: string }>({
      query: ({ id, ...body }) => ({ url: `/locations/${id}`, method: 'PATCH', body }),
      invalidatesTags: ['Locations', 'Checkpoints'],
    }),
    setLocationActive: builder.mutation<Single<Location>, { id: string; active: boolean }>({
      query: ({ id, active }) => ({ url: `/locations/${id}/${active ? 'activate' : 'deactivate'}`, method: 'POST' }),
      invalidatesTags: ['Locations', 'Checkpoints'],
    }),
    getLocationCheckpoints: builder.query<Single<Checkpoint[]>, string>({ query: (id) => `/locations/${id}/checkpoints`, providesTags: ['Checkpoints'] }),
    getCheckpoints: builder.query<Paged<Checkpoint>, Query>({ query: (q) => `/checkpoints${listParams(q)}`, providesTags: ['Checkpoints'] }),
    createCheckpoint: builder.mutation<Single<Checkpoint>, Create>({
      query: ({ idempotencyKey, ...body }) => ({ url: '/checkpoints', method: 'POST', body, headers: idempotencyHeaders(idempotencyKey) }),
      invalidatesTags: ['Checkpoints', 'Locations'],
    }),
    updateCheckpoint: builder.mutation<Single<Checkpoint>, Body & { id: string }>({
      query: ({ id, ...body }) => ({ url: `/checkpoints/${id}`, method: 'PATCH', body }),
      invalidatesTags: ['Checkpoints'],
    }),
    setCheckpointActive: builder.mutation<Single<Checkpoint>, { id: string; active: boolean }>({
      query: ({ id, active }) => ({ url: `/checkpoints/${id}/${active ? 'activate' : 'deactivate'}`, method: 'POST' }),
      invalidatesTags: ['Checkpoints', 'Locations'],
    }),
    /** For a checkpoint's required measurements */
    getMeasurementChoices: builder.query<Paged<{ id: string; code: string; name: string }>, void>({ query: () => '/measurement-types?active=true&limit=100' }),
  }),
});

export const {
  useGetLocationsQuery,
  useGetLocationQuery,
  useCreateLocationMutation,
  useUpdateLocationMutation,
  useSetLocationActiveMutation,
  useGetLocationCheckpointsQuery,
  useGetCheckpointsQuery,
  useCreateCheckpointMutation,
  useUpdateCheckpointMutation,
  useSetCheckpointActiveMutation,
  useGetMeasurementChoicesQuery,
} = locationsApi;
