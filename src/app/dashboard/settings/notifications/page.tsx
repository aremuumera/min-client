
import { EmailNotifications } from "@/components/dashboard/settings/email-notifications";

export const metadata = {
    title: "Notification Settings | Dashboard",
};

export default function NotificationsSettingsPage() {
    return (
        <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="space-y-2">
                <h1 className="text-4xl font-black text-gray-900 tracking-tight">Notifications</h1>
                <p className="text-lg text-gray-500 font-medium">Choose what you want to be notified about</p>
            </div>
            
            <EmailNotifications />
        </div>
    );
}
