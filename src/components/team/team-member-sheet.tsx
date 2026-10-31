'use client';

import * as React from 'react';
import { toast } from 'sonner';
import { Alert, Button, Checkbox, FormField, Input, SideSheet } from '@/components/ui';
import { toApiError } from '@/lib/api/errors';
import {
  grantableKeys,
  presetFor,
  TEAM_PERMISSION_GROUPS,
  TEAM_PERMISSIONS,
  TEAM_ROLE_OPTIONS,
  useActor,
  type TeamPermission,
  type TeamRole,
} from '@/lib/permissions';
import { useInviteTeamMemberMutation, useUpdateTeamMemberMutation, type TeamMember } from '@/redux/features/team/teamApi';

export interface TeamMemberSheetProps {
  open: boolean;
  /** null: invite a member */
  member: TeamMember | null;
  /** Why this member can't be changed by you (read-only), or null */
  lockReason?: string | null;
  onClose: () => void;
}

const selectClass = 'h-11 w-full rounded-lg border border-hairline-strong bg-canvas px-3 text-base text-ink disabled:bg-surface disabled:text-muted md:text-sm';

/** Invite a team member (POST /team/invite) or change one (PUT /team/members/:id) */
export function TeamMemberSheet({ open, member, lockReason, onClose }: TeamMemberSheetProps) {
  const actor = useActor();
  const allowed = React.useMemo(() => grantableKeys(actor), [actor]);
  const [invite, inviteState] = useInviteTeamMemberMutation();
  const [update, updateState] = useUpdateTeamMemberMutation();
  const saving = inviteState.isLoading || updateState.isLoading;
  const readOnly = !!lockReason;

  const [values, setValues] = React.useState({ firstName: '', lastName: '', email: '', role: 'marketer' as TeamRole, status: 'active' });
  const [keys, setKeys] = React.useState<string[]>([]);
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [formError, setFormError] = React.useState<string>();

  React.useEffect(() => {
    if (!open) return;
    const role = (member?.team_role ?? 'marketer') as TeamRole;
    setValues({ firstName: member?.firstName ?? '', lastName: member?.lastName ?? '', email: member?.email ?? '', role, status: member?.status ?? 'active' });
    setKeys(member ? [...member.permissions] : presetFor(actor, role));
    setErrors({});
    setFormError(undefined);
  }, [open, member, actor]);

  const changeRole = (role: TeamRole) => {
    setValues((v) => ({ ...v, role }));
    setKeys(presetFor(actor, role)); // a role starts from its preset; adjust below
  };
  const toggle = (k: TeamPermission) => setKeys((list) => (list.includes(k) ? list.filter((x) => x !== k) : [...list, k]));
  const setArea = (area: TeamPermission[], on: boolean) =>
    setKeys((list) => (on ? [...new Set([...list, ...area.filter((k) => allowed.includes(k))])] : list.filter((k) => !area.includes(k as TeamPermission) || !allowed.includes(k as TeamPermission))));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(undefined);
    const next: Record<string, string> = {};
    if (!member) {
      if (!values.firstName.trim()) next.firstName = 'Enter the first name';
      if (!values.lastName.trim()) next.lastName = 'Enter the last name';
      if (!/^\S+@\S+\.\S+$/.test(values.email.trim())) next.email = 'Enter a valid email address';
    }
    if (keys.length === 0) next.permissions = 'Give at least one permission';
    setErrors(next);
    if (Object.keys(next).length) return;
    try {
      if (member) {
        await update({
          id: member.id,
          team_role: values.role,
          permissions: keys,
          // invited members stay invited until they accept; only active ↔ deactivated is a choice
          ...(member.status !== 'invited' && values.status !== member.status ? { status: values.status } : {}),
        }).unwrap();
        toast.success('Team member updated');
      } else {
        await invite({ firstName: values.firstName.trim(), lastName: values.lastName.trim(), email: values.email.trim(), team_role: values.role, permissions: keys }).unwrap();
        toast.success(`Invitation sent to ${values.email.trim()}`);
      }
      onClose();
    } catch (err) {
      const apiError = toApiError(err);
      if (/email/i.test(apiError.message)) setErrors((x) => ({ ...x, email: apiError.message }));
      else setFormError(apiError.message);
    }
  };

  return (
    <SideSheet
      open={open}
      onClose={onClose}
      size="lg"
      title={member ? `${member.firstName} ${member.lastName}` : 'Invite a team member'}
      subtitle={member ? member.email : 'They get an email to set their password, then sign in with their own account'}
      footer={
        <>
          <Button type="button" variant="outlined" color="secondary" onClick={onClose} disabled={saving}>
            {readOnly ? 'Close' : 'Cancel'}
          </Button>
          {!readOnly && (
            <Button type="submit" form="team-member-form" loading={saving}>
              {member ? 'Save changes' : 'Send invitation'}
            </Button>
          )}
        </>
      }
    >
      <form id="team-member-form" onSubmit={submit} noValidate className="flex flex-col gap-4">
        {lockReason && <Alert severity="info">{lockReason}</Alert>}
        {formError && <Alert severity="error">{formError}</Alert>}

        {!member && (
          <>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField label="First name" htmlFor="tm-first" required error={errors.firstName}>
                <Input id="tm-first" value={values.firstName} onChange={(e) => setValues((v) => ({ ...v, firstName: e.target.value }))} error={!!errors.firstName} autoComplete="off" />
              </FormField>
              <FormField label="Last name" htmlFor="tm-last" required error={errors.lastName}>
                <Input id="tm-last" value={values.lastName} onChange={(e) => setValues((v) => ({ ...v, lastName: e.target.value }))} error={!!errors.lastName} autoComplete="off" />
              </FormField>
            </div>
            <FormField label="Email" htmlFor="tm-email" required error={errors.email}>
              <Input id="tm-email" type="email" value={values.email} onChange={(e) => setValues((v) => ({ ...v, email: e.target.value }))} error={!!errors.email} autoComplete="off" />
            </FormField>
          </>
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField label="Team role" htmlFor="tm-role" required help="Choosing a role fills in its usual permissions">
            <select id="tm-role" value={values.role} onChange={(e) => changeRole(e.target.value as TeamRole)} disabled={readOnly} className={selectClass}>
              {TEAM_ROLE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </FormField>
          {member && member.status !== 'invited' && (
            <FormField label="Status" htmlFor="tm-status" help="A deactivated member can't sign in">
              <select id="tm-status" value={values.status} onChange={(e) => setValues((v) => ({ ...v, status: e.target.value }))} disabled={readOnly} className={selectClass}>
                <option value="active">Active</option>
                <option value="deactivated">Deactivated</option>
              </select>
            </FormField>
          )}
        </div>

        <div>
          <div className="mb-3 flex items-baseline justify-between gap-3">
            <h3 className="text-sm font-semibold text-ink">What they can do</h3>
            <span className="text-sm text-steel" aria-live="polite">
              {keys.length} of {Object.keys(TEAM_PERMISSIONS).length}
            </span>
          </div>
          {errors.permissions && <p className="mb-2 text-sm text-semantic-error-text">{errors.permissions}</p>}
          {actor.isTeamMember && !readOnly && <p className="mb-3 text-sm text-steel">You can only give access you have yourself.</p>}
          <div className="flex flex-col gap-3">
            {TEAM_PERMISSION_GROUPS.map(({ area, keys: areaKeys }) => {
              const givable = areaKeys.filter((k) => allowed.includes(k));
              const on = areaKeys.filter((k) => keys.includes(k)).length;
              const allOn = givable.length > 0 && givable.every((k) => keys.includes(k));
              return (
                <fieldset key={area} className="rounded-lg border border-hairline">
                  <legend className="sr-only">{area}</legend>
                  <div className="flex min-h-11 items-center justify-between gap-3 border-b border-hairline bg-surface px-3 py-2">
                    <Checkbox
                      label={<span className="font-semibold">{area}</span>}
                      aria-label={`Select all ${area} permissions`}
                      checked={allOn}
                      indeterminate={!allOn && on > 0}
                      disabled={readOnly || givable.length === 0}
                      onChange={() => setArea(areaKeys, !allOn)}
                    />
                    <span className="shrink-0 text-xs text-steel">
                      {on}/{areaKeys.length}
                    </span>
                  </div>
                  <ul className="divide-y divide-hairline">
                    {areaKeys.map((k) => (
                      <li key={k} className="flex min-h-11 items-center px-3 py-2">
                        <Checkbox
                          label={TEAM_PERMISSIONS[k]}
                          description={allowed.includes(k) ? undefined : "You don't have this access"}
                          checked={keys.includes(k)}
                          disabled={readOnly || !allowed.includes(k)}
                          onChange={() => toggle(k)}
                        />
                      </li>
                    ))}
                  </ul>
                </fieldset>
              );
            })}
          </div>
        </div>
      </form>
    </SideSheet>
  );
}
