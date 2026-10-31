import { createApi } from '@reduxjs/toolkit/query/react';
import baseQueryWithReauth from '@/redux/api/baseApi';
import { idempotencyHeaders } from '@/lib/api/idempotency';
import {
  listParams,
  type AccessLogEntry,
  type Assignment,
  type Attachment,
  type ContentLink,
  type FileClass,
  type FolderTree,
  type Grant,
  type GranteeType,
  type GrantPermission,
  type Paged,
  type ResourceVisibility,
  type ShareOpened,
  type SharePermission,
  type ShareScope,
  type ShareLink,
  type ShareLinkCreated,
  type VaultFile,
  type VisibilityPolicy,
} from '@/lib/vault';

/*
 * Group 03 document vault, plus the Group 02 calls for who can see a vault file (step 2.3 B1–B3).
 * The upload's second step (the bytes) goes through lib/vault-upload.ts for progress.
 */
type Single<T> = { data: T; message?: string };
type Query = Record<string, string | number | boolean | null | undefined>;

export interface InitiateUploadBody {
  folderId: string | null;
  originalFilename: string;
  displayName?: string;
  mimeType: string;
  sizeBytes: number;
  fileClass: FileClass;
  idempotencyKey: string;
}

export interface CreateShareLinkBody {
  fileId: string;
  accessScope: ShareScope;
  targetOrganizationId?: string;
  targetEmail?: string;
  sendToEmail?: string;
  permission: SharePermission;
  expiresAt: string | null;
  maxUses?: number;
  idempotencyKey: string;
}

export interface CreateGrantBody {
  resourceType: 'FILE_ASSET';
  resourceId: string;
  granteeType: GranteeType;
  granteeId: string;
  permissions: GrantPermission[];
  expiresAt?: string;
  reason?: string;
  idempotencyKey: string;
}

