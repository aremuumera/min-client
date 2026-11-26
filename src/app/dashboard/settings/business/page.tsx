'use client';

import * as React from 'react';
import BusinessSettings from '@/components/dashboard/settings/business';
import { PermissionGate } from '@/components/team/PermissionGate';
import { CompanyIdCard } from '@/components/dashboard/settings/company-id-card';
// decision #132: the company's name key on supply chains, built but hidden for now (every company is named, decision #131)
// import { CompanyNameSetting } from '@/components/passports/company-name-setting';

export default function BusinessSettingsPage() {
  return (
    <div className=" lg:p-6">
      {/* 6E: every member can read and copy the company ID, even without business-settings access */}
      <CompanyIdCard className="mb-6" />
      <PermissionGate
        permission="team_management"
        fallback={<div className="p-8 text-center text-red-500 font-bold">You do not have permission to access business settings.</div>}
      >
        <BusinessSettings />
        {/* decision #132, hidden for now: <div className="mt-6"><CompanyNameSetting /></div> */}
      </PermissionGate>
    </div>
  );
}
