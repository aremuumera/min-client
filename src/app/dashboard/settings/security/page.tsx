
import { PasswordForm } from "@/components/dashboard/settings/password-form";
import { MultiFactor } from "@/components/dashboard/settings/multi-factor";

export const metadata = {
    title: "Security Settings | Dashboard",
};

export default function SecuritySettingsPage() {
    return (
        <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="space-y-2">
                <h1 className="text-4xl font-black text-gray-900 tracking-tight">Security</h1>
                <p className="text-lg text-gray-500 font-medium">Manage your account credentials and login security</p>
            </div>

            <PasswordForm />
            {/* <MultiFactor /> */}
        </div>
    );
}
