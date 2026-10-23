import type { Actor } from './can';
import { STAFF_ROLES, normalizeRole } from './can';

/* minmeg-merchants: the actor from the auth slice (role, isTeamMember, permissions = team keys) */
interface MerchantAuthState {
  user?: { role?: unknown } | null;
  isTeamMember?: boolean;
  permissions?: string[];
}

export function actorFromAuth(auth: MerchantAuthState | undefined): Actor {
  const role = normalizeRole(auth?.user?.role);
  const isStaff = !!role && (STAFF_ROLES as readonly string[]).includes(role);
  const isTeamMember = !!auth?.isTeamMember;
  return { role, isStaff, permissions: [], isTeamMember, teamKeys: isTeamMember ? auth?.permissions ?? [] : [] };
}
