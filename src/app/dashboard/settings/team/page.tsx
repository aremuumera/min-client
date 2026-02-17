'use client';

import React, { useState } from 'react';
import { InviteTeamMemberModal } from '@/components/team/InviteTeamMemberModal';
import { EditTeamMemberModal } from '@/components/team/EditTeamMemberModal';
import { PermissionGate } from '@/components/team/PermissionGate';
import { Button } from '@/components/ui/button';
import { useGetTeamMembersQuery, useResendInviteMutation, useDeleteTeamMemberMutation, TeamMember } from '@/redux/features/team/teamApi';
import { Loader2, Plus, MoreVertical, Mail, Trash2, Edit2, ShieldAlert } from 'lucide-react';
import { Badge } from "@/components/ui/badge";
import { format } from 'date-fns';
import { cn } from '@/utils/helper';
import { toast } from 'sonner';
import { Portal } from '@/components/ui/portal';

export default function TeamManagementPage() {
    const { data, isLoading, error, refetch } = useGetTeamMembersQuery();
    const [deleteTeamMember] = useDeleteTeamMemberMutation();
    const [resendInvite] = useResendInviteMutation();

    // State for modals
    const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingMember, setEditingMember] = useState<TeamMember | null>(null);

    const teamMembers = data?.data || [];

    const handleEdit = (member: TeamMember) => {
        setEditingMember(member);
        setIsEditModalOpen(true);
    };

    const handleDelete = async (id: string) => {
        if (confirm('Are you sure you want to remove this team member? This action cannot be undone.')) {
            try {
                await deleteTeamMember(id).unwrap();
                toast.success('Team member removed successfully');
            } catch (err: any) {
                toast.error(err?.data?.message || 'Failed to remove team member');
            }
        }
    };

    const handleResendInvite = async (email: string) => {
        try {
            await resendInvite({ email }).unwrap();
            toast.success('Invitation resent successfully');
        } catch (err: any) {
            toast.error(err?.data?.message || 'Failed to resend invitation');
        }
    };

    return (
        <PermissionGate permission="team_management" fallback={<div className="p-8 text-center text-red-500">You do not have permission to access this page.</div>}>
            <InviteTeamMemberModal isOpen={isInviteModalOpen} onClose={() => setIsInviteModalOpen(false)} />
            <EditTeamMemberModal
                isOpen={isEditModalOpen}
                onClose={() => {
                    setIsEditModalOpen(false);
                    setEditingMember(null);
                }}
                member={editingMember}
            />
            <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Team Management</h1>
                        <p className="text-neutral-500">Manage your team members and their permissions.</p>
                    </div>
                    <Button onClick={() => setIsInviteModalOpen(true)} className="bg-green-600 hover:bg-green-700 text-white">
                        <Plus className="mr-2 h-4 w-4" />
                        Invite Member
                    </Button>
                </div>

                {/* List Content */}
                <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden scrollbar-hide">
                    {isLoading ? (
                        <div className="p-12 flex justify-center items-center">
                            <Loader2 className="h-8 w-8 animate-spin text-green-600" />
                        </div>
                    ) : error ? (
                        <div className="p-12 flex flex-col items-center justify-center text-red-500 gap-2">
                            <ShieldAlert className="h-8 w-8" />
                            <p>Failed to load team members.</p>
                            <Button variant="outlined" onClick={() => refetch()}>Try Again</Button>
                        </div>
                    ) : teamMembers.length === 0 ? (
                        <div className="p-12 text-center flex flex-col items-center gap-3">
                            <div className="h-12 w-12 rounded-full bg-neutral-100 flex items-center justify-center">
                                <div className="h-6 w-6 text-neutral-400" /> {/* User group icon ideally */}
                            </div>
                            <h3 className="text-lg font-medium text-neutral-900">No team members yet</h3>
                            <p className="text-neutral-500 max-w-sm">Invite your colleagues to help manage your store, products, and incoming orders.</p>
                            <Button onClick={() => setIsInviteModalOpen(true)} variant="outlined" className="mt-2">
                                Invite your first member
                            </Button>
                        </div>
                    ) : (
                        <div className="overflow-x-auto scrollbar-hide no-scrollbar">
                            <table className="w-full text-sm text-left">
                                <thead className="text-xs text-neutral-500 uppercase bg-neutral-50 border-b border-neutral-100">
                                    <tr>
                                        <th className="px-6 py-4 font-semibold">Name</th>
                                        <th className="px-6 py-4 font-semibold">Role</th>
                                        <th className="px-6 py-4 font-semibold">Status</th>
                                        <th className="px-6 py-4 font-semibold">Joined</th>
                                        <th className="px-6 py-4 font-semibold text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-neutral-100">
                                    {teamMembers.map((member) => (
                                        <tr key={member.id} className="hover:bg-neutral-50/50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col">
                                                    <span className="font-medium text-neutral-900">{member.firstName} {member.lastName}</span>
                                                    <span className="text-xs text-neutral-500">{member.email}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-blue-200 uppercase text-[10px] tracking-wide">
                                                    {member.team_role.replace('_', ' ')}
                                                </Badge>
                                            </td>
                                            <td className="px-6 py-4">
                                                <StatusBadge status={member.status} />
                                            </td>
                                            <td className="px-6 py-4 text-neutral-500">
                                                {format(new Date(member.createdAt), 'MMM d, yyyy')}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <TeamActionMenu
                                                    member={member}
                                                    handleEdit={() => handleEdit(member)}
                                                    handleResendInvite={() => handleResendInvite(member.email)}
                                                    handleDelete={() => handleDelete(member.id)}
                                                />
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </PermissionGate>
    );
}

function StatusBadge({ status }: { status: string }) {
    switch (status) {
        case 'active':
            return <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-green-200 shadow-none">Active</Badge>;
        case 'invited':
            return <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 border-amber-200 shadow-none">Pending</Badge>;
        case 'deactivated':
            return <Badge className="bg-neutral-100 text-neutral-700 hover:bg-neutral-100 border-neutral-200 shadow-none">Inactive</Badge>;
        default:
            return <Badge variant="neutral">{status}</Badge>;
    }
}

function TeamActionMenu({ member, handleEdit, handleResendInvite, handleDelete }: { member: TeamMember, handleEdit: () => void, handleResendInvite: () => void, handleDelete: () => void }) {
    const [isOpen, setIsOpen] = useState(false);
    const triggerRef = React.useRef<HTMLButtonElement>(null);
    const menuRef = React.useRef<HTMLDivElement>(null);

    React.useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node) &&
                triggerRef.current && !triggerRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };
        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen]);

    const getPosition = () => {
        if (!triggerRef.current) return {};
        const rect = triggerRef.current.getBoundingClientRect();
        return {
            top: rect.bottom + 4,
            right: window.innerWidth - rect.right,
        };
    };

    return (
        <>
            <Button
                ref={triggerRef}
                variant="text"
                className="h-8 w-8 p-0"
                onClick={() => setIsOpen(!isOpen)}
            >
                <MoreVertical className="h-4 w-4 text-neutral-500" />
            </Button>

            {isOpen && (
                <Portal>
                    <div
                        ref={menuRef}
                        style={{
                            position: 'fixed',
                            ...getPosition(),
                            zIndex: 9999,
                        }}
                        className="min-w-[180px] bg-white rounded-lg border border-neutral-200 shadow-lg py-1 overflow-hidden"
                    >
                        <button
                            className="flex w-full items-center px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50 text-left transition-colors"
                            onClick={() => { setIsOpen(false); handleEdit(); }}
                        >
                            <Edit2 className="mr-2 h-4 w-4" /> Edit Permissions
                        </button>

                        {member.status === 'invited' && (
                            <button
                                className="flex w-full items-center px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50 text-left transition-colors"
                                onClick={() => { setIsOpen(false); handleResendInvite(); }}
                            >
                                <Mail className="mr-2 h-4 w-4" /> Resend Invite
                            </button>
                        )}

                        <div className="h-px bg-neutral-100 my-1" />

                        <button
                            className="flex w-full items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50 text-left transition-colors"
                            onClick={() => { setIsOpen(false); handleDelete(); }}
                        >
                            <Trash2 className="mr-2 h-4 w-4" /> Remove
                        </button>
                    </div>
                </Portal>
            )}
        </>
    );
}
