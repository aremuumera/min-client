'use client';

import * as React from 'react';
import { useAppSelector } from '@/redux/hooks';
import { NoAccess } from '@/components/ui/states';
import { can, type AccessRule, type Actor } from './can';
import { actorFromAuth } from './actor';

/** The signed-in actor */
export function useActor(): Actor {
  const auth = useAppSelector((state) => state.auth);
  return React.useMemo(() => actorFromAuth(auth), [auth]);
}

/** const can = useCan(); can({ teamKey: 'inventory' }) */
export function useCan() {
  const actor = useActor();
  return React.useCallback((rule: AccessRule) => can(actor, rule), [actor]);
}

/** Shows children only when allowed (fallback otherwise) */
export function Can({ children, fallback = null, ...rule }: AccessRule & { children: React.ReactNode; fallback?: React.ReactNode }) {
  return <>{useCan()(rule) ? children : fallback}</>;
}

/** A whole page: NoAccess when not allowed (the backend still enforces) */
export function RequireAccess({ children, ...rule }: AccessRule & { children: React.ReactNode }) {
  return useCan()(rule) ? <>{children}</> : <NoAccess />;
}
