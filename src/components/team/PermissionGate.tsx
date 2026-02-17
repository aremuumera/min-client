import React, { ReactNode } from 'react';
import { usePermission, PermissionKey } from '@/hooks/usePermission';

interface PermissionGateProps {
    children: ReactNode;
    permission: PermissionKey;
    fallback?: ReactNode;
}

export const PermissionGate: React.FC<PermissionGateProps> = ({
    children,
    permission,
    fallback = null
}) => {
    const hasPermission = usePermission(permission);

    if (!hasPermission) {
        return <>{fallback}</>;
    }

    return <>{children}</>;
};
