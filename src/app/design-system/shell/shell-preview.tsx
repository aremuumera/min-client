'use client';

import * as React from 'react';
import { Provider } from 'react-redux';
import { configureStore, type UnknownAction } from '@reduxjs/toolkit';
import authReducer from '@/redux/features/AuthFeature/auth_slice';
import { DynamicLayout } from '@/components/dashboard/layout/layout';
import { ChatProvider } from '@/providers/chat-provider';
import { PageHeader, StatTile, StatusBadge } from '@/components/ui';

/*
 * A separate in-memory store with a demo supplier. Built from the reducer's initial state (no login
 * action), so nothing is written to localStorage and the real session is never touched.
 */
function makeStore() {
  const initial = authReducer(undefined, { type: '@@preview/init' } as UnknownAction);
  const demo = { ...initial, isAuth: true, isInitialized: true, user: { id: 'demo', first_name: 'Amina', last_name: 'Bello', email: 'amina@minmeg.test', role: 'supplier', isProfileCreated: true, isBusinessVerified: true } };
  return configureStore({ reducer: { auth: (state = demo, action: UnknownAction) => authReducer(state, action) } });
}

export function ShellPreview() {
  const [store] = React.useState(makeStore);
  return (
    <Provider store={store}>
      <ChatProvider>
        <DynamicLayout>
          <PageHeader title="Overview" description="Shell preview: the real sidebar and top bar, a demo supplier." meta={<StatusBadge status="ACTIVE" />} />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatTile label="Active listings" value="12" />
            <StatTile label="Open inquiries" value="5" hint="2 waiting for you" />
            <StatTile label="Shipments in transit" value="3" />
            <StatTile label="Verified passports" value="18" dark />
          </div>
        </DynamicLayout>
      </ChatProvider>
    </Provider>
  );
}
