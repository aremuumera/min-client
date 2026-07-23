'use client';

import { useAppSelector } from '@/redux/hooks';

/**
 * Centralized hook for all auth identity, role checks, and team/owner resolution.
 *
 * Replaces 30+ files that individually computed:
 *   - `const effectiveUserId = isTeamMember ? ownerUserId : user?.id`
 *   - `const isBuyer = role === 'buyer'`
 *   - `const isSupplier = role === 'supplier'`
 *   - `const isDualRole = role === 'buyer_supplier' || role === 'both'`
 *   - `const isInspector = role === 'inspector'`
 *   - `const isBusinessVerified = !!appData?.businessVerification?.isVerified`
 *   - etc.
 *
 * NOTE: This hook provides GLOBAL role booleans based on the user's account role.
 * For CONTEXTUAL role checks (e.g., "is the user the supplier on THIS specific trade room?"),
 * continue using per-trade metadata comparisons in chat components.
 */
export function useAuthIdentity() {
  const {
    isAuth,
    isInitialized,
    user,
    token,
    appData,
    isTeamMember,
    ownerUserId,
    permissions,
    team_role,
  } = useAppSelector((state) => state.auth);

  // === Normalized Role ===
  const normalizedRole = (user?.role || '').toLowerCase();

  // === Core Identity (Owner vs Team Member) ===
  // Team members operate on behalf of the owner, so effectiveUserId
  // resolves to the owner's ID when the current user is a team member.
  const effectiveUserId = isTeamMember ? (ownerUserId || user?.id) : user?.id;

  // === Role Booleans (Global) ===
  const isBuyer = normalizedRole === 'buyer';
  const isSupplier = normalizedRole === 'supplier';
  const isDualRole = normalizedRole === 'buyer_supplier' || normalizedRole === 'both';
  const isInspector = normalizedRole === 'inspector';
  const isAdmin = normalizedRole === 'admin';

  // Composite access checks — whether the user CAN access supplier/buyer/inspector features
  const hasSupplierAccess = isSupplier || isDualRole || isAdmin;
  const hasBuyerAccess = isBuyer || isDualRole || isAdmin;
  const hasInspectorAccess = isInspector || isAdmin;

  // === Profile / Verification Status ===
  const isBusinessVerified = !!appData?.businessVerification?.isVerified;
  const isProfileCreated = !!appData?.isProfileCreated;
  const roleUpgradeStatus: string = appData?.roleUpgrade?.status || user?.role_upgrade_status || 'none';
  const roleUpgradeReason: string | null = appData?.roleUpgrade?.reason || user?.role_upgrade_reason || null;

  // === Display Helpers ===
  const roleLabel = normalizedRole === 'buyer_supplier'
    ? 'Buyer & Supplier'
    : (user?.role || 'User');

  const fullName = `${user?.firstName || user?.first_name || ''} ${user?.lastName || user?.last_name || ''}`.trim();

  return {
    // Core auth state
    isAuth,
    isInitialized,
    user,
    token,
    appData,

    // Team / Owner delegation
    isTeamMember,
    ownerUserId,
    effectiveUserId,
    permissions,
    teamRole: team_role,

    // Role booleans (global — based on user.role, NOT per-trade)
    normalizedRole,
    isBuyer,
    isSupplier,
    isDualRole,
    isInspector,
    isAdmin,
    hasSupplierAccess,
    hasBuyerAccess,
    hasInspectorAccess,

    // Profile / verification status
    isBusinessVerified,
    isProfileCreated,
    roleUpgradeStatus,
    roleUpgradeReason,

    // Display helpers
    roleLabel,
    fullName,

    /**
     * Check if the current user owns a specific resource by ID comparison.
     * Handles case-insensitive string comparison for UUID consistency.
     */
    isOwnerOf: (targetUserId: string | undefined) =>
      isAuth && !!user?.id && !!targetUserId &&
      String(user.id).toLowerCase() === String(targetUserId).toLowerCase(),
  };
}
