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
    | 'team_management'
    | 'activity';

export const usePermission = (permission: PermissionKey): boolean => {
    const { isTeamMember, permissions, user } = useAppSelector((state) => state.auth);

    if (isTeamMember) {
        return permissions.includes(permission);
    }

    const normalizedRole = (user?.role || '').toLowerCase();

    switch (permission) {
        case 'products':
            return normalizedRole === 'supplier' || normalizedRole === 'buyer_supplier' || normalizedRole === 'both' || normalizedRole === 'admin';
        case 'rfq':
            return normalizedRole === 'buyer' || normalizedRole === 'buyer_supplier' || normalizedRole === 'both' || normalizedRole === 'admin';
        case 'inspectors':
            return normalizedRole === 'inspector' || normalizedRole === 'admin';
        default:
            return true;
    }
};

export const useIsTeamMember = (): boolean => {
    const { isTeamMember } = useAppSelector((state) => state.auth);
    return isTeamMember;
};

export const useTeamRole = (): string | undefined => {
    const { team_role } = useAppSelector((state) => state.auth);
    return team_role;
};
