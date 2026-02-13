
import { LegalsMain } from "@/components/dashboard/settings/legals-main";

export const metadata = {
    title: "Legal & Compliance | Dashboard",
};

export default function LegalsSettingsPage() {
    return (
        <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="space-y-2">
                <h1 className="text-4xl font-black text-gray-900 tracking-tight">Legals</h1>
                <p className="text-lg text-gray-500 font-medium">Our legal foundations and compliance standards</p>
            </div>
            
            <LegalsMain />
        </div>
    );
}
