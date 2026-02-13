
import { AccountDetails } from "@/components/dashboard/settings/account-details";
import { DeleteAccount } from "@/components/dashboard/settings/delete-account";

export const metadata = {
    title: "Account Settings | Dashboard",
};

export default function AccountSettingsPage() {
    return (
        <div className="space-y-12 animate-in fade-in slide-in-from-bottom-2 duration-500">
            <div className="space-y-1">
                <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Settings</h1>
                <p className="text-base text-gray-500">Manage your profile and account security</p>
            </div>

            <div className="space-y-8">
                <AccountDetails />
                <DeleteAccount />
            </div>
        </div>
    );
}
