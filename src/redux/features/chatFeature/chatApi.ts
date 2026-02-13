import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQueryWithReauth } from '@/redux/api/baseApi';

export const chatApi = createApi({
    reducerPath: 'chatApi',
    baseQuery: baseQueryWithReauth,
    tagTypes: ['chat'],
    endpoints: (builder) => ({
        sendChatEmailNotif: builder.mutation({
            query: (data) => ({
                url: `/notifications/chat`,
                method: 'POST',
                body: data,
            }),
            invalidatesTags: ['chat'],
        }),

        sendBatchChatEmailNotif: builder.mutation({
            query: (data) => ({
                url: `/notifications/chat/batch`,
                method: 'POST',
                body: data,
            }),
            invalidatesTags: ['chat'],
        }),
    }),
});

export const {
    useSendChatEmailNotifMutation,
    useSendBatchChatEmailNotifMutation
} = chatApi;

export default chatApi;
