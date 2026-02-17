'use client';

import React, { useState } from 'react';
import { useInviteTeamMemberMutation, InviteRequest } from '@/redux/features/team/teamApi';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Dialog,
    DialogContent,
    DialogActions, // DialogFooter replacement
    DialogTitle, // DialogHeader replacement (kind of)
} from "@/components/ui/modal";
import { Checkbox } from "@/components/ui/checkbox";
import { Select } from "@/components/ui/select";
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { PermissionKey } from '@/hooks/usePermission';

interface InviteTeamMemberModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const ROLES = [
    { value: 'admin', label: 'Admin' },
    { value: 'marketer', label: 'Marketer' },
    { value: 'customer_care', label: 'Customer Care' },
    { value: 'operations_manager', label: 'Operations Manager' },
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

export function InviteTeamMemberModal({ isOpen, onClose }: InviteTeamMemberModalProps) {
    const [inviteTeamMember, { isLoading }] = useInviteTeamMemberMutation();

    const [formData, setFormData] = useState<InviteRequest>({
        firstName: '',
        lastName: '',
        email: '',
        team_role: '',
        permissions: [],
    });

    // Auto-fill permissions when role changes
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
        try {
            if (!formData.team_role) {
                toast.error("Please select a role");
                return;
            }
            await inviteTeamMember(formData).unwrap();
            toast.success("Invitation sent successfully");
            onClose();
            // Reset form
            setFormData({ firstName: '', lastName: '', email: '', team_role: '', permissions: [] });
        } catch (err: any) {
            toast.error(err?.data?.message || "Failed to invite team member");
        }
    };

    return (
        <Dialog open={isOpen} onClose={onClose} size="md">
            <DialogTitle showCloseButton>Invite Team Member</DialogTitle>
            <DialogContent>
                <p className="text-sm text-neutral-500 mb-6">
                    Send an invitation email to a new team member. They will set their own password.
                </p>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                        <Input
                            label="First Name"
                            value={formData.firstName}
                            onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                            required
                            placeholder="John"
                            fullWidth
                        />
                        <Input
                            label="Last Name"
                            value={formData.lastName}
                            onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                            required
                            placeholder="Doe"
                            fullWidth
                        />
                    </div>

                    <Input
                        label="Email Address"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        required
                        placeholder="john@example.com"
                        fullWidth
                    />

                    <Select
                        label="Role"
                        value={formData.team_role}
                        onChange={handleRoleChange}
                        options={ROLES}
                        placeholder="Select a role"
                        fullWidth
                    />

                    <div className="space-y-3 pt-2">
                        <label className="text-sm font-medium text-neutral-700">Permissions</label>
                        <div className="grid grid-cols-2 gap-3">
                            {PERMISSIONS.map((perm) => (
                                <div key={perm.key} className="flex items-start space-x-2">
                                    <Checkbox
                                        id={`perm-${perm.key}`}
                                        checked={formData.permissions.includes(perm.key)}
                                        onChange={() => handlePermissionToggle(perm.key)}
                                    />
                                    <label
                                        htmlFor={`perm-${perm.key}`}
                                        className="text-sm cursor-pointer select-none text-neutral-600"
                                    >
                                        {perm.label}
                                    </label>
                                </div>
                            ))}
                        </div>
                        <p className="text-xs text-neutral-500 mt-1">
                            Permissions are auto-selected based on role, but you can customize them.
                        </p>
                    </div>

                    <DialogActions className="px-0 pt-4 border-t-0">
                        <Button type="button" variant="outlined" onClick={onClose} disabled={isLoading}>
                            Cancel
                        </Button>
                        <Button type="submit" variant="contained" color="primary" loading={isLoading}>
                            Send Invitation
                        </Button>
                    </DialogActions>
                </form>
            </DialogContent>
        </Dialog>
    );
}
