"use client";

import React, { useState } from 'react';
import { MdOutlineCancel, MdWarning } from 'react-icons/md';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { CircularProgress } from '@/components/ui/progress';
import { Dialog, DialogTitle, DialogContent, DialogActions } from '@/components/ui/modal';
import { TextField } from '@/components/ui/input';

export function RejectInvoiceModal({ open, onClose, onConfirm, isLoading }: any) {
    const [reason, setReason] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = async () => {
        if (!reason.trim() || reason.trim().length < 10) {
            setError('Please provide a rejection reason (minimum 10 characters)');
            return;
        }

        if (reason.trim().length > 500) {
            setError('Rejection reason cannot exceed 500 characters');
            return;
        }

        setError('');
        await onConfirm(reason.trim());

        // Only clear if successful (onConfirm will handle closing)
        if (!isLoading) {
            setReason('');
        }
    };

    const handleClose = () => {
        if (!isLoading) {
            setReason('');
            setError('');
            onClose();
        }
    };

    return (
        <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
            <DialogTitle className="flex items-center gap-2">
                <MdOutlineCancel className="text-error-500 text-xl" />
                Reject Trade Agreement
            </DialogTitle>

            <DialogContent>
                <Alert severity="warning" className="mb-4">
                    <div className="flex gap-2">
                        <MdWarning className="text-xl flex-shrink-0" />
                        <div>
                            <strong>Important:</strong> Rejecting this agreement will:
                            <ul className="list-disc ml-5 mt-1">
                                <li>Immediately cancel the agreement</li>
                                <li>Notify the other party</li>
                                <li>Record your reason permanently</li>
                                <li>Prevent submission for inspection</li>
                            </ul>
                        </div>
                    </div>
                </Alert>

                {error && (
                    <Alert severity="error" className="mb-4">
                        {error}
                    </Alert>
                )}

                <TextField
                    fullWidth
                    multiline
                    rows={4}
                    label="Rejection Reason"
                    placeholder="Please explain why you are rejecting this agreement..."
                    value={reason}
                    onChange={(e: any) => {
                        setReason(e.target.value);
                        if (error) setError('');
                    }}
                    helperText={`${reason.length}/500 characters (minimum 10)`}
                    error={!!error || (reason.length > 0 && reason.length < 10)}
                    disabled={isLoading}
                    className="mt-2"
                />

                <Alert severity="info" className="mt-4">
                    <strong>Note:</strong> Your reason will be shared with the other party and recorded for transparency.
                </Alert>
            </DialogContent>

            <DialogActions>
                <Button onClick={handleClose} disabled={isLoading} variant="text">
                    Keep Agreement
                </Button>
                <Button
                    onClick={handleSubmit}
                    color="error"
                    variant="contained"
                    disabled={isLoading || reason.trim().length < 10}
                    startIcon={isLoading ? <CircularProgress size={20} /> : <MdOutlineCancel />}
                >
                    {isLoading ? 'Rejecting...' : 'Confirm Rejection'}
                </Button>
            </DialogActions>
        </Dialog>
    );
}
