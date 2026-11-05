import { createApi } from '@reduxjs/toolkit/query/react';
import type { ChainCheck, Inclusion, Paged, Proof, ProofSubject, Single } from '@/lib/proof';
import baseQueryWithReauth from '@/redux/api/baseApi';

/* Step 2.11c: a record's proof, as its reader may see it (Groups 19 to 22, decision #111) */
export const proofApi = createApi({
  reducerPath: 'proofApi',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['Proof'],
  endpoints: (builder) => ({
    getRecordProofs: builder.query<Paged<Proof>, { subjectType: ProofSubject; subjectId: string }>({ query: (q) => ({ url: '/proofs', params: { ...q, limit: 5 } }), providesTags: ['Proof'] }),
    getChainChecks: builder.query<Paged<ChainCheck>, string>({ query: (proofRecordId) => ({ url: '/blockchain-verifications', params: { proofRecordId, limit: 1 } }), providesTags: ['Proof'] }),
    checkOnChain: builder.mutation<Single<ChainCheck>, string>({ query: (proofRecordId) => ({ url: '/blockchain-verifications', method: 'POST', body: { proofRecordId } }), invalidatesTags: ['Proof'] }),
    getInclusion: builder.query<Single<Inclusion>, string>({ query: (proofRecordId) => `/merkle-proofs/${proofRecordId}` }),
  }),
});

export const { useGetRecordProofsQuery, useGetChainChecksQuery, useCheckOnChainMutation, useGetInclusionQuery } = proofApi;
