'use client';

import * as React from 'react';
import { Play, Pause, Loader2 } from 'lucide-react';

interface VoiceNotePlayerProps {
    src: string;
    duration?: number;
    isOwn?: boolean;
}

// WhatsApp-style natural waveform heights (percentages)
const DEFAULT_WAVEFORM = [
    30, 45, 75, 55, 85, 100, 70, 40, 60, 90, 80, 50, 65, 85, 95, 75, 55, 80, 100, 85, 60, 40, 70, 90, 65, 45, 55, 70, 50, 35
];

const BAR_COUNT = DEFAULT_WAVEFORM.length;

export function VoiceNotePlayer({ src, duration: initialDuration = 0, isOwn = false }: VoiceNotePlayerProps) {
    const audioRef = React.useRef<HTMLAudioElement | null>(null);
    const waveContainerRef = React.useRef<HTMLDivElement | null>(null);
    const barRefs = React.useRef<(HTMLSpanElement | null)[]>([]);
    const timerRef = React.useRef<HTMLSpanElement | null>(null);
    const rafIdRef = React.useRef<number>(0);
    const isPlayingRef = React.useRef(false);
    const durationRef = React.useRef(initialDuration);

    const [isPlaying, setIsPlaying] = React.useState(false);
    const [duration, setDuration] = React.useState(initialDuration);
    const [playbackRate, setPlaybackRate] = React.useState<1 | 1.5 | 2>(1);
    const [isLoading, setIsLoading] = React.useState(false);

    // Color constants based on ownership
    const playedColor = isOwn ? 'rgb(255,255,255)' : 'rgb(5,150,105)';       // white : emerald-600
    const unplayedColor = isOwn ? 'rgba(255,255,255,0.3)' : 'rgb(209,213,219)'; // white/30 : gray-300

    React.useEffect(() => {
        if (initialDuration > 0) {
            setDuration(initialDuration);
            durationRef.current = initialDuration;
        }
    }, [initialDuration]);

    // Format time helper (no state, just returns string)
    const formatTime = (secs: number) => {
        if (!secs || isNaN(secs) || !isFinite(secs) || secs < 0) return '0:00';
        const m = Math.floor(secs / 60);
        const s = Math.floor(secs % 60);
        return `${m}:${s < 10 ? '0' : ''}${s}`;
    };

    // ── rAF animation loop: updates bars + timer directly on the DOM ──
    const animateWaveform = React.useCallback(() => {
        const audio = audioRef.current;
        if (!audio || !isPlayingRef.current) return;

        const effectiveDur = durationRef.current > 0 ? durationRef.current : 1;
        const fraction = audio.currentTime / effectiveDur;

        // Update bar colors directly (no React state)
        for (let i = 0; i < BAR_COUNT; i++) {
            const bar = barRefs.current[i];
            if (bar) {
                const barFraction = i / BAR_COUNT;
                bar.style.backgroundColor = barFraction <= fraction ? playedColor : unplayedColor;
            }
        }

        // Update timer text directly
        if (timerRef.current) {
            timerRef.current.textContent = formatTime(audio.currentTime > 0 ? audio.currentTime : effectiveDur);
        }

        rafIdRef.current = requestAnimationFrame(animateWaveform);
    }, [playedColor, unplayedColor]);

    const stopAnimation = React.useCallback(() => {
        if (rafIdRef.current) {
            cancelAnimationFrame(rafIdRef.current);
            rafIdRef.current = 0;
        }
    }, []);

    const startAnimation = React.useCallback(() => {
        stopAnimation();
        rafIdRef.current = requestAnimationFrame(animateWaveform);
    }, [animateWaveform, stopAnimation]);

    // Reset bars to unplayed state
    const resetBars = React.useCallback(() => {
        for (let i = 0; i < BAR_COUNT; i++) {
            const bar = barRefs.current[i];
            if (bar) bar.style.backgroundColor = unplayedColor;
        }
        if (timerRef.current) {
            timerRef.current.textContent = formatTime(durationRef.current);
        }
    }, [unplayedColor]);

    // ── Audio event listeners ──
    React.useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;

        isPlayingRef.current = false;
        setIsPlaying(false);
        resetBars();

        const handleLoadedMetadata = () => {
            if (audio.duration && isFinite(audio.duration) && audio.duration > 0) {
                setDuration(Math.round(audio.duration));
                durationRef.current = Math.round(audio.duration);
            } else if (initialDuration > 0) {
                setDuration(initialDuration);
                durationRef.current = initialDuration;
            }
            setIsLoading(false);
            // Update timer with actual duration
            if (timerRef.current) {
                timerRef.current.textContent = formatTime(durationRef.current);
            }
        };

        // Also try durationchange for WebM files that report Infinity initially
        const handleDurationChange = () => {
            if (audio.duration && isFinite(audio.duration) && audio.duration > 0) {
                setDuration(Math.round(audio.duration));
                durationRef.current = Math.round(audio.duration);
                if (timerRef.current && !isPlayingRef.current) {
                    timerRef.current.textContent = formatTime(durationRef.current);
                }
            }
        };

        const handlePlay = () => {
            isPlayingRef.current = true;
            setIsPlaying(true);
            startAnimation();
        };

        const handlePause = () => {
            isPlayingRef.current = false;
            setIsPlaying(false);
            stopAnimation();
        };

        const handleEnded = () => {
            isPlayingRef.current = false;
            setIsPlaying(false);
            stopAnimation();
            resetBars();
        };

        const handleWaiting = () => setIsLoading(true);
        const handleCanPlay = () => setIsLoading(false);

        audio.addEventListener('loadedmetadata', handleLoadedMetadata);
        audio.addEventListener('durationchange', handleDurationChange);
        audio.addEventListener('play', handlePlay);
        audio.addEventListener('pause', handlePause);
        audio.addEventListener('ended', handleEnded);
        audio.addEventListener('waiting', handleWaiting);
        audio.addEventListener('canplay', handleCanPlay);

        return () => {
            stopAnimation();
            audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
            audio.removeEventListener('durationchange', handleDurationChange);
            audio.removeEventListener('play', handlePlay);
            audio.removeEventListener('pause', handlePause);
            audio.removeEventListener('ended', handleEnded);
            audio.removeEventListener('waiting', handleWaiting);
            audio.removeEventListener('canplay', handleCanPlay);
        };
    }, [src, initialDuration, startAnimation, stopAnimation, resetBars]);

    // Cleanup rAF on unmount
    React.useEffect(() => {
        return () => stopAnimation();
    }, [stopAnimation]);

    const togglePlay = () => {
        const audio = audioRef.current;
        if (!audio) return;

        if (isPlaying) {
            audio.pause();
        } else {
            const playPromise = audio.play();
            if (playPromise !== undefined) {
                playPromise.catch(err => {
                    console.error('Audio play error:', err);
                    isPlayingRef.current = false;
                    setIsPlaying(false);
                    stopAnimation();
                });
            }
        }
    };

    const handleWaveClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!waveContainerRef.current || !audioRef.current) return;
        const rect = waveContainerRef.current.getBoundingClientRect();
        const clickX = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
        const fraction = clickX / rect.width;
        const effectiveDur = durationRef.current > 0 ? durationRef.current : 1;
        const newTime = fraction * effectiveDur;
        audioRef.current.currentTime = newTime;

        // Immediately update bars to reflect seek position (no waiting for next rAF)
        for (let i = 0; i < BAR_COUNT; i++) {
            const bar = barRefs.current[i];
            if (bar) {
                const barFraction = i / BAR_COUNT;
                bar.style.backgroundColor = barFraction <= fraction ? playedColor : unplayedColor;
            }
        }
        if (timerRef.current) {
            timerRef.current.textContent = formatTime(newTime);
        }
    };

    const cyclePlaybackRate = () => {
        const audio = audioRef.current;
        const nextRate = playbackRate === 1 ? 1.5 : playbackRate === 1.5 ? 2 : 1;
        if (audio) {
            audio.playbackRate = nextRate;
        }
        setPlaybackRate(nextRate);
    };

    return (
        <div
            className={`flex items-center gap-3 px-3.5 py-2.5 rounded-2xl select-none transition-colors ${
                isOwn
                    ? 'bg-emerald-700 text-white'
                    : 'bg-white text-gray-800 border border-gray-200'
            }`}
            style={{ width: '270px', maxWidth: '100%' }}
        >
            <audio ref={audioRef} src={src} preload="auto" />

            {/* Play/Pause Button */}
            <button
                type="button"
                onClick={togglePlay}
                disabled={isLoading && !isPlaying}
                className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 transition-transform active:scale-95 shadow-none ${
                    isOwn
                        ? 'bg-white text-emerald-700 hover:bg-emerald-50'
                        : 'bg-emerald-600 text-white hover:bg-emerald-700'
                }`}
                title={isPlaying ? 'Pause' : 'Play'}
            >
                {isLoading && !isPlaying ? (
                    <Loader2 size={15} className="animate-spin" />
                ) : isPlaying ? (
                    <Pause size={15} className="fill-current" />
                ) : (
                    <Play size={15} className="fill-current ml-0.5" />
                )}
            </button>

            {/* Waveform Scrubber & Timer */}
            <div className="flex-1 flex flex-col justify-center min-w-0">
                {/* Waveform Bars Container */}
                <div
                    ref={waveContainerRef}
                    onClick={handleWaveClick}
                    className="flex items-center justify-between gap-[2px] h-7 cursor-pointer py-1"
                    title="Click to seek"
                >
                    {DEFAULT_WAVEFORM.map((heightPercent, idx) => (
                        <div
                            key={idx}
                            className="flex-1 flex items-center justify-center h-full min-w-[2px]"
                        >
                            <span
                                ref={el => { barRefs.current[idx] = el; }}
                                className="w-full rounded-full"
                                style={{
                                    height: `${Math.max(heightPercent, 20)}%`,
                                    maxHeight: '100%',
                                    backgroundColor: unplayedColor,
                                    transition: 'none',
                                }}
                            />
                        </div>
                    ))}
                </div>

                {/* Duration & Current Time */}
                <div className="flex items-center justify-between text-[11px] font-mono leading-none mt-0.5">
                    <span
                        ref={timerRef}
                        className={isOwn ? 'text-white/90 font-semibold' : 'text-gray-700 font-semibold'}
                    >
                        {formatTime(duration)}
                    </span>
                    <button
                        type="button"
                        onClick={cyclePlaybackRate}
                        className={`px-1.5 py-0.5 rounded text-[10px] font-bold tracking-tight transition-colors ${
                            isOwn
                                ? 'bg-white/20 hover:bg-white/30 text-white'
                                : 'bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-200'
                        }`}
                        title="Playback Speed"
                    >
                        {playbackRate}x
                    </button>
                </div>
            </div>
        </div>
    );
}

/**
 * WhatsApp-Style Voice Note Wave Skeleton (exact same bubble dimension and layout)
 */
export function VoiceNoteWaveSkeleton({ isOwn = true }: { isOwn?: boolean }) {
    return (
        <div
            className={`flex items-center gap-3 px-3.5 py-2.5 rounded-2xl select-none animate-pulse ${
                isOwn
                    ? 'bg-emerald-700 text-white'
                    : 'bg-white text-gray-800 border border-gray-200'
            }`}
            style={{ width: '270px', maxWidth: '100%' }}
        >
            {/* Spinning/pulsing button skeleton */}
            <div
                className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
                    isOwn ? 'bg-white/30 text-white' : 'bg-emerald-100 text-emerald-600'
                }`}
            >
                <Loader2 size={16} className="animate-spin" />
            </div>

            {/* Waveform Bars skeleton */}
            <div className="flex-1 flex flex-col justify-center min-w-0">
                <div className="flex items-center justify-between gap-[2px] h-7 py-1">
                    {DEFAULT_WAVEFORM.map((heightPercent, idx) => (
                        <div key={idx} className="flex-1 flex items-center justify-center h-full min-w-[2px]">
                            <span
                                className={`w-full rounded-full ${
                                    isOwn ? 'bg-white/40' : 'bg-emerald-200'
                                }`}
                                style={{
                                    height: `${Math.max(heightPercent, 20)}%`,
                                }}
                            />
                        </div>
                    ))}
                </div>

                <div className="flex items-center justify-between text-[11px] font-mono leading-none mt-0.5">
                    <span className={isOwn ? 'text-white/70' : 'text-gray-400'}>
                        Sending audio...
                    </span>
                </div>
            </div>
        </div>
    );
}
