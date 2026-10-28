'use client';

import * as React from 'react';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';
import { Button, ConfirmDialog, DataTable, PageHeader, StatusBadge } from '@/components/ui';
import { TeamMemberSheet } from '@/components/team/team-member-sheet';
import { toApiError } from '@/lib/api/errors';
import { formatDate } from '@/lib/format';
import { memberLockReason, RequireAccess, teamRoleLabel, useActor } from '@/lib/permissions';
import { useAppSelector } from '@/redux/hooks';
import { useDeleteTeamMemberMutation, useGetTeamMembersQuery, useResendInviteMutation, type TeamMember } from '@/redux/features/team/teamApi';

/*
 * Team members (docs/new/frontend/implementation/step-2.1-access.md B1). Owners manage everyone;
 * a member with team_management manages members whose access they also hold (decision #84).
 */
function TeamPage() {
  const actor = useActor();
  const meId = useAppSelector((s) => (s.auth.user?.id as string | undefined) ?? null);
  const list = useGetTeamMembersQuery();
  const [resendInvite, resendState] = useResendInviteMutation();
  const [deleteMember, deleteState] = useDeleteTeamMemberMutation();

  const [sheet, setSheet] = React.useState<{ open: boolean; member: TeamMember | null }>({ open: false, member: null });
  const [removing, setRemoving] = React.useState<TeamMember | null>(null);
  const members = list.data?.data ?? [];
  const lock = (m: TeamMember) => memberLockReason(actor, meId, m);

  const resend = async (m: TeamMember) => {
    try {
      await resendInvite({ email: m.email }).unwrap();
      toast.success(`Invitation sent again to ${m.email}`);
    } catch (err) {
      toast.error(toApiError(err).message);
    }
  };

  const remove = async () => {
    if (!removing) return;
    try {
      await deleteMember(removing.id).unwrap();
      toast.success(`${removing.firstName} ${removing.lastName} removed from the team`);
      setRemoving(null);
    } catch (err) {
      toast.error(toApiError(err).message);
    }
  };

  return (
    <div>
      <PageHeader
        title="Team"
        description="People who work in this account with their own sign-in. Each sees only what you give them."
        actions={
          <Button onClick={() => setSheet({ open: true, member: null })} startIcon={<Plus className="h-4 w-4" aria-hidden />}>
            Invite member
          </Button>
        }
      />

      <DataTable<TeamMember>
        caption="Team members"
        rows={list.isError ? undefined : members}
        loading={list.isLoading || list.isFetching}
        error={list.isError ? toApiError(list.error).message : undefined}
        onRetry={list.refetch}
        empty={{
          title: 'No team members yet',
          description: 'Invite colleagues to help with products, trades or inventory.',
          action: <Button onClick={() => setSheet({ open: true, member: null })}>Invite member</Button>,
        }}
        getRowId={(m) => m.id}
        onRowClick={(m) => setSheet({ open: true, member: m })}
        selectedId={sheet.member?.id ?? null}
        columns={[
          {
            key: 'name',
            header: 'Member',
            mobile: 'title',
            className: 'min-w-[220px]',
            cell: (m) => (
              <div>
                <p className="font-medium text-ink">
                  {m.firstName} {m.lastName}
                  {meId === m.id && <span className="ml-2 text-xs font-normal text-steel">(you)</span>}
                </p>
                <p className="text-sm text-steel">{m.email}</p>
              </div>
            ),
          },
          { key: 'role', header: 'Team role', mobile: 'subtitle', cell: (m) => teamRoleLabel(m.team_role) },
          { key: 'access', header: 'Access', cell: (m) => `${m.permissions.length} of 16` },
          { key: 'status', header: 'Status', cell: (m) => <StatusBadge status={m.status} /> },
          { key: 'added', header: 'Added', cell: (m) => formatDate(m.createdAt) },
          {
            key: 'actions',
            header: <span className="sr-only">Actions</span>,
            align: 'right',
            cell: (m) =>
              lock(m) ? (
                <span className="text-xs text-steel">View only</span>
              ) : (
                <span className="flex justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                  {m.status === 'invited' && (
                    <Button size="sm" variant="outlined" color="secondary" onClick={() => resend(m)} disabled={resendState.isLoading}>
                      Resend invite
                    </Button>
                  )}
                  <Button size="sm" variant="outlined" color="error" onClick={() => setRemoving(m)}>
                    Remove
                  </Button>
                </span>
              ),
          },
        ]}
      />

      <TeamMemberSheet
        open={sheet.open}
        member={sheet.member}
        lockReason={sheet.member ? lock(sheet.member) : null}
        onClose={() => setSheet({ open: false, member: null })}
      />

      <ConfirmDialog
        open={!!removing}
        tone="error"
        title={removing ? `Remove ${removing.firstName} ${removing.lastName}?` : ''}
        description="They lose access to this account at once. To bring them back, invite them again."
        confirmLabel="Remove member"
        loading={deleteState.isLoading}
        onConfirm={remove}
        onClose={() => setRemoving(null)}
      />
    </div>
  );
}

export default function Page() {
  return (
    <RequireAccess teamKey="team_management">
      <TeamPage />
    </RequireAccess>
  );
}
