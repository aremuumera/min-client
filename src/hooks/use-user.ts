'use client';

import { useAppSelector } from '@/redux/hooks';

/**
 * Hook to access the current user and auth state from Redux store
 * Replaces the original src/hooks/use-user.js
 */
export function useUser() {
    const { user, token, isAuth, isInitialized } = useAppSelector((state) => state.auth);
    return {
        user,
        token,
        isAuthenticated: isAuth,
        authLoading: !isInitialized,
        // Helper to check role if needed, matching common patterns
        role: user?.role
    };
}
