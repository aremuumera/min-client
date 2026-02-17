import { useAppSelector } from "@/redux/hooks";

export type PermissionKey =
    | 'products'
    | 'rfq'
    | 'chat'
    | 'enquiries'
    | 'invoices'
    | 'inspectors'
    | 'analytics'
    | 'settings'
    | 'team_management';

export const usePermission = (permission: PermissionKey): boolean => {
    const { isTeamMember, permissions } = useAppSelector((state) => state.auth);

    if (!isTeamMember) {
        // Regular users (owners) have all permissions implicitly
        // Or we can assume owners have full access.
        // However, if the user role is strictly "buyer" they might not have "products".
        // But for the scope of B2B Team, "True Owner" means full access.
        return true;
    }

    return permissions.includes(permission);
};

export const useIsTeamMember = (): boolean => {
    const { isTeamMember } = useAppSelector((state) => state.auth);
    return isTeamMember;
};

export const useTeamRole = (): string | undefined => {
    const { team_role } = useAppSelector((state) => state.auth);
    return team_role;
};
