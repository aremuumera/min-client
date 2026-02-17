'use client';

import * as React from 'react';
import BusinessSettings from '@/components/dashboard/settings/business';
import { PermissionGate } from '@/components/team/PermissionGate';

export default function BusinessSettingsPage() {
  return (
    <div className="p-6">
      <PermissionGate
        permission="team_management"
        fallback={<div className="p-8 text-center text-red-500 font-bold">You do not have permission to access business settings.</div>}
      >
        <BusinessSettings />
      </PermissionGate>
    </div>
  );
}
