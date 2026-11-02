import { createApi } from '@reduxjs/toolkit/query/react';
import { idempotencyHeaders } from '@/lib/api/idempotency';
import type { MySupportConversation, SupportMessagesPage } from '@/lib/support';
import baseQueryWithReauth from '@/redux/api/baseApi';

/* A company's one conversation with MINMEG (step 2.6d). The backend reads and writes the messages. */
export const supportApi = createApi({
  reducerPath: 'supportApi',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['Support'],
  endpoints: (builder) => ({
    getMySupport: builder.query<{ data: MySupportConversation | null }, void>({ query: () => '/support/conversation', providesTags: ['Support'] }),
    getMySupportMessages: builder.query<{ data: SupportMessagesPage }, { before?: string; limit?: number }>({
      query: (params) => ({ url: '/support/conversation/messages', params }),
      providesTags: ['Support'],
    }),
    sendSupportMessage: builder.mutation<unknown, { form: FormData; idempotencyKey: string }>({
      query: ({ form, idempotencyKey }) => ({ url: '/support/conversation/messages', method: 'POST', body: form, headers: idempotencyHeaders(idempotencyKey) }),
      invalidatesTags: ['Support'],
    }),
    readMySupport: builder.mutation<unknown, void>({
      query: () => ({ url: '/support/conversation/read', method: 'POST' }),
      invalidatesTags: (_r, _e) => [],
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        await queryFulfilled;
        dispatch(supportApi.util.updateQueryData('getMySupport', undefined, (draft) => {
          if (draft.data) draft.data.unread = 0;
        }));
      },
    }),
  }),
});

export const { useGetMySupportQuery, useGetMySupportMessagesQuery, useLazyGetMySupportMessagesQuery, useSendSupportMessageMutation, useReadMySupportMutation } = supportApi;
