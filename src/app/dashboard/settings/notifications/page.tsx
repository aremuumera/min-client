import { NotificationSettingsForm } from '@/components/notifications/settings-form';

export const metadata = {
  title: 'Notification Settings | Dashboard',
};

/* Settings › Notifications (step 2.13a): what reaches the company by email and phone */
export default function NotificationsSettingsPage() {
  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-4xl font-bold tracking-tight text-gray-900">Notifications</h1>
        <p className="text-lg font-medium text-gray-500">Choose what reaches you by email and on your phone.</p>
      </div>
      <NotificationSettingsForm />
    </div>
  );
}
