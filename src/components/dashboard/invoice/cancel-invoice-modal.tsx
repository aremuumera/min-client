
"use client";
import React, { useState } from 'react';
import { MdOutlineCancel } from 'react-icons/md';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { CircularProgress } from '@/components/ui/progress';
import { Dialog, DialogTitle, DialogContent, DialogActions } from '@/components/ui/modal';
import { TextField } from '@/components/ui/input';

export function CancelInvoiceModal({ open, onClose, onConfirm, invoiceId }: any) {
    const [reason, setReason] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleCancel = async () => {
        if (!reason.trim() || reason.trim().length < 10) {
            setError('Please provide a cancellation reason (minimum 10 characters)');
            return;
        }

        if (reason.trim().length > 500) {
            setError('Cancellation reason cannot exceed 500 characters');
            return;
        }

        setLoading(true);
        setError('');

        try {
            await onConfirm(reason);
            setReason('');
            onClose();
        } catch (err) {
            setError('Failed to cancel agreement. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        if (!loading) {
            setReason('');
            setError('');
            onClose();
        }
    };

    return (
        <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
            <DialogTitle className="flex items-center gap-2">
                <MdOutlineCancel className="text-error-500 text-xl" />
                Cancel Trade Agreement
            </DialogTitle>

            <DialogContent>
                <Alert severity="warning" className="mb-4">
                    <strong>Warning:</strong> This action cannot be undone. The other party will be notified of this cancellation.
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
                    label="Cancellation Reason"
                    placeholder="Please explain why you are cancelling this agreement..."
                    value={reason}
                    onChange={(e: any) => {
                        setReason(e.target.value);
                        if (error) setError('');
                    }}
                    helperText={`${reason.length}/500 characters (minimum 10)`}
                    error={!!error || (reason.length > 0 && reason.length < 10)}
                    disabled={loading}
                    className="mt-2"
                />

                <Alert severity="info" className="mt-4">
                    Your reason will be:
                    <ul className="list-disc ml-5 mt-1">
                        <li>Sent to the other party in chat</li>
                        <li>Recorded in the system</li>
                        <li>Visible to platform administrators</li>
                    </ul>
                </Alert>
            </DialogContent>

            <DialogActions>
                <Button onClick={handleClose} disabled={loading} variant="text">
                    Keep Agreement
                </Button>
                <Button
                    onClick={handleCancel}
                    color="error"
                    variant="contained"
                    disabled={loading || reason.trim().length < 10}
                    startIcon={loading ? <CircularProgress size={20} /> : <MdOutlineCancel />}
                >
                    {loading ? <CircularProgress size={20} color="inherit" /> : 'Confirm Cancellation'}
                </Button>
            </DialogActions>
        </Dialog>
    );
}
