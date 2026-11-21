'use client';

import * as React from 'react';
import { Alert, Switch, useConfirm } from '@/components/ui';
import { toApiError } from '@/lib/api/errors';
import { useGetCompanySupplyChainSettingQuery, useSetCompanySupplyChainSettingMutation } from '@/redux/features/passports/passports_api';

/*
 * Decision #132: the company's own key — may its name be shown on the supply chains of passports
 * (other companies' and the public page). Built and working, but not shown anywhere yet: the owner
 * decided every company is named for now (decision #131). To show it, render <CompanyNameSetting />
 * on Settings › Business (the line is there, commented out).
 */
export function CompanyNameSetting() {
  const setting = useGetCompanySupplyChainSettingQuery();
  const [save, saveState] = useSetCompanySupplyChainSettingMutation();
  const [error, setError] = React.useState<string | null>(null);
  const { confirm, dialog } = useConfirm();
  const on = setting.data?.data.nameOnSupplyChains !== false;

  const change = async (next: boolean) => {
    const ok = await confirm({
      title: next ? 'Show your company’s name on supply chains?' : 'Hide your company’s name on supply chains?',
      description: next ? 'Passports further along the chain, and their public pages, show your company’s name at your step.' : 'Your step stays in the chain, verified by MINMEG, without your company’s name.',
      confirmLabel: next ? 'Show it' : 'Hide it',
    });
    if (!ok) return;
    setError(null);
    try {
      await save({ nameOnSupplyChains: next }).unwrap();
    } catch (err) {
      setError(toApiError(err).message);
    }
  };

  return (
    <div className="space-y-2">
      <Switch label="Our name may be shown on supply chains" description="Other companies’ passports and their public pages name your company at your step." checked={on} disabled={setting.isLoading || saveState.isLoading} onChange={(e) => change(e.target.checked)} />
      {error && <Alert severity="error">{error}</Alert>}
      {dialog}
    </div>
  );
}