export const vaultApi = createApi({
  reducerPath: 'vaultApi',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['Folders', 'Files', 'ShareLinks', 'AccessLog', 'Grants', 'Visibility', 'Evidence'],
  endpoints: (builder) => ({
    // ---------- folders ----------
    getFolderTree: builder.query<Single<FolderTree>, void>({ query: () => '/storage/folders', providesTags: ['Folders'] }),
    createFolder: builder.mutation<Single<unknown>, { parentFolderId: string | null; name: string; description?: string | null; idempotencyKey: string }>({
      query: ({ idempotencyKey, ...body }) => ({ url: '/storage/folders', method: 'POST', body, headers: idempotencyHeaders(idempotencyKey) }),
      invalidatesTags: ['Folders'],
    }),
    updateFolder: builder.mutation<Single<unknown>, { id: string; name?: string; description?: string | null }>({
      query: ({ id, ...body }) => ({ url: `/storage/folders/${id}`, method: 'PATCH', body }),
      invalidatesTags: ['Folders'],
    }),
    moveFolder: builder.mutation<Single<unknown>, { id: string; parentFolderId: string | null }>({
      query: ({ id, ...body }) => ({ url: `/storage/folders/${id}/move`, method: 'POST', body }),
      invalidatesTags: ['Folders'],
    }),
    archiveFolder: builder.mutation<Single<unknown>, string>({
      query: (id) => ({ url: `/storage/folders/${id}/archive`, method: 'POST' }),
      invalidatesTags: ['Folders', 'Files'],
    }),

    // ---------- files ----------
    getFiles: builder.query<Paged<VaultFile>, Query>({ query: (q) => `/storage/files${listParams(q)}`, providesTags: ['Files'] }),
    getFile: builder.query<Single<VaultFile>, string>({ query: (id) => `/storage/files/${id}`, providesTags: ['Files'] }),
    initiateUpload: builder.mutation<Single<{ file: VaultFile; upload: { url: string; expiresAt: string } }>, InitiateUploadBody>({
      query: ({ idempotencyKey, ...body }) => ({ url: '/storage/files/initiate-upload', method: 'POST', body, headers: idempotencyHeaders(idempotencyKey) }),
    }),
    updateFile: builder.mutation<Single<VaultFile>, { id: string; displayName?: string; fileClass?: FileClass; accessMode?: string; visibilityPolicyId?: string | null }>({
      query: ({ id, ...body }) => ({ url: `/storage/files/${id}`, method: 'PATCH', body }),
      invalidatesTags: ['Files', 'Visibility'],
    }),
    moveFile: builder.mutation<Single<VaultFile>, { id: string; folderId: string | null }>({
      query: ({ id, ...body }) => ({ url: `/storage/files/${id}/move`, method: 'POST', body }),
      invalidatesTags: ['Files', 'Folders'],
    }),
    setFileArchived: builder.mutation<Single<VaultFile>, { id: string; archived: boolean }>({
      query: ({ id, archived }) => ({ url: `/storage/files/${id}/${archived ? 'archive' : 'restore'}`, method: 'POST' }),
      invalidatesTags: ['Files', 'Folders'],
    }),
    deleteFile: builder.mutation<Single<VaultFile>, { id: string; reason: string }>({
      query: ({ id, reason }) => ({ url: `/storage/files/${id}`, method: 'DELETE', body: { reason } }),
      invalidatesTags: ['Files', 'Folders'],
    }),
    /** A 10-minute link; every request is logged */
    contentLink: builder.mutation<Single<ContentLink>, { id: string; kind: 'preview' | 'download' }>({
      query: ({ id, kind }) => ({ url: `/storage/files/${id}/${kind}-url`, method: 'POST' }),
      invalidatesTags: ['AccessLog'],
    }),
    getAccessLog: builder.query<Paged<AccessLogEntry>, { id: string; page: number; limit: number }>({
      query: ({ id, ...q }) => `/storage/files/${id}/access-log${listParams(q)}`,
      providesTags: ['AccessLog'],
    }),

    // ---------- share links ----------
    getShareLinks: builder.query<Single<ShareLink[]>, string>({ query: (id) => `/storage/files/${id}/share-links`, providesTags: ['ShareLinks'] }),
    createShareLink: builder.mutation<Single<ShareLinkCreated>, CreateShareLinkBody>({
      query: ({ fileId, idempotencyKey, ...body }) => ({ url: `/storage/files/${fileId}/share-links`, method: 'POST', body, headers: idempotencyHeaders(idempotencyKey) }),
      invalidatesTags: ['ShareLinks', 'Files'],
    }),
    revokeShareLink: builder.mutation<Single<ShareLink>, { id: string; reason: string }>({
      query: ({ id, reason }) => ({ url: `/storage/share-links/${id}`, method: 'DELETE', body: { reason } }),
      invalidatesTags: ['ShareLinks', 'Files'],
    }),

    /** Opens a signed-in-only link with this session; each open counts towards its limit */
    openShareLink: builder.mutation<Single<ShareOpened>, string>({ query: (token) => `/storage/share/${token}` }),

    // ---------- company evidence (Group 02 on ORGANIZATION) ----------
    getCompanyEvidence: builder.query<Single<Attachment[]>, string>({ query: (orgId) => `/resources/ORGANIZATION/${orgId}/attachments`, providesTags: ['Evidence'] }),
    attachEvidence: builder.mutation<Single<Attachment>, { resourceId: string; fileAssetId: string; attachmentType: string; title?: string; validUntil?: string; idempotencyKey: string }>({
      query: ({ idempotencyKey, ...body }) => ({ url: '/resource-attachments', method: 'POST', body: { ...body, resourceType: 'ORGANIZATION' }, headers: idempotencyHeaders(idempotencyKey) }),
      invalidatesTags: ['Evidence', 'Files'],
    }),
    unlinkEvidence: builder.mutation<Single<Attachment>, { id: string; reason: string }>({
      query: ({ id, reason }) => ({ url: `/resource-attachments/${id}`, method: 'DELETE', body: { reason } }),
      invalidatesTags: ['Evidence', 'Files'],
    }),
    getCompanyLabels: builder.query<Single<Assignment[]>, string>({ query: (orgId) => `/resources/ORGANIZATION/${orgId}/labels` }),
    getCompanyTags: builder.query<Single<Assignment[]>, string>({ query: (orgId) => `/resources/ORGANIZATION/${orgId}/tags` }),

    // ---------- who can see a file (Group 02) ----------
    getVisibilityPolicies: builder.query<Paged<VisibilityPolicy>, void>({ query: () => '/visibility-policies?active=true&limit=100' }),
    getVisibility: builder.query<Single<ResourceVisibility>, string>({ query: (fileId) => `/resource-visibility/FILE_ASSET/${fileId}`, providesTags: ['Visibility'] }),
    setVisibility: builder.mutation<Single<unknown>, { fileId: string; visibilityPolicyId: string; reason?: string }>({
      query: ({ fileId, ...body }) => ({ url: `/resource-visibility/FILE_ASSET/${fileId}`, method: 'PUT', body: { ...body, contextType: 'DEFAULT' } }),
      invalidatesTags: ['Visibility'],
    }),
    getGrants: builder.query<Paged<Grant>, Query>({ query: (q) => `/resource-acl/grants${listParams(q)}`, providesTags: ['Grants'] }),
    createGrant: builder.mutation<Single<Grant>, CreateGrantBody>({
      query: ({ idempotencyKey, ...body }) => ({ url: '/resource-acl/grants', method: 'POST', body, headers: idempotencyHeaders(idempotencyKey) }),
      invalidatesTags: ['Grants'],
    }),
    revokeGrant: builder.mutation<Single<Grant>, { id: string; reason: string }>({
      query: ({ id, reason }) => ({ url: `/resource-acl/grants/${id}/revoke`, method: 'POST', body: { reason } }),
      invalidatesTags: ['Grants'],
    }),
  }),
});

export const {
  useGetFolderTreeQuery,
  useCreateFolderMutation,
  useUpdateFolderMutation,
  useMoveFolderMutation,
  useArchiveFolderMutation,
  useGetFilesQuery,
  useGetFileQuery,
  useInitiateUploadMutation,
  useUpdateFileMutation,
  useMoveFileMutation,
  useSetFileArchivedMutation,
  useDeleteFileMutation,
  useContentLinkMutation,
  useGetAccessLogQuery,
  useGetShareLinksQuery,
  useCreateShareLinkMutation,
  useRevokeShareLinkMutation,
  useOpenShareLinkMutation,
  useGetCompanyEvidenceQuery,
  useAttachEvidenceMutation,
  useUnlinkEvidenceMutation,
  useGetCompanyLabelsQuery,
  useGetCompanyTagsQuery,
  useGetVisibilityPoliciesQuery,
  useGetVisibilityQuery,
  useSetVisibilityMutation,
  useGetGrantsQuery,
  useCreateGrantMutation,
  useRevokeGrantMutation,
} = vaultApi;
