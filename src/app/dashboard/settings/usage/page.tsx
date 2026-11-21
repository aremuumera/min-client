import { BlockchainIdentityPanel, UsagePanel } from '@/components/settings/usage-panel';

export const metadata = {
  title: 'Usage and limits | Dashboard',
};

/* Settings › Usage and limits (decision #135): team members and storage used against the company's limits */
export default function UsageSettingsPage() {
  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-4xl font-bold tracking-tight text-gray-900">Usage and limits</h1>
        <p className="text-lg font-medium text-gray-500">How much your company uses, and the limits MINMEG set for it.</p>
      </div>
      <UsagePanel />
      <BlockchainIdentityPanel />
    </div>
  );
}
