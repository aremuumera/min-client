'use client';

import React, { useState, useEffect } from 'react';
import { useUpdateTeamMemberMutation, TeamMember } from '@/redux/features/team/teamApi';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Dialog,
    DialogContent,
    DialogActions,
    DialogTitle,
} from "@/components/ui/modal";
import { Checkbox } from "@/components/ui/checkbox";
import { Select } from "@/components/ui/select";
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { useAuthIdentity } from '@/hooks/use-auth-identity';
import { getAvailablePermissions } from './InviteTeamMemberModal';
import { PermissionKey } from '@/hooks/usePermission';

interface EditTeamMemberModalProps {
    isOpen: boolean;
    onClose: () => void;
    member: TeamMember | null;
}

const ROLES = [
    { value: 'admin', label: 'Admin' },
    { value: 'marketer', label: 'Marketer' },
    { value: 'customer_care', label: 'Customer Care' },
    { value: 'operations_manager', label: 'Operations Manager' },
];

const STATUSES = [
    { value: 'active', label: 'Active' },
    { value: 'deactivated', label: 'Inactive' },
];

const DEFAULT_PERMISSIONS: Record<string, PermissionKey[]> = {
    admin: ['products', 'rfq', 'chat', 'enquiries', 'invoices', 'inspectors', 'analytics', 'settings', 'team_management', 'activity'],
    marketer: ['products', 'rfq', 'analytics'],
    customer_care: ['chat', 'enquiries'],
    operations_manager: ['invoices', 'inspectors', 'analytics', 'activity'],
};

export function EditTeamMemberModal({ isOpen, onClose, member }: EditTeamMemberModalProps) {
    const { normalizedRole } = useAuthIdentity();
    const [updateTeamMember, { isLoading }] = useUpdateTeamMemberMutation();
    const availablePermissions = getAvailablePermissions(normalizedRole);
    const availableKeys = availablePermissions.map(p => p.key);

    const [formData, setFormData] = useState({
        team_role: '',
        permissions: [] as string[],
        status: '',
    });

    useEffect(() => {
        if (member) {
            setFormData({
                team_role: member.team_role,
                permissions: member.permissions || [],
                status: member.status,
            });
        }
    }, [member, isOpen]);

    const handleRoleChange = (e: any) => {
        const role = e.target.value;
        setFormData(prev => ({
            ...prev,
            team_role: role,
            permissions: DEFAULT_PERMISSIONS[role] || []
        }));
    };

    const handlePermissionToggle = (key: string) => {
        setFormData(prev => {
            const exists = prev.permissions.includes(key);
            if (exists) {
                return { ...prev, permissions: prev.permissions.filter(p => p !== key) };
            } else {
                return { ...prev, permissions: [...prev.permissions, key] };
            }
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!member) return;

        try {
            await updateTeamMember({
                id: member.id,
                ...formData
            }).unwrap();
            toast.success("Team member updated successfully");
            onClose();
        } catch (err: any) {
            toast.error(err?.data?.message || "Failed to update team member");
        }
    };

    if (!member) return null;

    return (
        <Dialog open={isOpen} onClose={onClose} size="md">
            <DialogTitle showCloseButton>Edit Team Member</DialogTitle>
            <DialogContent>
                <p className="text-sm text-neutral-500 mb-6">
                    Update permissions and role for <strong>{member.firstName} {member.lastName}</strong> ({member.email}).
                </p>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                        <Select
                            label="Role"
                            value={formData.team_role}
                            onChange={handleRoleChange}
                            options={ROLES}
                            placeholder="Select a role"
                            fullWidth
                        />
                        <Select
                            label="Status"
                            value={formData.status}
                            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                            options={STATUSES}
                            fullWidth
                        />
                    </div>

                    <div className="space-y-3 pt-2">
                        <label className="text-sm font-medium text-neutral-700">Permissions</label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {availablePermissions.map((perm) => (
                                <div key={perm.key} className="flex items-start space-x-2.5 p-2.5 rounded-xl border border-neutral-200 bg-neutral-50/50 hover:bg-neutral-50 transition-colors">
                                    <Checkbox
                                        id={`edit-perm-${perm.key}`}
                                        checked={formData.permissions.includes(perm.key)}
                                        onChange={() => handlePermissionToggle(perm.key)}
                                        className="mt-0.5"
                                    />
                                    <div className="flex flex-col space-y-0.5 cursor-pointer select-none" onClick={() => handlePermissionToggle(perm.key)}>
                                        <label
                                            htmlFor={`edit-perm-${perm.key}`}
                                            className="text-xs font-bold text-neutral-900 cursor-pointer"
                                        >
                                            {perm.label}
                                        </label>
                                        <span className="text-[11px] text-neutral-500 font-medium leading-normal">
                                            {perm.description}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <DialogActions className="px-0 pt-4 border-t-0">
                        <Button type="button" variant="outlined" onClick={onClose} disabled={isLoading}>
                            Cancel
                        </Button>
                        <Button type="submit" variant="contained" color="primary" loading={isLoading}>
                            Save Changes
                        </Button>
                    </DialogActions>
                </form>
            </DialogContent>
        </Dialog>
    );
}
