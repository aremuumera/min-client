import { createApi } from '@reduxjs/toolkit/query/react';
import type { InboxItem, InboxPage, NotificationSettings, Single } from '@/lib/notifications';
import baseQueryWithReauth from '@/redux/api/baseApi';

/* Step 2.13: the notification inbox and settings (Group 24, decision #113) */
type Query = Record<string, string | number | boolean | undefined>;
const params = (q: Query) => Object.fromEntries(Object.entries(q).filter(([, v]) => v !== '' && v !== undefined && v !== false));

export const notificationsApi = createApi({
  reducerPath: 'notificationsApi',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['Inbox', 'Settings'],
  endpoints: (builder) => ({
    getInbox: builder.query<InboxPage<InboxItem>, Query>({ query: (q) => ({ url: '/notifications', params: params(q) }), providesTags: ['Inbox'] }),
    getUnread: builder.query<Single<{ unread: number }>, void>({ query: () => '/notifications/unread-count', providesTags: ['Inbox'] }),
    readOne: builder.mutation<unknown, string>({ query: (id) => ({ url: `/notifications/${id}/read`, method: 'PATCH' }), invalidatesTags: ['Inbox'] }),
    dismissOne: builder.mutation<unknown, string>({ query: (id) => ({ url: `/notifications/${id}/dismiss`, method: 'PATCH' }), invalidatesTags: ['Inbox'] }),
    acknowledgeOne: builder.mutation<unknown, string>({ query: (id) => ({ url: `/notifications/${id}/acknowledge`, method: 'POST' }), invalidatesTags: ['Inbox'] }),
    readAll: builder.mutation<unknown, { category?: string }>({ query: (body) => ({ url: '/notifications/read-all', method: 'POST', body }), invalidatesTags: ['Inbox'] }),
    getNotificationSettings: builder.query<Single<NotificationSettings>, void>({ query: () => '/users/me/settings', providesTags: ['Settings'] }),
    updateNotificationSettings: builder.mutation<Single<NotificationSettings>, Record<string, unknown>>({ query: (body) => ({ url: '/users/me/settings', method: 'PATCH', body }), invalidatesTags: ['Settings'] }),
  }),
});

export const { useGetInboxQuery, useGetUnreadQuery, useReadOneMutation, useDismissOneMutation, useAcknowledgeOneMutation, useReadAllMutation, useGetNotificationSettingsQuery, useUpdateNotificationSettingsMutation } = notificationsApi;
