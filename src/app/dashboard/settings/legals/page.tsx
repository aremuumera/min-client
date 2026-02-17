"use client";

import { LegalsMain } from "@/components/dashboard/settings/legals-main";
import { PermissionGate } from "@/components/team/PermissionGate";

export default function LegalsSettingsPage() {
    return (
        <PermissionGate
            permission="team_management"
            fallback={<div className="p-8 text-center text-red-500 font-bold">You do not have permission to access legal settings.</div>}
        >
            <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
                <div className="space-y-2">
                    <h1 className="text-4xl font-black text-gray-900 tracking-tight">Legals</h1>
                    <p className="text-lg text-gray-500 font-medium">Our legal foundations and compliance standards</p>
                </div>

                <LegalsMain />
            </div>
        </PermissionGate>
    );
}
