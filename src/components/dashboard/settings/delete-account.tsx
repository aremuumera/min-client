"use client";
import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Typography } from '@/components/ui/typography';
import { Warning as WarningIcon } from '@phosphor-icons/react/dist/ssr/Warning';
import { Modal, ModalHeader, ModalBody, ModalFooter } from '@/components/ui/modal';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { DeactivateAccount } from '@/redux/features/AuthFeature/auth_api';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { logout } from '@/redux/features/AuthFeature/auth_slice';

export function DeleteAccount() {
    const [isModalOpen, setIsModalOpen] = React.useState(false);
    const [isDeactivating, setIsDeactivating] = React.useState(false);
    const dispatch = useAppDispatch();
    const router = useRouter();
    const { team_role } = useAppSelector((state) => state.auth);

    const isOwner = team_role === 'owner';

    const handleDeactivate = async () => {
        setIsDeactivating(true);
        try {
            const resultAction = await dispatch(DeactivateAccount());
            if (DeactivateAccount.fulfilled.match(resultAction)) {
                toast.success('Account deactivated successfully');
                dispatch(logout());
                router.push('/auth/login');
            } else {
                toast.error((resultAction.payload as any)?.message || 'Failed to deactivate account');
            }
        } catch (error) {
            toast.error('An unexpected error occurred');
        } finally {
            setIsDeactivating(false);
            setIsModalOpen(false);
        }
    };

    return (
        <>
            <Card outlined className={`border-red-100 bg-red-50/10 ${!isOwner ? 'opacity-70' : ''}`}>
                <CardHeader
                    avatar={
                        <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center text-red-600 border border-red-100">
                            <WarningIcon size={20} />
                        </div>
                    }
                    title={<span className="text-lg font-bold text-red-900">Delete Account</span>}
                />
                <CardContent>
                    <div className="space-y-6">
                        <p className="text-sm text-red-700 leading-relaxed max-w-xl">
                            Deleting your account will permanently remove all of your business data, product listings, and RFQ history. This action is irreversible and cannot be undone.
                        </p>
                        {!isOwner && (
                            <p className="text-xs font-medium text-red-600 italic">
                                * Only the account owner can deactivate this account.
                            </p>
                        )}
                        <Button
                            variant="outlined"
                            disabled={!isOwner}
                            onClick={() => setIsModalOpen(true)}
                            className="bg-white border-red-200 text-red-600 hover:bg-red-600 hover:text-white hover:border-red-600 rounded-lg font-bold text-xs px-6 py-2 h-auto transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Deactivate Account
                        </Button>
                    </div>
                </CardContent>
            </Card>

            <Modal open={isModalOpen} onClose={() => setIsModalOpen(false)}>
                <ModalHeader>
                    <Typography variant="h6" className="font-bold text-red-900">Confirm Deactivation</Typography>
                </ModalHeader>
                <ModalBody>
                    <Typography className="text-sm text-gray-700">
                        Are you sure you want to deactivate your account? This will log you out and permanently disable your access to the platform.
                    </Typography>
                </ModalBody>
                <ModalFooter className="gap-2">
                    <Button
                        variant="outlined"
                        onClick={() => setIsModalOpen(false)}
                        disabled={isDeactivating}
                    >
                        Cancel
                    </Button>
                    <Button
                        className="bg-red-600 text-white hover:bg-red-700"
                        onClick={handleDeactivate}
                        isLoading={isDeactivating}
                    >
                        Confirm Deactivation
                    </Button>
                </ModalFooter>
            </Modal>
        </>
    );
}
