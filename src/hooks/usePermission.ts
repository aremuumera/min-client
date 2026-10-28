import { useAppSelector } from "@/redux/hooks";

import type { TeamPermission } from "@/lib/permissions/team-permissions";
import { canOpenArea, useActor } from "@/lib/permissions";

/** The team keys (the backend's catalogue, lib/permissions/team-permissions.ts) */
export type PermissionKey = TeamPermission;

export const usePermission = (permission: PermissionKey): boolean => canOpenArea(useActor(), permission);

export const useIsTeamMember = (): boolean => {
    const { isTeamMember } = useAppSelector((state) => state.auth);
    return isTeamMember;
};

export const useTeamRole = (): string | undefined => {
    const { team_role } = useAppSelector((state) => state.auth);
    return team_role;
};
