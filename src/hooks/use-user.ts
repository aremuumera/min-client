'use client';

import { useAuthIdentity } from './use-auth-identity';

/**
 * @deprecated Use `useAuthIdentity()` instead for comprehensive auth/role/team access.
 * This hook is kept for backward compatibility only.
 */
export function useUser() {
    const { user, token, isAuth, isInitialized, normalizedRole } = useAuthIdentity();
    return {
        user,
        token,
        isAuthenticated: isAuth,
        authLoading: !isInitialized,
        role: normalizedRole,
    };
}
