import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { config } from '@/lib/config';
import baseQueryWithReauth from '@/redux/api/baseApi';

export interface TeamMember {
    id: string; // external_id
    firstName: string;
    lastName: string;
    email: string;
    team_role: 'admin' | 'marketer' | 'customer_care' | 'operations_manager';
    permissions: string[];
    status: 'invited' | 'active' | 'deactivated';
    createdAt: string;
}

export interface InviteRequest {
    email: string;
    firstName: string;
    lastName: string;
    team_role: string;
    permissions: string[];
}

export interface UpdateRequest {
    id: string;
    team_role?: string;
    permissions?: string[];
    status?: string;
}

export const teamApi = createApi({
    reducerPath: 'teamApi',
    baseQuery: baseQueryWithReauth,
    tagTypes: ['TeamMembers'],
    endpoints: (builder) => ({
        getTeamMembers: builder.query<{ data: TeamMember[] }, void>({
            query: () => '/team/members',
            providesTags: ['TeamMembers'],
        }),
        getTeamMember: builder.query<{ data: TeamMember }, string>({
            query: (id) => `/team/members/${id}`,
            providesTags: (result, error, id) => [{ type: 'TeamMembers', id }],
        }),
        inviteTeamMember: builder.mutation<void, InviteRequest>({
            query: (body) => ({
                url: '/team/invite',
                method: 'POST',
                body,
            }),
            invalidatesTags: ['TeamMembers'],
        }),
        updateTeamMember: builder.mutation<void, UpdateRequest>({
            query: ({ id, ...body }) => ({
                url: `/team/members/${id}`,
                method: 'PUT',
                body,
            }),
            invalidatesTags: (result, error, { id }) => [{ type: 'TeamMembers', id }, 'TeamMembers'],
        }),
        deleteTeamMember: builder.mutation<void, string>({
            query: (id) => ({
                url: `/team/members/${id}`,
                method: 'DELETE',
            }),
            invalidatesTags: ['TeamMembers'],
        }),
        resendInvite: builder.mutation<void, { email: string }>({
            query: (body) => ({
                url: '/team/resend-invite',
                method: 'POST',
                body,
            }),
        }),
    }),
});

export const {
    useGetTeamMembersQuery,
    useGetTeamMemberQuery,
    useInviteTeamMemberMutation,
    useUpdateTeamMemberMutation,
    useDeleteTeamMemberMutation,
    useResendInviteMutation,
} = teamApi;
