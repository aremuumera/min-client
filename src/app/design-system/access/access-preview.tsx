'use client';

import * as React from 'react';
import { Provider } from 'react-redux';
import { configureStore, type UnknownAction } from '@reduxjs/toolkit';
import authReducer from '@/redux/features/AuthFeature/auth_slice';
import { teamApi, type TeamMember } from '@/redux/features/team/teamApi';
import { Button, PageHeader } from '@/components/ui';
import { TeamMemberSheet } from '@/components/team/team-member-sheet';
import { memberLockReason, useActor } from '@/lib/permissions';
import { useAppSelector } from '@/redux/hooks';

const ME = '935dc217-daa9-4e33-9b04-60996aa29181';
const MEMBER: TeamMember = {
  id: '4b1c2d3e-4f5a-4b60-8c71-9d2e3f4a5b62',
  firstName: 'Tunde',
  lastName: 'Okafor',
  email: 'tunde@minmeg.test',
  team_role: 'operations_manager',
  permissions: ['inventory', 'shipments', 'esg'],
  status: 'active',
  createdAt: '2026-10-01T10:00:00Z',
};

/* A separate in-memory store; ?as=member is a team member holding team_management, products, chat */
function makeStore(asMember: boolean) {
  const initial = authReducer(undefined, { type: '@@preview/init' } as UnknownAction);
  const demo = {
    ...initial,
    isAuth: true,
    isInitialized: true,
    user: { id: ME, first_name: 'Amina', last_name: 'Bello', role: 'supplier' },
    isTeamMember: asMember,
    permissions: asMember ? ['team_management', 'products', 'chat'] : [],
  };
  return configureStore({
    reducer: { auth: (state: typeof demo = demo, action: UnknownAction) => authReducer(state, action), [teamApi.reducerPath]: teamApi.reducer },
    middleware: (gdm) => gdm().concat(teamApi.middleware),
  });
}

function Preview() {
  const actor = useActor();
  const meId = useAppSelector((s) => s.auth.user?.id ?? null);
  const [open, setOpen] = React.useState<'invite' | 'edit' | null>(null);
  return (
    <main className="mx-auto max-w-[1440px] px-4 py-6 md:px-6 lg:px-8">
      <PageHeader title="Team preview" description={actor.isTeamMember ? 'As a team member with team_management, products and chat.' : 'As the account owner.'} />
      <div className="flex flex-wrap gap-2">
        <Button onClick={() => setOpen('invite')}>Invite</Button>
        <Button onClick={() => setOpen('edit')}>Edit Tunde</Button>
      </div>
      <TeamMemberSheet open={open === 'invite'} member={null} onClose={() => setOpen(null)} />
      <TeamMemberSheet open={open === 'edit'} member={MEMBER} lockReason={memberLockReason(actor, meId, MEMBER)} onClose={() => setOpen(null)} />
    </main>
  );
}

export function AccessPreview() {
  const [store] = React.useState(() => makeStore(typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('as') === 'member'));
  return (
    <Provider store={store}>
      <Preview />
    </Provider>
  );
}
