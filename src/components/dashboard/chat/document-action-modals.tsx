'use client';

import * as React from 'react';
import { Box } from '@/components/ui/box';
import { Stack } from '@/components/ui/stack';
import { Typography } from '@/components/ui/typography';
import { PenTool, Type, X, CheckCircle, AlertTriangle, XCircle, Loader2, Eye } from 'lucide-react';

// ═══════════════════════════════════════════════════════════
// SIGNATURE MODAL — Draw or Type a digital signature
// ═══════════════════════════════════════════════════════════

interface SignatureModalProps {
    documentTitle: string;
    isLoading: boolean;
    initialSavePreference?: boolean;
    savedSignatureData?: string | null;
    onConfirm: (signatureType: 'typed_name' | 'svg_drawing', signatureData: string) => void;
    onToggleSavePreference?: (enabled: boolean) => void;
    onClose: () => void;
}

const SIGNATURE_FONTS = [
    { name: 'Dancing Script', style: "'Dancing Script', cursive" },
    { name: 'Great Vibes', style: "'Great Vibes', cursive" },
    { name: 'Satisfy', style: "'Satisfy', cursive" },
];

export function SignatureModal({
    documentTitle,
    isLoading,
    initialSavePreference = false,
    savedSignatureData = null,
    onConfirm,
    onToggleSavePreference,
    onClose
}: SignatureModalProps) {
    const [tab, setTab] = React.useState<'type' | 'draw'>('type');
    const [typedName, setTypedName] = React.useState('');
    const [selectedFont, setSelectedFont] = React.useState(SIGNATURE_FONTS[0].style);
    const [saveEnabled, setSaveEnabled] = React.useState(initialSavePreference);
    const canvasRef = React.useRef<HTMLCanvasElement>(null);
    const isDrawingRef = React.useRef(false);
    const lastPosRef = React.useRef<{ x: number; y: number } | null>(null);

    // Sync save preference if it changes externally
    React.useEffect(() => {
        setSaveEnabled(initialSavePreference);
    }, [initialSavePreference]);

    const handleToggleSave = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newVal = e.target.checked;
        setSaveEnabled(newVal);
        onToggleSavePreference?.(newVal);
    };

    const handleUseSaved = () => {
        if (!savedSignatureData) return;
        try {
            const data = JSON.parse(savedSignatureData);
            if (data.name && data.font) {
                setTab('type');
                setTypedName(data.name);
                setSelectedFont(data.font);
            } else {
                // It's likely a dataURL string if not JSON
                applyDataUrlToCanvas(savedSignatureData);
            }
        } catch (e) {
            // If not JSON, it's a dataURL
            applyDataUrlToCanvas(savedSignatureData);
        }
    };

    const applyDataUrlToCanvas = (url: string) => {
        setTab('draw');
        const img = new Image();
        img.onload = () => {
            const ctx = canvasRef.current?.getContext('2d');
            if (ctx && canvasRef.current) {
                ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
                ctx.drawImage(img, 0, 0);
            }
        };
        img.src = url;
    };

    // Canvas drawing handlers
    const getCanvasPos = (e: React.MouseEvent | React.TouchEvent) => {
        const canvas = canvasRef.current;
        if (!canvas) return { x: 0, y: 0 };
        const rect = canvas.getBoundingClientRect();
        const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
        const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
        return { x: clientX - rect.left, y: clientY - rect.top };
    };

    const startDraw = (e: React.MouseEvent | React.TouchEvent) => {
        isDrawingRef.current = true;
        lastPosRef.current = getCanvasPos(e);
    };

    const draw = (e: React.MouseEvent | React.TouchEvent) => {
        if (!isDrawingRef.current || !canvasRef.current) return;
        const ctx = canvasRef.current.getContext('2d');
        if (!ctx || !lastPosRef.current) return;
        const pos = getCanvasPos(e);
        ctx.beginPath();
        ctx.moveTo(lastPosRef.current.x, lastPosRef.current.y);
        ctx.lineTo(pos.x, pos.y);
        ctx.strokeStyle = '#111827';
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.stroke();
        lastPosRef.current = pos;
    };

    const stopDraw = () => {
        isDrawingRef.current = false;
        lastPosRef.current = null;
    };

    const clearCanvas = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
    };

    const handleSubmit = () => {
        if (tab === 'type') {
            if (!typedName.trim()) return;
            // For typed: send the name + font as JSON
            onConfirm('typed_name', JSON.stringify({ name: typedName.trim(), font: selectedFont }));
        } else {
            const canvas = canvasRef.current;
            if (!canvas) return;
            const dataUrl = canvas.toDataURL('image/png');
            // Check if canvas is empty
            const ctx = canvas.getContext('2d');
            if (!ctx) return;
            const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
            const hasDrawing = pixels.some((p, i) => i % 4 === 3 && p > 0);
            if (!hasDrawing) return;
            onConfirm('svg_drawing', dataUrl);
        }
    };

    const isValid = tab === 'type' ? typedName.trim().length > 0 : true;

    return (
        <Box
            onClick={onClose}
            style={{
                position: 'fixed', inset: 0, zIndex: 9999,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)',
            }}
        >
            {/* Google Fonts for signature */}
            <link href="https://fonts.googleapis.com/css2?family=Dancing+Script:wght@700&family=Great+Vibes&family=Satisfy&display=swap" rel="stylesheet" />

            <Box
                onClick={(e: React.MouseEvent) => e.stopPropagation()}
                style={{
                    background: 'white', borderRadius: '1rem', width: '100%', maxWidth: '480px',
                    boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', overflow: 'hidden',
                }}
            >
                {/* Header */}
                <Box style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #f3f4f6', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box>
                        <Typography variant="subtitle1" style={{ fontWeight: 800, color: '#111827', fontSize: '1rem' }}>
                            Accept Document
                        </Typography>
                        <Typography variant="caption" style={{ color: '#6b7280', fontSize: '0.75rem', display: 'block', marginTop: '2px' }}>
                            {documentTitle}
                        </Typography>
                    </Box>
                    <button onClick={onClose} style={{ padding: '0.5rem', borderRadius: '0.5rem', border: 'none', background: '#f3f4f6', cursor: 'pointer', display: 'flex' }}>
                        <X size={16} color="#6b7280" />
                    </button>
                </Box>

                {/* Tab Switcher */}
                <Box style={{ display: 'flex', borderBottom: '1px solid #f3f4f6' }}>
                    <button
                        onClick={() => setTab('type')}
                        style={{
                            flex: 1, padding: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                            border: 'none', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 700, transition: 'all 0.2s',
                            background: tab === 'type' ? '#ecfdf5' : 'white', color: tab === 'type' ? '#10b981' : '#6b7280',
                            borderBottom: tab === 'type' ? '2px solid #10b981' : '2px solid transparent',
                        }}
                    >
                        <Type size={16} /> Type Signature
                    </button>
                    <button
                        onClick={() => setTab('draw')}
                        style={{
                            flex: 1, padding: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                            border: 'none', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 700, transition: 'all 0.2s',
                            background: tab === 'draw' ? '#ecfdf5' : 'white', color: tab === 'draw' ? '#10b981' : '#6b7280',
                            borderBottom: tab === 'draw' ? '2px solid #10b981' : '2px solid transparent',
                        }}
                    >
                        <PenTool size={16} /> Draw Signature
                    </button>
                </Box>

                {/* Body */}
                <Box style={{ padding: '1.5rem' }}>
                    {tab === 'type' ? (
                        <Box>
                            <Typography variant="caption" style={{ fontWeight: 700, color: '#374151', fontSize: '0.75rem', display: 'block', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                Full Legal Name
                            </Typography>
                            <input
                                type="text"
                                value={typedName}
                                onChange={(e) => setTypedName(e.target.value)}
                                placeholder="Enter your full name"
                                style={{
                                    width: '100%', padding: '0.75rem 1rem', borderRadius: '0.5rem', border: '1px solid #e5e7eb',
                                    fontSize: '0.875rem', outline: 'none', background: '#f9fafb', boxSizing: 'border-box',
                                }}
                            />

                            {/* Font Selection */}
                            <Typography variant="caption" style={{ fontWeight: 700, color: '#374151', fontSize: '0.75rem', display: 'block', marginTop: '1rem', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                Style
                            </Typography>
                            <Box style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                {SIGNATURE_FONTS.map((font) => (
                                    <button
                                        key={font.name}
                                        onClick={() => setSelectedFont(font.style)}
                                        style={{
                                            padding: '0.5rem 1rem', borderRadius: '0.5rem', cursor: 'pointer', transition: 'all 0.15s',
                                            border: selectedFont === font.style ? '2px solid #10b981' : '1px solid #e5e7eb',
                                            background: selectedFont === font.style ? '#ecfdf5' : 'white',
                                            fontFamily: font.style, fontSize: '1rem', color: '#111827',
                                        }}
                                    >
                                        Aa
                                    </button>
                                ))}
                            </Box>

                            {/* Preview */}
                            {typedName && (
                                <Box style={{ marginTop: '1rem', padding: '1.5rem', background: '#fafafa', borderRadius: '0.75rem', border: '1px dashed #d1d5db', textAlign: 'center' }}>
                                    <Typography variant="caption" style={{ color: '#9ca3af', fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', display: 'block', marginBottom: '0.5rem' }}>
                                        Preview
                                    </Typography>
                                    <Typography style={{ fontFamily: selectedFont, fontSize: '1.75rem', color: '#111827', lineHeight: 1.2 }}>
                                        {typedName}
                                    </Typography>
                                    <Box style={{ width: '60%', margin: '0.5rem auto 0', borderTop: '1px solid #9ca3af' }} />
                                </Box>
                            )}
                        </Box>
                    ) : (
                        <Box>
                            <Box style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                                <Typography variant="caption" style={{ fontWeight: 700, color: '#374151', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                    Draw below
                                </Typography>
                                <button
                                    onClick={clearCanvas}
                                    style={{ padding: '0.25rem 0.75rem', borderRadius: '0.375rem', border: '1px solid #e5e7eb', background: 'white', cursor: 'pointer', fontSize: '0.7rem', fontWeight: 600, color: '#6b7280' }}
                                >
                                    Clear
                                </button>
                            </Box>
                            <Box style={{ border: '1px dashed #d1d5db', borderRadius: '0.75rem', background: '#fafafa', overflow: 'hidden' }}>
                                <canvas
                                    ref={canvasRef}
                                    width={420}
                                    height={160}
                                    style={{ width: '100%', height: '160px', cursor: 'crosshair', touchAction: 'none' }}
                                    onMouseDown={startDraw}
                                    onMouseMove={draw}
                                    onMouseUp={stopDraw}
                                    onMouseLeave={stopDraw}
                                    onTouchStart={startDraw}
                                    onTouchMove={draw}
                                    onTouchEnd={stopDraw}
                                />
                            </Box>
                            <Typography variant="caption" style={{ color: '#9ca3af', fontSize: '0.65rem', marginTop: '0.5rem', display: 'block', textAlign: 'center' }}>
                                Use your mouse or finger to draw your signature
                            </Typography>
                        </Box>
                    )}

                    {/* Reuse Saved Signature Action */}
                    {savedSignatureData && (
                        <Box style={{ marginTop: '1rem', display: 'flex', justifyContent: 'center' }}>
                            <button
                                onClick={handleUseSaved}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: '6px', padding: '0.5rem 1rem',
                                    borderRadius: '0.5rem', border: '1px solid #10b981', background: '#ecfdf5',
                                    color: '#059669', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer',
                                }}
                            >
                                <CheckCircle size={14} /> Use Saved Signature
                            </button>
                        </Box>
                    )}
                </Box>

                {/* Save Preference Toggle */}
                <Box style={{ padding: '0 1.5rem 1rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', userSelect: 'none' }}>
                        <div style={{ position: 'relative', width: '36px', height: '20px' }}>
                            <input
                                type="checkbox"
                                checked={saveEnabled}
                                onChange={handleToggleSave}
                                style={{ opacity: 0, width: 0, height: 0 }}
                            />
                            <div style={{
                                position: 'absolute', inset: 0, borderRadius: '20px', transition: 'all 0.2s',
                                background: saveEnabled ? '#10b981' : '#e5e7eb',
                            }} />
                            <div style={{
                                position: 'absolute', top: '2px', left: saveEnabled ? '18px' : '2px',
                                width: '16px', height: '16px', borderRadius: '50%', background: 'white',
                                transition: 'all 0.2s', boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
                            }} />
                        </div>
                        <Typography variant="caption" style={{ fontWeight: 600, color: '#4b5563', fontSize: '0.75rem' }}>
                            Save signature for future use
                        </Typography>
                    </label>
                </Box>

                <Box style={{ padding: '0 1.5rem 1rem', fontSize: '0.65rem', color: '#9ca3af', lineHeight: 1.4 }}>
                    By clicking &quot;Accept&quot;, you agree that this electronic signature is the legal equivalent of your handwritten signature.
                </Box>

                {/* Footer */}
                <Box style={{ padding: '1rem 1.5rem', borderTop: '1px solid #f3f4f6', display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                    <button
                        onClick={onClose}
                        style={{ padding: '0.625rem 1.25rem', borderRadius: '0.5rem', border: '1px solid #e5e7eb', background: 'white', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600, color: '#374151' }}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={isLoading || !isValid}
                        className={`flex items-center gap-2 px-5 py-2.5 bg-emerald-600 text-white text-sm font-bold rounded-lg hover:bg-emerald-700 transition-all shadow-sm shrink-0 self-start sm:self-auto ${isLoading || !isValid ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                        {isLoading ? <><Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> Submitting...</> : <><CheckCircle size={14} /> Sign &amp; Accept</>}
                    </button>
                </Box>
            </Box>
        </Box>
    );
}


// ═══════════════════════════════════════════════════════════
// ACTION CONFIRM MODAL — Flag or Reject with reason
// ═══════════════════════════════════════════════════════════

interface ActionConfirmModalProps {
    actionType: 'flag' | 'reject';
    documentTitle: string;
    isLoading: boolean;
    onConfirm: (reason: string) => void;
    onClose: () => void;
}

const actionConfig = {
    flag: {
        title: 'Flag Document',
        description: 'Raise a concern or issue with this document. The admin will be notified.',
        icon: <AlertTriangle size={20} />,
        color: '#f59e0b',
        bg: '#fffbeb',
        border: '#fde68a',
        buttonLabel: 'Submit Flag',
        placeholder: 'Describe the issue or concern with this document...',
    },
    reject: {
        title: 'Reject Document',
        description: 'This document will be marked as rejected. The admin will be required to address your concerns.',
        icon: <XCircle size={20} />,
        color: '#ef4444',
        bg: '#fef2f2',
        border: '#fecaca',
        buttonLabel: 'Confirm Rejection',
        placeholder: 'Explain why you are rejecting this document...',
    },
};

export function ActionConfirmModal({ actionType, documentTitle, isLoading, onConfirm, onClose }: ActionConfirmModalProps) {
    const [reason, setReason] = React.useState('');
    const config = actionConfig[actionType];

    return (
        <Box
            onClick={onClose}
            style={{
                position: 'fixed', inset: 0, zIndex: 9999,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)',
            }}
        >
            <Box
                onClick={(e: React.MouseEvent) => e.stopPropagation()}
                style={{
                    background: 'white', borderRadius: '1rem', width: '100%', maxWidth: '440px',
                    boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', overflow: 'hidden',
                }}
            >
                {/* Header */}
                <Box style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #f3f4f6', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <Stack direction="row" spacing={1} style={{ alignItems: 'center' }}>
                        <Box style={{ width: '36px', height: '36px', borderRadius: '0.5rem', background: config.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: config.color }}>
                            {config.icon}
                        </Box>
                        <Box>
                            <Typography variant="subtitle1" style={{ fontWeight: 800, color: '#111827', fontSize: '1rem' }}>
                                {config.title}
                            </Typography>
                            <Typography variant="caption" style={{ color: '#6b7280', fontSize: '0.75rem', display: 'block', marginTop: '2px' }}>
                                {documentTitle}
                            </Typography>
                        </Box>
                    </Stack>
                    <button onClick={onClose} style={{ padding: '0.5rem', borderRadius: '0.5rem', border: 'none', background: '#f3f4f6', cursor: 'pointer', display: 'flex' }}>
                        <X size={16} color="#6b7280" />
                    </button>
                </Box>

                {/* Body */}
                <Box style={{ padding: '1.5rem' }}>
                    <Typography variant="body2" style={{ color: '#4b5563', fontSize: '0.8rem', marginBottom: '1rem', lineHeight: 1.5 }}>
                        {config.description}
                    </Typography>

                    <Typography variant="caption" style={{ fontWeight: 700, color: '#374151', fontSize: '0.75rem', display: 'block', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        Reason <span style={{ color: config.color }}>*</span>
                    </Typography>
                    <textarea
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        placeholder={config.placeholder}
                        rows={4}
                        style={{
                            width: '100%', padding: '0.75rem 1rem', borderRadius: '0.5rem',
                            border: `1px solid ${config.border}`, fontSize: '0.8rem', outline: 'none',
                            resize: 'vertical', background: '#fafafa', boxSizing: 'border-box',
                            fontFamily: 'inherit',
                        }}
                    />
                </Box>

                {/* Footer */}
                <Box style={{ padding: '1rem 1.5rem', borderTop: '1px solid #f3f4f6', display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                    <button
                        onClick={onClose}
                        style={{ padding: '0.625rem 1.25rem', borderRadius: '0.5rem', border: '1px solid #e5e7eb', background: 'white', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600, color: '#374151' }}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={() => onConfirm(reason)}
                        disabled={!reason.trim() || isLoading}
                        style={{
                            padding: '0.625rem 1.5rem', borderRadius: '0.5rem', border: 'none', cursor: 'pointer',
                            fontSize: '0.8rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px', transition: 'all 0.15s',
                            background: reason.trim() && !isLoading ? config.color : '#d1d5db', color: 'white',
                        }}
                    >
                        {isLoading ? <><Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> Submitting...</> : config.buttonLabel}
                    </button>
                </Box>
            </Box>
        </Box>
    );
}

// ═══════════════════════════════════════════════════════════
// LONG TEXT MODAL — View full content of long fields
// ═══════════════════════════════════════════════════════════

interface LongTextModalProps {
    title: string;
    content: string;
    onClose: () => void;
}

export function LongTextModal({ title, content, onClose }: LongTextModalProps) {
    return (
        <Box
            style={{
                position: 'fixed',
                inset: 0,
                zIndex: 10000,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'rgba(0, 0, 0, 0.4)',
                backdropFilter: 'blur(4px)',
            }}
            onClick={onClose}
        >
            <Box
                style={{
                    background: 'white',
                    width: '90%',
                    maxWidth: '500px',
                    borderRadius: '1rem',
                    overflow: 'hidden',
                    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
                }}
                onClick={(e) => e.stopPropagation()}
            >
                <div style={{ padding: '1rem', borderBottom: '1px solid #f3f4f6', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f9fafb' }}>
                    <Typography variant="subtitle2" style={{ fontWeight: 800, color: '#111827' }}>
                        {title}
                    </Typography>
                    <button onClick={onClose} style={{ borderRadius: '999px', padding: '0.25rem', border: 'none', background: 'transparent', cursor: 'pointer', color: '#6b7280' }}>
                        <X size={18} />
                    </button>
                </div>
                <div style={{ padding: '1.5rem', maxHeight: '60vh', overflowY: 'auto' }}>
                    <Typography variant="body2" style={{ color: '#374151', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                        {content}
                    </Typography>
                </div>
                <div style={{ padding: '1rem', borderTop: '1px solid #f3f4f6', textAlign: 'right', background: '#f9fafb' }}>
                    <button
                        onClick={onClose}
                        style={{ padding: '0.5rem 1.5rem', borderRadius: '0.5rem', background: '#3b82f6', color: 'white', border: 'none', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 700 }}
                    >
                        Close
                    </button>
                </div>
            </Box>
        </Box>
    );
}
