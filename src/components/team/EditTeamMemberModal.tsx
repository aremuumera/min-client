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

const PERMISSIONS: { key: PermissionKey; label: string }[] = [
    { key: 'products', label: 'Manage Products' },
    { key: 'rfq', label: 'Manage RFQs' },
    { key: 'chat', label: 'Access Chat' },
    { key: 'enquiries', label: 'Handle Enquiries' },
    { key: 'invoices', label: 'View Invoices' },
    { key: 'inspectors', label: 'View Inspectors' },
    { key: 'analytics', label: 'View Analytics' },
    { key: 'settings', label: 'Manage Settings' },
    { key: 'team_management', label: 'Manage Team' },
];

const DEFAULT_PERMISSIONS: Record<string, PermissionKey[]> = {
    admin: ['products', 'rfq', 'chat', 'enquiries', 'invoices', 'inspectors', 'analytics', 'settings', 'team_management'],
    marketer: ['products', 'rfq', 'analytics'],
    customer_care: ['chat', 'enquiries'],
    operations_manager: ['invoices', 'inspectors', 'analytics'],
};

export function EditTeamMemberModal({ isOpen, onClose, member }: EditTeamMemberModalProps) {
    const [updateTeamMember, { isLoading }] = useUpdateTeamMemberMutation();

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
                        <div className="grid grid-cols-2 gap-3">
                            {PERMISSIONS.map((perm) => (
                                <div key={perm.key} className="flex items-start space-x-2">
                                    <Checkbox
                                        id={`edit-perm-${perm.key}`}
                                        checked={formData.permissions.includes(perm.key)}
                                        onChange={() => handlePermissionToggle(perm.key)}
                                    />
                                    <label
                                        htmlFor={`edit-perm-${perm.key}`}
                                        className="text-sm cursor-pointer select-none text-neutral-600"
                                    >
                                        {perm.label}
                                    </label>
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
