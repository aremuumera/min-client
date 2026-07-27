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
import { useAuthIdentity } from '@/hooks/use-auth-identity';
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

export interface PermissionOption {
    key: PermissionKey;
    label: string;
    description: string;
}

export const getAvailablePermissions = (userRole?: string): PermissionOption[] => {
    const role = (userRole || '').toLowerCase();

    if (role === 'inspector') {
        return [
            {
                key: 'inspectors',
                label: 'Inspector Services & Profile',
                description: 'Configure testing capability matrix, base pricing, and operational capacity limits'
            },
            {
                key: 'invoices',
                label: 'View Invoices & Agreements',
                description: 'Access trade contracts, inspection reports, and billing invoices'
            },
            {
                key: 'chat',
                label: 'Access Chat',
                description: 'Participate in live trade and inspection room communications'
            },
            {
                key: 'analytics',
                label: 'View Analytics',
                description: 'Track inspection volume, completed jobs, and performance metrics'
            },
            {
                key: 'settings',
                label: 'Manage Settings',
                description: 'Update company profile, credentials, and account settings'
            },
            {
                key: 'team_management',
                label: 'Manage Team',
                description: 'Invite team members and assign operational permissions'
            },
            {
                key: 'activity',
                label: 'View Activity Log',
                description: 'Review full transactional audit log of team actions'
            },
        ];
    }

    if (role === 'buyer') {
        return [
            {
                key: 'rfq',
                label: 'Manage RFQs & Bids',
                description: 'Post new Requests for Quotation, track listings, and evaluate supplier bids'
            },
            {
                key: 'enquiries',
                label: 'Handle Trade Inquiries',
                description: 'View and track submitted inquiries on mineral products'
            },
            {
                key: 'invoices',
                label: 'View Invoices & Agreements',
                description: 'Access trade contracts, escrow status, and payment invoices'
            },
            {
                key: 'chat',
                label: 'Access Chat',
                description: 'Participate in live negotiation chat rooms'
            },
            {
                key: 'analytics',
                label: 'View Analytics',
                description: 'Access purchasing analytics and trade reporting'
            },
            {
                key: 'settings',
                label: 'Manage Settings',
                description: 'Update buyer business profile and preferences'
            },
            {
                key: 'team_management',
                label: 'Manage Team',
                description: 'Invite team members and delegate procurement permissions'
            },
            {
                key: 'activity',
                label: 'View Activity Log',
                description: 'Review full audit log of account actions'
            },
        ];
    }

    if (role === 'supplier') {
        return [
            {
                key: 'products',
                label: 'Manage Products & Storefront',
                description: 'Create/list mineral products and manage company store profile'
            },
            {
                key: 'enquiries',
                label: 'Handle Order Inquiries',
                description: 'Receive, acknowledge, or decline incoming trade inquiries from buyers'
            },
            {
                key: 'invoices',
                label: 'View Invoices & Agreements',
                description: 'Access trade contracts, escrow details, and billing invoices'
            },
            {
                key: 'chat',
                label: 'Access Chat',
                description: 'Engage in trade negotiations and buyer communications'
            },
            {
                key: 'analytics',
                label: 'View Analytics',
                description: 'Track store views, inquiry conversion, and revenue metrics'
            },
            {
                key: 'settings',
                label: 'Manage Settings',
                description: 'Update supplier store settings and business profile'
            },
            {
                key: 'team_management',
                label: 'Manage Team',
                description: 'Invite team members and configure sales permissions'
            },
            {
                key: 'activity',
                label: 'View Activity Log',
                description: 'Review full audit log of team actions'
            },
        ];
    }

    // Default (Dual Role / Admin): show all merchant capabilities
    return [
        {
            key: 'products',
            label: 'Manage Products & Storefront',
            description: 'Create/list mineral products and manage store profile'
        },
        {
            key: 'rfq',
            label: 'Manage RFQs & Bids',
            description: 'Post RFQs and evaluate received supplier bids'
        },
        {
            key: 'enquiries',
            label: 'Handle Inquiries',
            description: 'Manage buyer and supplier trade inquiries'
        },
        {
            key: 'invoices',
            label: 'View Invoices & Agreements',
            description: 'Access trade contracts, escrow, and billing invoices'
        },
        {
            key: 'chat',
            label: 'Access Chat',
            description: 'Participate in live trade room negotiations'
        },
        {
            key: 'analytics',
            label: 'View Analytics',
            description: 'Access business performance reports and analytics'
        },
        {
            key: 'settings',
            label: 'Manage Settings',
            description: 'Update account settings and business profile'
        },
        {
            key: 'team_management',
            label: 'Manage Team',
            description: 'Invite team members and manage permissions'
        },
        {
            key: 'activity',
            label: 'View Activity Log',
            description: 'Review full transactional audit log'
        },
    ];
};

const DEFAULT_PERMISSIONS: Record<string, PermissionKey[]> = {
    admin: ['products', 'rfq', 'chat', 'enquiries', 'invoices', 'inspectors', 'analytics', 'settings', 'team_management', 'activity'],
    marketer: ['products', 'rfq', 'analytics'],
    customer_care: ['chat', 'enquiries'],
    operations_manager: ['invoices', 'inspectors', 'analytics', 'activity'],
};

export function InviteTeamMemberModal({ isOpen, onClose }: InviteTeamMemberModalProps) {
    const { normalizedRole } = useAuthIdentity();
    const [inviteTeamMember, { isLoading }] = useInviteTeamMemberMutation();
    const availablePermissions = getAvailablePermissions(normalizedRole);
    const availableKeys = availablePermissions.map(p => p.key);

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
        const defaultPerms = (DEFAULT_PERMISSIONS[role] || []).filter(p => availableKeys.includes(p));
        setFormData(prev => ({
            ...prev,
            team_role: role,
            permissions: defaultPerms
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
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {availablePermissions.map((perm) => (
                                <div key={perm.key} className="flex items-start space-x-2.5 p-2.5 rounded-xl border border-neutral-200 bg-neutral-50/50 hover:bg-neutral-50 transition-colors">
                                    <Checkbox
                                        id={`perm-${perm.key}`}
                                        checked={formData.permissions.includes(perm.key)}
                                        onChange={() => handlePermissionToggle(perm.key)}
                                        className="mt-0.5"
                                    />
                                    <div className="flex flex-col space-y-0.5 cursor-pointer select-none" onClick={() => handlePermissionToggle(perm.key)}>
                                        <label
                                            htmlFor={`perm-${perm.key}`}
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
