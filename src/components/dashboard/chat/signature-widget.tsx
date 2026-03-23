'use client';

import * as React from 'react';
import { Box } from '@/components/ui/box';
import { Card } from '@/components/ui/card';
import { Stack } from '@/components/ui/stack';
import { Typography } from '@/components/ui/typography';
import { Modal } from '@/components/ui/modal';
import { PenTool, Type, Shield, X, Check, AlertTriangle, Flag } from 'lucide-react';

interface SignatureWidgetProps {
    open: boolean;
    onClose: () => void;
    onSubmit: (data: {
        action: 'accept' | 'flag' | 'reject';
        signature_type?: 'typed_name' | 'svg_drawing';
        signature_data?: string;
        reason?: string;
    }) => void;
    documentTitle?: string;
    documentDescription?: string;
    isLoading?: boolean;
}

export function SignatureWidget({
    open,
    onClose,
    onSubmit,
    documentTitle = 'Trade Document',
    documentDescription,
    isLoading = false,
}: SignatureWidgetProps) {
    const [activeTab, setActiveTab] = React.useState<'type' | 'draw'>('type');
    const [typedName, setTypedName] = React.useState('');
    const [action, setAction] = React.useState<'accept' | 'flag' | 'reject'>('accept');
    const [reason, setReason] = React.useState('');
    const canvasRef = React.useRef<HTMLCanvasElement>(null);
    const [isDrawing, setIsDrawing] = React.useState(false);
    const [hasDrawn, setHasDrawn] = React.useState(false);

    // Canvas drawing helpers
    const getCanvas = () => canvasRef.current;
    const getCtx = () => getCanvas()?.getContext('2d');

    const startDraw = (e: React.MouseEvent | React.TouchEvent) => {
        const ctx = getCtx();
        if (!ctx) return;
        setIsDrawing(true);
        setHasDrawn(true);
        const rect = getCanvas()!.getBoundingClientRect();
        const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
        const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
        ctx.beginPath();
        ctx.moveTo(clientX - rect.left, clientY - rect.top);
    };

    const draw = (e: React.MouseEvent | React.TouchEvent) => {
        if (!isDrawing) return;
        const ctx = getCtx();
        if (!ctx) return;
        const rect = getCanvas()!.getBoundingClientRect();
        const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
        const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        ctx.strokeStyle = '#111827';
        ctx.lineTo(clientX - rect.left, clientY - rect.top);
        ctx.stroke();
    };

    const stopDraw = () => setIsDrawing(false);

    const clearCanvas = () => {
        const ctx = getCtx();
        const canvas = getCanvas();
        if (!ctx || !canvas) return;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        setHasDrawn(false);
    };

    const handleSubmit = () => {
        if (action === 'accept') {
            const signatureData =
                activeTab === 'type'
                    ? typedName
                    : canvasRef.current?.toDataURL('image/png') || '';

            onSubmit({
                action: 'accept',
                signature_type: activeTab === 'type' ? 'typed_name' : 'svg_drawing',
                signature_data: signatureData,
            });
        } else {
            onSubmit({
                action,
                reason: reason || undefined,
            });
        }
    };

    const canSubmit = () => {
        if (action === 'accept') {
            return activeTab === 'type' ? typedName.trim().length > 2 : hasDrawn;
        }
        return reason.trim().length > 5;
    };

    return (
        <Modal
            open={open}
            onClose={onClose}
            className="flex items-center justify-center backdrop-blur-sm bg-black/40"
        >
            <Box
                style={{
                    outline: 'none',
                    width: '100%',
                    maxWidth: '480px',
                    margin: '1rem',
                }}
            >
                <Card
                    style={{
                        borderRadius: '1rem',
                        overflow: 'hidden',
                        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                    }}
                >
                    {/* Header */}
                    <Box
                        style={{
                            padding: '1rem 1.25rem',
                            borderBottom: '1px solid #e5e7eb',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                        }}
                    >
                        <Box>
                            <Typography variant="subtitle1" style={{ fontWeight: 700, color: '#111827' }}>
                                Document Action
                            </Typography>
                            <Typography variant="caption" style={{ color: '#6b7280', fontSize: '0.7rem' }}>
                                {documentTitle}
                            </Typography>
                            {documentDescription && (
                                <Typography
                                    variant="caption"
                                    style={{
                                        color: '#6b7280',
                                        fontSize: '0.65rem',
                                        display: 'block',
                                        marginTop: '1px',
                                        fontStyle: 'italic',
                                        lineHeight: 1.2,
                                    }}
                                >
                                    {documentDescription}
                                </Typography>
                            )}
                        </Box>
                        <button
                            onClick={onClose}
                            style={{
                                padding: '0.375rem',
                                borderRadius: '999px',
                                border: 'none',
                                background: '#f3f4f6',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}
                        >
                            <X size={16} color="#6b7280" />
                        </button>
                    </Box>

                    {/* Action Selection */}
                    <Box style={{ padding: '0.75rem 1.25rem', borderBottom: '1px solid #f3f4f6' }}>
                        <Stack direction="row" spacing={1}>
                            {[
                                { key: 'accept' as const, label: 'Accept & Sign', color: '#10b981', icon: <Check size={14} /> },
                                { key: 'flag' as const, label: 'Flag', color: '#f59e0b', icon: <Flag size={14} /> },
                                { key: 'reject' as const, label: 'Reject', color: '#ef4444', icon: <X size={14} /> },
                            ].map((opt) => (
                                <button
                                    key={opt.key}
                                    onClick={() => setAction(opt.key)}
                                    style={{
                                        flex: 1,
                                        padding: '0.5rem',
                                        borderRadius: '0.5rem',
                                        border: `2px solid ${action === opt.key ? opt.color : '#e5e7eb'}`,
                                        background: action === opt.key ? `${opt.color}10` : 'white',
                                        color: action === opt.key ? opt.color : '#6b7280',
                                        fontSize: '0.75rem',
                                        fontWeight: 700,
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '4px',
                                        transition: 'all 0.15s',
                                    }}
                                >
                                    {opt.icon}
                                    {opt.label}
                                </button>
                            ))}
                        </Stack>
                    </Box>

                    {/* Content */}
                    <Box style={{ padding: '1rem 1.25rem' }}>
                        {action === 'accept' ? (
                            <>
                                {/* Tab Toggle */}
                                <Stack direction="row" spacing={0} style={{ marginBottom: '0.75rem' }}>
                                    <button
                                        onClick={() => setActiveTab('type')}
                                        style={{
                                            flex: 1,
                                            padding: '0.5rem',
                                            borderRadius: '0.5rem 0 0 0.5rem',
                                            border: '1px solid #e5e7eb',
                                            borderRight: 'none',
                                            background: activeTab === 'type' ? '#10b981' : 'white',
                                            color: activeTab === 'type' ? 'white' : '#6b7280',
                                            fontSize: '0.75rem',
                                            fontWeight: 700,
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: '4px',
                                        }}
                                    >
                                        <Type size={14} />
                                        Type Name
                                    </button>
                                    <button
                                        onClick={() => setActiveTab('draw')}
                                        style={{
                                            flex: 1,
                                            padding: '0.5rem',
                                            borderRadius: '0 0.5rem 0.5rem 0',
                                            border: '1px solid #e5e7eb',
                                            background: activeTab === 'draw' ? '#10b981' : 'white',
                                            color: activeTab === 'draw' ? 'white' : '#6b7280',
                                            fontSize: '0.75rem',
                                            fontWeight: 700,
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: '4px',
                                        }}
                                    >
                                        <PenTool size={14} />
                                        Draw Signature
                                    </button>
                                </Stack>

                                {activeTab === 'type' ? (
                                    <Box>
                                        <input
                                            type="text"
                                            value={typedName}
                                            onChange={(e) => setTypedName(e.target.value)}
                                            placeholder="Type your full legal name"
                                            style={{
                                                width: '100%',
                                                padding: '0.625rem 0.75rem',
                                                borderRadius: '0.5rem',
                                                border: '1px solid #e5e7eb',
                                                background: '#f9fafb',
                                                fontSize: '0.875rem',
                                                outline: 'none',
                                                fontFamily: "'Georgia', serif",
                                            }}
                                        />
                                        {typedName && (
                                            <Box
                                                style={{
                                                    marginTop: '0.75rem',
                                                    padding: '1rem',
                                                    borderRadius: '0.5rem',
                                                    border: '1px dashed #d1d5db',
                                                    textAlign: 'center',
                                                    background: '#fafafa',
                                                }}
                                            >
                                                <Typography
                                                    variant="h5"
                                                    style={{
                                                        fontFamily: "'Georgia', cursive, serif",
                                                        fontStyle: 'italic',
                                                        color: '#1f2937',
                                                    }}
                                                >
                                                    {typedName}
                                                </Typography>
                                            </Box>
                                        )}
                                    </Box>
                                ) : (
                                    <Box>
                                        <Box
                                            style={{
                                                borderRadius: '0.5rem',
                                                border: '1px dashed #d1d5db',
                                                overflow: 'hidden',
                                                background: '#fafafa',
                                                position: 'relative',
                                            }}
                                        >
                                            <canvas
                                                ref={canvasRef}
                                                width={400}
                                                height={150}
                                                onMouseDown={startDraw}
                                                onMouseMove={draw}
                                                onMouseUp={stopDraw}
                                                onMouseLeave={stopDraw}
                                                onTouchStart={startDraw}
                                                onTouchMove={draw}
                                                onTouchEnd={stopDraw}
                                                style={{
                                                    width: '100%',
                                                    height: '150px',
                                                    cursor: 'crosshair',
                                                    touchAction: 'none',
                                                }}
                                            />
                                            {!hasDrawn && (
                                                <Box
                                                    style={{
                                                        position: 'absolute',
                                                        inset: 0,
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        pointerEvents: 'none',
                                                    }}
                                                >
                                                    <Typography variant="caption" style={{ color: '#9ca3af' }}>
                                                        Draw your signature here
                                                    </Typography>
                                                </Box>
                                            )}
                                        </Box>
                                        {hasDrawn && (
                                            <button
                                                onClick={clearCanvas}
                                                style={{
                                                    marginTop: '0.5rem',
                                                    padding: '0.25rem 0.75rem',
                                                    borderRadius: '0.375rem',
                                                    border: '1px solid #e5e7eb',
                                                    background: 'white',
                                                    color: '#6b7280',
                                                    fontSize: '0.7rem',
                                                    cursor: 'pointer',
                                                }}
                                            >
                                                Clear
                                            </button>
                                        )}
                                    </Box>
                                )}
                            </>
                        ) : (
                            /* Flag / Reject — Reason Input */
                            <Box>
                                <Typography variant="caption" style={{ fontWeight: 700, color: '#374151', marginBottom: '0.5rem', display: 'block' }}>
                                    {action === 'flag' ? 'Reason for flagging:' : 'Reason for rejection:'}
                                </Typography>
                                <textarea
                                    value={reason}
                                    onChange={(e) => setReason(e.target.value)}
                                    placeholder={
                                        action === 'flag'
                                            ? 'Describe the issue you want reviewed...'
                                            : 'Provide a reason for rejecting this document...'
                                    }
                                    rows={4}
                                    style={{
                                        width: '100%',
                                        padding: '0.625rem 0.75rem',
                                        borderRadius: '0.5rem',
                                        border: '1px solid #e5e7eb',
                                        background: '#f9fafb',
                                        fontSize: '0.8rem',
                                        outline: 'none',
                                        resize: 'vertical',
                                        fontFamily: 'inherit',
                                    }}
                                />
                            </Box>
                        )}
                    </Box>

                    {/* Legal Notice */}
                    {action === 'accept' && (
                        <Box
                            style={{
                                padding: '0.5rem 1.25rem',
                                background: '#f9fafb',
                                borderTop: '1px solid #f3f4f6',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                            }}
                        >
                            <Shield size={14} color="#6b7280" />
                            <Typography variant="caption" style={{ color: '#6b7280', fontSize: '0.65rem' }}>
                                By signing, you agree to the terms outlined in this document. Your signature, IP address, and timestamp will be legally recorded.
                            </Typography>
                        </Box>
                    )}

                    {/* Submit Button */}
                    <Box style={{ padding: '0.75rem 1.25rem', borderTop: '1px solid #e5e7eb' }}>
                        <button
                            onClick={handleSubmit}
                            disabled={!canSubmit() || isLoading}
                            style={{
                                width: '100%',
                                padding: '0.625rem',
                                borderRadius: '0.5rem',
                                border: 'none',
                                background: action === 'accept' ? '#10b981' : action === 'flag' ? '#f59e0b' : '#ef4444',
                                color: 'white',
                                fontSize: '0.85rem',
                                fontWeight: 700,
                                cursor: canSubmit() && !isLoading ? 'pointer' : 'not-allowed',
                                opacity: canSubmit() && !isLoading ? 1 : 0.5,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '6px',
                                transition: 'all 0.15s',
                            }}
                        >
                            {isLoading ? 'Processing...' : action === 'accept' ? (
                                <><Check size={16} /> Confirm & Sign</>
                            ) : action === 'flag' ? (
                                <><AlertTriangle size={16} /> Flag for Review</>
                            ) : (
                                <><X size={16} /> Reject Document</>
                            )}
                        </button>
                    </Box>
                </Card>
            </Box>
        </Modal>
    );
}

export default SignatureWidget;
