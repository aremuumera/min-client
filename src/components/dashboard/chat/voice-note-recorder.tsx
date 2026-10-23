'use client';

import * as React from 'react';
import { Mic, Trash2, Send, Pause, Play, Square, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface VoiceNoteRecorderProps {
    onSend: (audioFile: File, durationSeconds: number) => Promise<void>;
    onCancel: () => void;
}

export function VoiceNoteRecorder({ onSend, onCancel }: VoiceNoteRecorderProps) {
    const [isRecording, setIsRecording] = React.useState(false);
    const [isPaused, setIsPaused] = React.useState(false);
    const [recordingTime, setRecordingTime] = React.useState(0);
    const [audioBlob, setAudioBlob] = React.useState<Blob | null>(null);
    const [audioUrl, setAudioUrl] = React.useState<string | null>(null);
    const [isPlayingPreview, setIsPlayingPreview] = React.useState(false);
    const [previewCurrentTime, setPreviewCurrentTime] = React.useState(0);
    const [isSubmitting, setIsSubmitting] = React.useState(false);

    const mediaRecorderRef = React.useRef<MediaRecorder | null>(null);
    const audioChunksRef = React.useRef<Blob[]>([]);
    const timerRef = React.useRef<NodeJS.Timeout | null>(null);
    const previewAudioRef = React.useRef<HTMLAudioElement | null>(null);
    const streamRef = React.useRef<MediaStream | null>(null);

    // Track state in refs to prevent closure desync
    const isRecordingRef = React.useRef(false);
    const isPausedRef = React.useRef(false);

    const clearTimer = () => {
        if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
        }
    };

    const stopAllTracks = () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => {
                track.stop();
                track.enabled = false;
            });
            streamRef.current = null;
        }
    };

    // Start recording on mount
    React.useEffect(() => {
        startRecording();
        return () => {
            clearTimer();
            stopAllTracks();
            if (audioUrl) URL.revokeObjectURL(audioUrl);
        };
    }, []);

    const startRecording = async () => {
        try {
            audioChunksRef.current = [];
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            streamRef.current = stream;

            const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
                ? 'audio/webm;codecs=opus'
                : MediaRecorder.isTypeSupported('audio/webm')
                ? 'audio/webm'
                : 'audio/mp4';

            const mediaRecorder = new MediaRecorder(stream, { mimeType });
            mediaRecorderRef.current = mediaRecorder;

            mediaRecorder.ondataavailable = (event) => {
                if (event.data && event.data.size > 0) {
                    audioChunksRef.current.push(event.data);
                }
            };

            mediaRecorder.onstop = () => {
                const blob = new Blob(audioChunksRef.current, { type: mimeType });
                setAudioBlob(blob);
                const url = URL.createObjectURL(blob);
                setAudioUrl(url);
                stopAllTracks();
            };

            mediaRecorder.start(); // Record continuous unfragmented audio stream
            setIsRecording(true);
            setIsPaused(false);
            isRecordingRef.current = true;
            isPausedRef.current = false;
            setRecordingTime(0);

            clearTimer();
            timerRef.current = setInterval(() => {
                if (isRecordingRef.current && !isPausedRef.current) {
                    setRecordingTime(prev => prev + 1);
                }
            }, 1000);
        } catch (err: any) {
            console.error('Error accessing microphone:', err);
            toast.error('Microphone access denied or not available. Please allow microphone permissions.');
            onCancel();
        }
    };

    const pauseRecording = () => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
            try {
                mediaRecorderRef.current.pause();
            } catch (e) {
                console.warn('pause failed:', e);
            }
            setIsPaused(true);
            isPausedRef.current = true;
            clearTimer();
        }
    };

    const resumeRecording = () => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'paused') {
            try {
                mediaRecorderRef.current.resume();
            } catch (e) {
                console.warn('resume failed:', e);
            }
            setIsPaused(false);
            isPausedRef.current = false;
            clearTimer();
            timerRef.current = setInterval(() => {
                if (isRecordingRef.current && !isPausedRef.current) {
                    setRecordingTime(prev => prev + 1);
                }
            }, 1000);
        }
    };

    const stopToPreview = () => {
        clearTimer();
        isRecordingRef.current = false;
        isPausedRef.current = false;
        setIsRecording(false);
        setIsPaused(false);

        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
            try {
                mediaRecorderRef.current.stop();
            } catch (e) {
                console.warn('stop failed:', e);
            }
        }
    };

    const togglePreviewPlay = () => {
        const audio = previewAudioRef.current;
        if (!audio) return;

        if (isPlayingPreview) {
            audio.pause();
            setIsPlayingPreview(false);
        } else {
            audio.play().then(() => {
                setIsPlayingPreview(true);
            }).catch(err => {
                console.error('Preview play error:', err);
                setIsPlayingPreview(false);
            });
        }
    };

    const handleSend = async () => {
        if (isSubmitting) return;

        try {
            setIsSubmitting(true);
            clearTimer();

            let finalBlob = audioBlob;
            let duration = recordingTime;

            // If still actively recording when send is clicked, stop and get blob
            if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
                isRecordingRef.current = false;
                isPausedRef.current = false;
                await new Promise<void>((resolve) => {
                    if (!mediaRecorderRef.current) return resolve();
                    mediaRecorderRef.current.onstop = () => {
                        finalBlob = new Blob(audioChunksRef.current, { type: mediaRecorderRef.current?.mimeType || 'audio/webm' });
                        stopAllTracks();
                        resolve();
                    };
                    mediaRecorderRef.current.stop();
                });
            }

            if (!finalBlob || finalBlob.size === 0) {
                toast.error('Voice note was empty. Please try again.');
                onCancel();
                return;
            }

            const ext = finalBlob.type.includes('mp4') ? 'mp4' : 'webm';
            const file = new File([finalBlob], `voice_${Date.now()}.${ext}`, { type: finalBlob.type });

            await onSend(file, Math.max(duration, 1));
        } catch (err: any) {
            console.error('Failed to send voice note:', err);
            toast.error(err?.message || 'Failed to send voice note');
        } finally {
            setIsSubmitting(false);
        }
    };

    const formatTime = (secs: number) => {
        const m = Math.floor(secs / 60);
        const s = Math.floor(secs % 60);
        return `${m}:${s < 10 ? '0' : ''}${s}`;
    };

    return (
        <div className="flex-1 flex items-center justify-between gap-3 px-3 py-1.5 bg-emerald-50/80 border border-emerald-200 rounded-xl min-h-[38px] transition-all select-none">
            {/* Audio Preview element if stopped */}
            {audioUrl && (
                <audio
                    ref={previewAudioRef}
                    src={audioUrl}
                    onTimeUpdate={(e) => setPreviewCurrentTime(Math.floor((e.target as HTMLAudioElement).currentTime))}
                    onEnded={() => {
                        setIsPlayingPreview(false);
                        setPreviewCurrentTime(0);
                    }}
                />
            )}

            {/* Left status / timer */}
            <div className="flex items-center gap-2 min-w-0">
                {isRecording ? (
                    <div className="flex items-center gap-2">
                        <span className={`w-2.5 h-2.5 rounded-full ${isPaused ? 'bg-amber-500' : 'bg-red-500 animate-ping'}`} />
                        <span className="text-xs font-bold font-mono text-gray-800">
                            {formatTime(recordingTime)}
                            {isPaused && <span className="ml-1 text-[10px] text-amber-700 font-sans font-medium">(Paused)</span>}
                        </span>
                        {/* Animated Waveform Bars */}
                        {!isPaused && (
                            <div className="hidden sm:flex items-center gap-0.5 h-3">
                                <span className="w-0.5 h-2 bg-emerald-500 rounded-full animate-pulse" />
                                <span className="w-0.5 h-3 bg-emerald-600 rounded-full animate-pulse delay-75" />
                                <span className="w-0.5 h-1.5 bg-emerald-400 rounded-full animate-pulse delay-150" />
                                <span className="w-0.5 h-2.5 bg-emerald-500 rounded-full animate-pulse delay-100" />
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={togglePreviewPlay}
                            className="p-1.5 rounded-full bg-emerald-600 text-white hover:bg-emerald-700 transition-colors shadow-none"
                            title={isPlayingPreview ? 'Pause preview' : 'Play preview'}
                        >
                            {isPlayingPreview ? <Pause size={12} className="fill-current" /> : <Play size={12} className="fill-current ml-0.5" />}
                        </button>
                        <span className="text-xs font-bold font-mono text-gray-700">
                            {isPlayingPreview ? formatTime(previewCurrentTime) : formatTime(recordingTime)} / {formatTime(recordingTime)}
                        </span>
                    </div>
                )}
            </div>

            {/* Right Action Controls */}
            <div className="flex items-center gap-1.5 shrink-0">
                {/* Trash / Cancel */}
                <button
                    type="button"
                    onClick={() => {
                        clearTimer();
                        stopAllTracks();
                        onCancel();
                    }}
                    disabled={isSubmitting}
                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Cancel recording"
                >
                    <Trash2 size={16} />
                </button>

                {/* Pause / Resume while recording */}
                {isRecording && (
                    <button
                        type="button"
                        onClick={isPaused ? resumeRecording : pauseRecording}
                        className={`p-1.5 rounded-lg transition-colors ${isPaused ? 'text-amber-700 bg-amber-100 hover:bg-amber-200' : 'text-gray-600 hover:text-emerald-700 hover:bg-emerald-100'}`}
                        title={isPaused ? 'Resume recording' : 'Pause recording'}
                    >
                        {isPaused ? <Play size={15} className="fill-current" /> : <Pause size={15} className="fill-current" />}
                    </button>
                )}

                {/* Stop & Preview button */}
                {isRecording && (
                    <button
                        type="button"
                        onClick={stopToPreview}
                        className="p-1.5 text-gray-600 hover:text-emerald-700 hover:bg-emerald-100 rounded-lg transition-colors"
                        title="Stop & Listen before sending"
                    >
                        <Square size={14} className="fill-current" />
                    </button>
                )}

                {/* Send Button */}
                <button
                    type="button"
                    onClick={handleSend}
                    disabled={isSubmitting}
                    className="flex items-center justify-center h-8 w-8 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 transition-all disabled:opacity-50"
                    title="Send Voice Note"
                >
                    {isSubmitting ? (
                        <Loader2 size={14} className="animate-spin" />
                    ) : (
                        <Send size={14} />
                    )}
                </button>
            </div>
        </div>
    );
}
